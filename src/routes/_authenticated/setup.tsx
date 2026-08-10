import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { WizardShell } from "@/components/setup/WizardShell";
import { DetailsForm } from "@/components/setup/DetailsForm";
import { MethodPicker } from "@/components/setup/MethodPicker";
import { ScheduleBuilder } from "@/components/setup/ScheduleBuilder";
import { AIImportPanel } from "@/components/setup/AIImportPanel";
import { WeekPreview } from "@/components/setup/WeekPreview";
import { useConfig } from "@/hooks/useConfig";
import { DEFAULT_SETTINGS } from "@/lib/config-store";
import { conflictsByDay } from "@/lib/schedule";
import type {
  SchedulePeriod,
  SetupMethod,
  TimerInstance,
  TimerSettings,
} from "@/lib/types";

export const Route = createFileRoute("/_authenticated/setup")({
  head: () => ({
    meta: [
      { title: "Setup — Next Specials Timer" },
      {
        name: "description",
        content:
          "Create your specialist schedule and set up your classroom wall display.",
      },
      { property: "og:title", content: "Setup — Next Specials Timer" },
      {
        property: "og:description",
        content:
          "Create your specialist schedule and set up your classroom wall display.",
      },
    ],
  }),
  component: SetupWizard,
});

function makeInstance(subjectTitle: string, teacherName: string, method: SetupMethod): TimerInstance {
  return {
    id: `inst-${Date.now()}`,
    subjectTitle: subjectTitle.trim() || "My Class",
    teacherName: teacherName.trim() || "Teacher",
    setupMethod: method,
  };
}

function SetupWizard() {
  const navigate = useNavigate();
  const { config, save } = useConfig();

  const [step, setStep] = useState(1);
  const [subjectTitle, setSubjectTitle] = useState(config?.instance.subjectTitle ?? "");
  const [teacherName, setTeacherName] = useState(config?.instance.teacherName ?? "");
  const [method, setMethod] = useState<SetupMethod>(
    config?.instance.setupMethod ?? "manual",
  );
  const [schedule, setSchedule] = useState<SchedulePeriod[]>(config?.schedule ?? []);
  const [settings, setSettings] = useState<TimerSettings>(
    config?.settings ?? DEFAULT_SETTINGS,
  );
  const [saving, setSaving] = useState(false);

  const totalSteps = 4;

  const detailsValid =
    subjectTitle.trim().length > 0 && teacherName.trim().length > 0;
  const conflicts = useMemo(() => conflictsByDay(schedule), [schedule]);
  const scheduleValid = schedule.length > 0 && conflicts.size === 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({
        instance: makeInstance(subjectTitle, teacherName, method),
        schedule,
        settings,
      });
      toast.success("Timer is ready", {
        description: `${schedule.length} periods saved across the week.`,
      });
      navigate({ to: "/" });
    } catch (err) {
      toast.error("Couldn't save your schedule", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  const shell = useMemo(() => {
    switch (step) {
      case 1:
        return {
          title: "Welcome — let's set up your timer",
          subtitle:
            "A couple of details first. You can change these later in Settings.",
          nextLabel: "Continue",
          nextDisabled: !detailsValid,
          onNext: () => setStep(2),
          onBack: undefined,
          body: (
            <DetailsForm
              subjectTitle={subjectTitle}
              teacherName={teacherName}
              onChange={({ subjectTitle: s, teacherName: t }) => {
                setSubjectTitle(s);
                setTeacherName(t);
              }}
            />
          ),
        };
      case 2:
        return {
          title: "How would you like to add your schedule?",
          subtitle:
            "Both paths land in the same weekly editor before you save.",
          nextLabel: method === "manual" ? "Build schedule" : "Import periods",
          nextDisabled: false,
          onNext: () => setStep(3),
          onBack: back,
          body: <MethodPicker value={method} onChange={setMethod} />,
        };
      case 3:
        return {
          title:
            method === "manual"
              ? "Your weekly schedule"
              : "Import from Scheduler Ops",
          subtitle:
            method === "manual"
              ? "Set the time your day starts, generate your rotation, then fill in grades and teachers. Drag any block on the timeline to adjust it."
              : "Upload whatever you have — we'll read it and fill in the schedule, then you can adjust anything that needs a tweak.",
          nextLabel: "Review",
          nextDisabled: !scheduleValid,
          onNext: () => setStep(4),
          onBack: back,
          body:
            method === "manual" ? (
              <ScheduleBuilder
                periods={schedule}
                onChange={setSchedule}
                settings={settings}
                onSettingsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
              />
            ) : (
              <div className="space-y-6">
                <AIImportPanel onImport={setSchedule} count={schedule.length} />
                {schedule.length > 0 ? (
                  <div>
                    <div className="text-xs font-bold tracking-[0.2em] text-navy/60 mb-2">
                      REFINE IMPORTED PERIODS
                    </div>
                    <ScheduleBuilder
                      periods={schedule}
                      onChange={setSchedule}
                      settings={settings}
                      onSettingsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
                    />
                  </div>
                ) : null}
              </div>
            ),
        };
      case 4:
      default:
        return {
          title: "Review & save",
          subtitle:
            "Here's your full week. Save to start the timer, or go back to edit.",
          nextLabel: saving ? "Saving…" : "Save & start timer",
          nextDisabled: !detailsValid || !scheduleValid || saving,
          onNext: handleSave,
          onBack: back,
          body: (
            <div className="space-y-5">
              <div className="rounded-2xl bg-gold-soft p-4 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black text-navy uppercase">
                    {subjectTitle || "My Class"}
                  </div>
                  <div className="text-sm text-navy/70">
                    {teacherName || "Teacher"} · {method === "manual" ? "Manual entry" : "Scheduler Ops import"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-navy underline underline-offset-4 hover:text-navy/70"
                >
                  Edit details
                </button>
              </div>
              <div className="rounded-2xl border-2 border-navy/10 p-4 text-sm text-navy/70">
                <b className="text-navy">Clean-up alarm</b> rings{" "}
                {settings.cleanupLeadMinutes} minutes before each class ends, and the
                end-of-class alarm rings at the bell. Both auto-silence after{" "}
                {settings.alarmAutoOffSeconds} seconds — you can change all of this,
                or override a single class, in Settings.
              </div>
              <WeekPreview periods={schedule} />
            </div>
          ),
        };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, subjectTitle, teacherName, method, schedule, settings, saving, detailsValid, scheduleValid]);

  return (
    <WizardShell
      step={step}
      totalSteps={totalSteps}
      title={shell.title}
      subtitle={shell.subtitle}
      onBack={shell.onBack}
      onNext={shell.onNext}
      nextLabel={shell.nextLabel}
      nextDisabled={shell.nextDisabled}
    >
      {shell.body}
    </WizardShell>
  );
}
