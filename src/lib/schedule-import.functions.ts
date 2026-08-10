import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { newPeriodId, DAYS, GRADES, parseTimeInput } from "@/lib/schedule";
import type { SchedulePeriod } from "@/lib/types";
// Type-only — erased at compile time, so this does not pull the SDK (or the
// API key handling in anthropic.server.ts) into the client bundle.
import type Anthropic from "@anthropic-ai/sdk";

// One file at a time, capped well under Claude's per-request limits (32MB for
// PDFs) so a phone photo or a multi-page export can't run away with tokens.
const MAX_BASE64_LENGTH = 11_000_000; // ~8MB decoded

export const EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const;

export const SUPPORTED_MIME_TYPES = [
  "text/csv",
  "text/plain",
  "text/tab-separated-values",
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  ...EXCEL_MIME_TYPES,
] as const;


export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

const inputSchema = z.object({
  filename: z.string().max(200),
  mimeType: z.enum(SUPPORTED_MIME_TYPES),
  dataBase64: z.string().max(MAX_BASE64_LENGTH),
});

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

// Hand-written JSON Schema for Claude's structured-output mode (rather than
// the SDK's zodOutputFormat helper) — that helper builds its schema through
// zod's internal v4 bridge, while this project's schemas are authored against
// plain zod v3. Keeping the wire schema and the validation schema below as two
// explicit, independently-readable definitions avoids depending on an
// unverified v3/v4 interop path for a feature we can't test against the live
// API in this environment.
//
// Strict structured-output mode requires every property to be listed in
// `required`; "optional" fields are instead typed nullable.
const nullableString = { type: ["string", "null"] } as const;
const SCHEDULE_EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    periods: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string", enum: DAY_NAMES },
          periodType: { type: "string", enum: ["class", "recess", "duty"] },
          startTime: { type: "string", description: "24-hour HH:mm" },
          endTime: { type: "string", description: "24-hour HH:mm" },
          grade: nullableString,
          className: nullableString,
          classroomTeacher: nullableString,
          roomNumber: nullableString,
          dutyLabel: nullableString,
          note: nullableString,
        },
        required: [
          "day",
          "periodType",
          "startTime",
          "endTime",
          "grade",
          "className",
          "classroomTeacher",
          "roomNumber",
          "dutyLabel",
          "note",
        ],
        additionalProperties: false,
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "One entry per row you were unsure about or skipped, in plain English.",
    },
  },
  required: ["periods", "warnings"],
  additionalProperties: false,
} as const;

const extractedPeriodSchema = z.object({
  day: z.enum(DAY_NAMES),
  periodType: z.enum(["class", "recess", "duty"]),
  startTime: z.string(),
  endTime: z.string(),
  grade: z.string().nullable(),
  className: z.string().nullable(),
  classroomTeacher: z.string().nullable(),
  roomNumber: z.string().nullable(),
  dutyLabel: z.string().nullable(),
  note: z.string().nullable(),
});

const extractionResultSchema = z.object({
  periods: z.array(extractedPeriodSchema),
  warnings: z.array(z.string()),
});

type ExtractedPeriod = z.infer<typeof extractedPeriodSchema>;

const SYSTEM_PROMPT = `You extract a K-6 specialist teacher's weekly class schedule from an
uploaded file (a spreadsheet export, a plain-text list, a PDF, or a photo of a printed schedule)
so it can be imported into a scheduling app.

Return one entry per period (class, recess, or duty) across Monday-Friday. For each:

- "day": the weekday it falls on. If the file shows a date instead of a day name, work out the
  weekday yourself. Ignore weekend rows.
- "periodType": "class" for a specialist class period with students; "recess" for a student
  recess/break; "duty" for anything else — dismissal, lunch supervision, bus duty, arrival, etc.
- "startTime"/"endTime": 24-hour "HH:mm".
- "grade": the grade level (Kindergarten through 6th), using exactly one of these values when a
  class has a grade: ${GRADES.join(", ")}. Only for periodType "class".
- "className": a homeroom or section label DISTINCT from grade, e.g. "Kinder A" vs a grade of
  "Kinder" — only set this when the file gives a separate class/section identifier beyond the
  grade level. Only for periodType "class".
- "classroomTeacher" / "roomNumber": only for periodType "class", if given.
- "dutyLabel": a short label for a "duty" or "recess" period, e.g. "Dismissal", "Lunch duty",
  "Recess". Leave null for "class" periods.
- "note": short free-text detail attached to a CLASS period that doesn't fit elsewhere — e.g. a
  pickup or drop-off location, "take to lunch after class". If a row's entire content IS a
  non-class event (dismissal, lunch duty) rather than a specialist class with an aside, classify
  it as "duty" with that in "dutyLabel" instead — don't invent a class to hold it.

Fields that don't apply or aren't given in the file must be null, never omitted or empty string.

If a row is ambiguous, make your best judgment call and add a one-line explanation to "warnings"
rather than guessing silently. If the file doesn't look like a class schedule at all, return an
empty "periods" array and explain why in "warnings".`;

type FileContentBlock =
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
  | { type: "image"; source: { type: "base64"; media_type: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; data: string } }
  | { type: "text"; text: string };

async function contentBlockForFile(
  mimeType: (typeof SUPPORTED_MIME_TYPES)[number],
  base64: string,
): Promise<{ block: FileContentBlock; warnings: string[] }> {
  if (mimeType === "application/pdf") {
    return {
      block: { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
      warnings: [],
    };
  }
  if (mimeType.startsWith("image/")) {
    return {
      block: {
        type: "image",
        source: { type: "base64", media_type: mimeType as "image/png" | "image/jpeg" | "image/webp" | "image/gif", data: base64 },
      },
      warnings: [],
    };
  }
  if (EXCEL_MIME_TYPES.includes(mimeType as (typeof EXCEL_MIME_TYPES)[number])) {
    const { workbookToText } = await import("@/lib/xlsx.server");
    const { text, warnings } = workbookToText(base64);
    return { block: { type: "text", text }, warnings };
  }
  // text/csv, text/plain, text/tab-separated-values — inline as plain text.
  const text = Buffer.from(base64, "base64").toString("utf-8");
  return { block: { type: "text", text }, warnings: [] };
}


function toSchedulePeriod(p: ExtractedPeriod): SchedulePeriod {
  const dayOfWeek = DAYS.find((d) => d.label === p.day)?.id ?? 1;
  const startTime = parseTimeInput(p.startTime) ?? "08:00";
  const endTime = parseTimeInput(p.endTime) ?? "08:40";
  const base = {
    id: newPeriodId(),
    dayOfWeek,
    startTime,
    endTime,
    cleanupMinutes: null,
    note: p.note ?? undefined,
  };
  if (p.periodType === "class") {
    return {
      ...base,
      periodType: "class",
      grade: p.grade ?? undefined,
      className: p.className ?? undefined,
      classroomTeacher: p.classroomTeacher ?? undefined,
      roomNumber: p.roomNumber ?? undefined,
    };
  }
  return {
    ...base,
    periodType: p.periodType,
    dutyLabel: p.dutyLabel ?? undefined,
  };
}

export const analyzeScheduleFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ periods: SchedulePeriod[]; warnings: string[] }> => {
    const { anthropicClient } = await import("@/lib/anthropic.server");

    const decodedLength = Math.ceil((data.dataBase64.length * 3) / 4);
    if (decodedLength > 8_500_000) {
      throw new Error("That file is too large — try a smaller file or a lower-resolution photo.");
    }

    const fileBlock = contentBlockForFile(data.mimeType, data.dataBase64);

    let response;
    try {
      response = await anthropicClient.messages.create({
        model: "claude-opus-5",
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        output_config: { format: { type: "json_schema", schema: SCHEDULE_EXTRACTION_JSON_SCHEMA } },
        messages: [
          {
            role: "user",
            content: [
              fileBlock,
              {
                type: "text",
                text: `Extract the weekly schedule from "${data.filename}".`,
              },
            ],
          },
        ],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new Error(`Couldn't reach the AI service to read this file: ${message}`);
    }

    if (response.stop_reason === "refusal") {
      throw new Error("The AI couldn't process this file. Try a different file or format.");
    }
    if (response.stop_reason === "max_tokens") {
      throw new Error("This file has too much content to read in one pass — try a shorter file.");
    }

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) {
      throw new Error("The AI didn't return a readable schedule for this file.");
    }

    let raw: unknown;
    try {
      raw = JSON.parse(textBlock.text);
    } catch {
      throw new Error("The AI's response wasn't valid — try again or use a different file.");
    }

    const parsed = extractionResultSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error("The AI's response didn't match the expected schedule format.");
    }

    return {
      periods: parsed.data.periods.map(toSchedulePeriod),
      warnings: parsed.data.warnings,
    };
  });
