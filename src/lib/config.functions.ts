import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { DEFAULT_SETTINGS, normalizeSettings } from "@/lib/config-store";
import type { SchedulePeriod, SetupMethod, TimerSettings } from "@/lib/types";

/** Settings are stored in a JSONB column, which supabase-js types structurally. */
const asJson = (settings: TimerSettings) =>
  settings as unknown as Record<string, string | number | boolean>;

export interface ServerConfig {
  configured: boolean;
  instance: { id: string; subjectTitle: string; teacherName: string; setupMethod: SetupMethod };
  schedule: SchedulePeriod[];
  settings: TimerSettings;
}

export const getMyConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServerConfig | null> => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, subject_title, teacher_name, setup_method, schedule, settings, configured")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      configured: data.configured,
      instance: {
        id: data.id,
        subjectTitle: data.subject_title,
        teacherName: data.teacher_name,
        setupMethod: (data.setup_method as SetupMethod) ?? "manual",
      },
      schedule: (data.schedule as unknown as SchedulePeriod[]) ?? [],
      // Profiles saved before the clean-up alarm carry the old settings shape.
      settings: normalizeSettings(data.settings),
    };
  });

const alarmStyleSchema = z.enum(["chime", "buzzer", "bell", "soft_tone"]);

// Every field has a default so profiles written by an older build still save.
const settingsSchema = z
  .object({
    alarmStyle: alarmStyleSchema.default(DEFAULT_SETTINGS.alarmStyle),
    endAlarmEnabled: z.boolean().default(DEFAULT_SETTINGS.endAlarmEnabled),
    alarmAutoOffSeconds: z.number().int().min(2).max(15).default(DEFAULT_SETTINGS.alarmAutoOffSeconds),
    cleanupLeadMinutes: z.number().int().min(0).max(60).default(DEFAULT_SETTINGS.cleanupLeadMinutes),
    cleanupAlarmEnabled: z.boolean().default(DEFAULT_SETTINGS.cleanupAlarmEnabled),
    cleanupAlarmStyle: alarmStyleSchema.default(DEFAULT_SETTINGS.cleanupAlarmStyle),
    behaviorScoringEnabled: z.boolean().default(DEFAULT_SETTINGS.behaviorScoringEnabled),
    dayStartTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .default(DEFAULT_SETTINGS.dayStartTime),
    defaultPeriodMinutes: z.number().int().min(5).max(240).default(DEFAULT_SETTINGS.defaultPeriodMinutes),
    defaultPassingMinutes: z.number().int().min(0).max(60).default(DEFAULT_SETTINGS.defaultPassingMinutes),
    // Accepted and dropped: superseded by cleanupLeadMinutes.
    transitionSameGradeMin: z.number().optional(),
    transitionGradeChangeMin: z.number().optional(),
  })
  .transform((s): TimerSettings => normalizeSettings(s));

const periodSchema = z.object({
  id: z.string().min(1),
  dayOfWeek: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  periodType: z.enum(["class", "duty", "recess"]),
  grade: z.string().max(60).optional(),
  classroomTeacher: z.string().max(120).optional(),
  roomNumber: z.string().max(60).optional(),
  dutyLabel: z.string().max(120).optional(),
  cleanupMinutes: z.number().int().min(0).max(60).nullable().optional(),
  className: z.string().max(60).optional(),
  note: z.string().max(240).optional(),
});

const configSchema = z.object({
  instance: z.object({
    subjectTitle: z.string().max(120),
    teacherName: z.string().max(120),
    setupMethod: z.enum(["manual", "scheduler_ops"]),
  }),
  schedule: z.array(periodSchema).max(200),
  settings: settingsSchema,
});

export const saveMyConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => configSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        subject_title: data.instance.subjectTitle,
        teacher_name: data.instance.teacherName,
        setup_method: data.instance.setupMethod,
        schedule: data.schedule,
        settings: asJson(data.settings),
        configured: true,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateMySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ settings: data })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("sessions").delete().eq("owner_id", context.userId);
    const { error } = await context.supabase
      .from("profiles")
      .update({
        subject_title: "",
        teacher_name: "",
        setup_method: "manual",
        schedule: [],
        settings: asJson(DEFAULT_SETTINGS),
        configured: false,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
