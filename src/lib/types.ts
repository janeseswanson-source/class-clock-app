// Data model — mirrors Supabase shape for Phase 5. Kept in one place so
// Phase 3 can wire storage without touching components.

export type SetupMethod = "manual" | "scheduler_ops";

export interface TimerInstance {
  id: string;
  subjectTitle: string; // e.g. "Art Class"
  teacherName: string; // e.g. "Ms. Ferguson"
  setupMethod: SetupMethod;
}

export type PeriodType = "class" | "duty" | "recess";

/** Monday–Friday. Matches Date#getDay() for those days. */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5;

export interface SchedulePeriod {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  periodType: PeriodType;
  // class
  grade?: string;
  classroomTeacher?: string;
  roomNumber?: string;
  // duty / recess
  dutyLabel?: string;
  // Per-period clean-up override, in minutes before endTime.
  // Nullish means "inherit settings.cleanupLeadMinutes".
  cleanupMinutes?: number | null;
}

export type BehaviorScore = 1 | 2 | 3 | 4 | 5;

export interface ClassSession {
  date: string; // "YYYY-MM-DD"
  schedulePeriodId: string;
  behaviorScore: BehaviorScore | null;
  ratingLabel: string | null;
  scoreLoggedAt: string | null;
  edited: boolean;
}

export type AlarmStyle = "chime" | "buzzer" | "bell" | "soft_tone";

export interface TimerSettings {
  // End-of-class alarm
  alarmStyle: AlarmStyle;
  endAlarmEnabled: boolean; // default true
  alarmAutoOffSeconds: number; // default 6, 2-15

  // Clean-up alarm: rings this many minutes before a class ends.
  // A period can override the lead time via SchedulePeriod.cleanupMinutes.
  cleanupLeadMinutes: number; // default 5
  cleanupAlarmEnabled: boolean; // default true
  cleanupAlarmStyle: AlarmStyle; // default "soft_tone"

  behaviorScoringEnabled: boolean; // default true

  // Defaults the schedule editor uses when creating periods.
  dayStartTime: string; // "HH:mm", default "08:05"
  defaultPeriodMinutes: number; // default 40
  defaultPassingMinutes: number; // default 5
}

/** Pre-clean-up-alarm settings shape, still present in saved profiles. */
export interface LegacyTimerSettings {
  transitionSameGradeMin?: number;
  transitionGradeChangeMin?: number;
}

export const RATING_LABELS: Record<BehaviorScore, string> = {
  5: "Outstanding",
  4: "Super",
  3: "Needs improvement",
  2: "Below expectations",
  1: "Unsatisfactory",
};
