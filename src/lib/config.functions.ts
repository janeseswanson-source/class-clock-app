import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { SchedulePeriod, SetupMethod, TimerSettings } from "@/lib/types";

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
      schedule: (data.schedule as SchedulePeriod[]) ?? [],
      settings: data.settings as TimerSettings,
    };
  });

const settingsSchema = z.object({
  alarmStyle: z.enum(["chime", "buzzer", "bell", "soft_tone"]),
  alarmAutoOffSeconds: z.number().int().min(2).max(15),
  transitionSameGradeMin: z.number().int().min(0).max(60),
  transitionGradeChangeMin: z.number().int().min(0).max(60),
  behaviorScoringEnabled: z.boolean(),
});

const configSchema = z.object({
  instance: z.object({
    subjectTitle: z.string().max(120),
    teacherName: z.string().max(120),
    setupMethod: z.enum(["manual", "scheduler_ops"]),
  }),
  schedule: z.array(z.any()),
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
        settings: data.settings,
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
        configured: false,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
