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

export interface SchedulePeriod {
  id: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  periodType: PeriodType;
  // class
  grade?: string;
  classroomTeacher?: string;
  roomNumber?: string;
  // duty / recess
  dutyLabel?: string;
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
  alarmStyle: AlarmStyle;
  alarmAutoOffSeconds: number; // default 6, 2-15
  transitionSameGradeMin: number; // default 5
  transitionGradeChangeMin: number; // default 10
  behaviorScoringEnabled: boolean; // default true
}

export const RATING_LABELS: Record<BehaviorScore, string> = {
  5: "Outstanding",
  4: "Super",
  3: "Needs improvement",
  2: "Below expectations",
  1: "Unsatisfactory",
};
