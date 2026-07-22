import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "@/components/settings/GeneralTab";
import { DetailsForm } from "@/components/setup/DetailsForm";
import { ScheduleBuilder } from "@/components/setup/ScheduleBuilder";
import { WeekPreview } from "@/components/setup/WeekPreview";
import { useConfig } from "@/hooks/useConfig";
import { useSessions } from "@/hooks/useSessions";
import { DEFAULT_SETTINGS, clearConfig } from "@/lib/config-store";
import { downloadBlob, toCSV } from "@/lib/csv";
import type { SchedulePeriod, TimerInstance, TimerSettings } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Next Specials Timer" },
      { name: "description", content: "Tune alarm sounds, transitions, schedule, and manage your behavior data." },
      { property: "og:title", content: "Settings — Next Specials Timer" },
      { property: "og:description", content: "Tune alarm sounds, transitions, schedule, and manage your behavior data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { config, isLoaded, save } = useConfig();
  const { sessions, clearAll } = useSessions();

  const [draft, setDraft] = useState<{
    instance: TimerInstance;
    schedule: SchedulePeriod[];
    settings: TimerSettings;
  } | null>(null);

  useEffect(() => {
    if (config && !draft) {
      setDraft({
        instance: config.instance,
        schedule: config.schedule,
        settings: config.settings ?? DEFAULT_SETTINGS,
      });
    }
  }, [config, draft]);

  if (!isLoaded) return <div className="min-h-screen bg-background" />;
  if (!config || !draft) return <Navigate to="/setup" />;

  const dirty =
    JSON.stringify(draft) !==
    JSON.stringify({
      instance: config.instance,
      schedule: config.schedule,
      settings: config.settings ?? DEFAULT_SETTINGS,
    });

  const handleSave = () => save(draft);

  const exportAllCSV = () => {
    const rows = Object.values(sessions)
      .flat()
      .map((s) => {
        const p = config.schedule.find((sp) => sp.id === s.schedulePeriodId);
        return {
          date: s.date,
          startTime: p?.startTime ?? "",
          endTime: p?.endTime ?? "",
          grade: p?.grade ?? "",
          classroomTeacher: p?.classroomTeacher ?? "",
          room: p?.roomNumber ?? "",
          score: s.behaviorScore,
          ratingLabel: s.ratingLabel,
          scoreLoggedAt: s.scoreLoggedAt,
          edited: s.edited,
        };
      });
    downloadBlob(`behavior-all.csv`, toCSV(rows));
  };

  const resetApp = () => {
    if (!window.confirm("Reset the entire app? Your schedule, settings, and behavior data will all be erased.")) return;
    clearAll();
    clearConfig();
    navigate({ to: "/setup" });
  };

  const clearBehavior = () => {
    if (!window.confirm("Delete every behavior score you've recorded? This can't be undone.")) return;
    clearAll();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans pb-28">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl p-1.5 bg-gold">
          <div className="rounded-3xl p-1 bg-background">
            <div className="rounded-3xl border-2 border-navy bg-white p-6 md:p-10">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-navy/70 hover:text-navy">
                <ArrowLeft className="h-4 w-4" /> Back to timer
              </Link>
              <h1 className="mt-3 text-3xl md:text-4xl font-black tracking-tight text-navy">Settings</h1>
              <p className="mt-1 text-sm text-navy/60">
                Configure the timer, edit your schedule, and manage behavior data.
              </p>
              <div className="mt-6 border-t-2 border-gold" />

              <Tabs defaultValue="general" className="mt-6">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="data">Data</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="pt-6">
                  <GeneralTab
                    settings={draft.settings}
                    onChange={(patch) => setDraft({ ...draft, settings: { ...draft.settings, ...patch } })}
                  />
                </TabsContent>

                <TabsContent value="schedule" className="pt-6 space-y-6">
                  <ScheduleBuilder
                    periods={draft.schedule}
                    onChange={(schedule) => setDraft({ ...draft, schedule })}
                  />
                  <div>
                    <div className="text-xs font-bold tracking-[0.2em] text-navy/60 mb-2">
                      WEEK PREVIEW
                    </div>
                    <WeekPreview periods={draft.schedule} />
                  </div>
                  <div>
                    <Link to="/setup" className="text-sm font-bold text-navy underline underline-offset-4 hover:text-navy/70">
                      Re-run setup wizard →
                    </Link>
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="pt-6">
                  <DetailsForm
                    subjectTitle={draft.instance.subjectTitle}
                    teacherName={draft.instance.teacherName}
                    onChange={({ subjectTitle, teacherName }) =>
                      setDraft({ ...draft, instance: { ...draft.instance, subjectTitle, teacherName } })
                    }
                  />
                </TabsContent>

                <TabsContent value="data" className="pt-6 space-y-4">
                  <DataRow
                    title="Export all behavior data"
                    desc="Downloads every recorded score as a CSV file."
                    action={<button type="button" onClick={exportAllCSV} className="rounded-full bg-navy text-white px-4 py-2 text-sm font-bold hover:bg-navy/90">Export CSV</button>}
                  />
                  <DataRow
                    title="Clear behavior data"
                    desc="Removes all stored scores. Your schedule and settings stay put."
                    action={<button type="button" onClick={clearBehavior} className="rounded-full border-2 border-destructive text-destructive px-4 py-2 text-sm font-bold hover:bg-destructive/10">Clear scores</button>}
                  />
                  <DataRow
                    title="Reset entire app"
                    desc="Wipes schedule, settings, and behavior data, then restarts setup."
                    action={<button type="button" onClick={resetApp} className="rounded-full bg-destructive text-white px-4 py-2 text-sm font-bold hover:bg-destructive/90">Reset app</button>}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {dirty ? (
        <div className="fixed inset-x-0 bottom-4 flex justify-center px-4 z-50">
          <div className="rounded-full bg-navy text-white px-4 py-2 shadow-lg flex items-center gap-3">
            <span className="text-sm">Unsaved changes</span>
            <button
              type="button"
              onClick={() => setDraft({
                instance: config.instance,
                schedule: config.schedule,
                settings: config.settings ?? DEFAULT_SETTINGS,
              })}
              className="text-xs font-bold text-white/70 hover:text-white"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-full bg-gold text-navy px-3 py-1 text-xs font-bold hover:bg-gold/90"
            >
              Save changes
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DataRow({ title, desc, action }: { title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border-2 border-navy/10 bg-white p-4 gap-4">
      <div>
        <div className="text-sm font-bold text-navy">{title}</div>
        <div className="text-xs text-navy/60">{desc}</div>
      </div>
      {action}
    </div>
  );
}
