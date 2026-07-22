import { createFileRoute } from "@tanstack/react-router";
import { AnalogClock } from "@/components/display/AnalogClock";
import { CountdownStand } from "@/components/display/CountdownStand";
import { DisplayHeader } from "@/components/display/DisplayHeader";
import { ScheduleList } from "@/components/display/ScheduleList";
import { ReportFooter } from "@/components/display/ReportFooter";
import {
  mockInstance,
  mockPeriods,
  mockCurrentPeriodId,
  mockPastPeriodIds,
  mockClockTime,
  mockRemaining,
  mockDateLabel,
} from "@/lib/mock-schedule";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Next Specials Timer — Art Class" },
      {
        name: "description",
        content:
          "Classroom wall display for specialist teachers: analog clock, live countdown, and daily schedule with behavior scoring.",
      },
      { property: "og:title", content: "Next Specials Timer — Art Class" },
      {
        property: "og:description",
        content:
          "Classroom wall display for specialist teachers: analog clock, live countdown, and daily schedule with behavior scoring.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-5xl">
        {/* double-border frame: outer gold, inner navy, white surface */}
        <div className="rounded-3xl p-1.5 bg-gold">
          <div className="rounded-3xl p-1 bg-background">
            <div className="rounded-3xl border-2 border-navy bg-white p-6 md:p-10">
              <DisplayHeader
                subjectTitle={mockInstance.subjectTitle.toUpperCase()}
                dateLabel={mockDateLabel}
              />

              <div className="mt-4 border-t-2 border-gold" />

              <div className="mt-8 flex flex-col items-center">
                <div className="w-64 md:w-80">
                  <AnalogClock
                    hours={mockClockTime.h}
                    minutes={mockClockTime.m}
                    seconds={mockClockTime.s}
                  />
                </div>

                <div className="mt-2">
                  <CountdownStand
                    hours={mockRemaining.h}
                    minutes={mockRemaining.m}
                    seconds={mockRemaining.s}
                  />
                </div>

                <div className="mt-5 rounded-full bg-gold-soft px-6 py-2 text-navy font-bold text-sm">
                  Class in session
                </div>
                <div className="mt-3 text-xs font-bold tracking-[0.25em] text-navy/60">
                  TODAY'S CLASSES
                </div>
              </div>

              <div className="mt-4">
                <ScheduleList
                  periods={mockPeriods}
                  currentPeriodId={mockCurrentPeriodId}
                  pastPeriodIds={mockPastPeriodIds}
                />
              </div>

              <div className="mt-6">
                <ReportFooter />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
