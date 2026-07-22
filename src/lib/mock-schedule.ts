import type { SchedulePeriod, TimerInstance } from "./types";

export const mockInstance: TimerInstance = {
  id: "mock-1",
  subjectTitle: "Art Class",
  teacherName: "Ms. Ferguson",
  setupMethod: "manual",
};

// Friday schedule from reference image 01
export const mockPeriods: SchedulePeriod[] = [
  {
    id: "p1",
    dayOfWeek: 5,
    startTime: "08:00",
    endTime: "08:40",
    periodType: "class",
    grade: "Kinder",
    classroomTeacher: "Ms. Tempo",
    roomNumber: "Rm G-1",
  },
  {
    id: "p2",
    dayOfWeek: 5,
    startTime: "08:45",
    endTime: "09:25",
    periodType: "class",
    grade: "1st grade",
    classroomTeacher: "Ms. Ferguson",
    roomNumber: "Rm H-11",
  },
  {
    id: "p3",
    dayOfWeek: 5,
    startTime: "09:25",
    endTime: "09:40",
    periodType: "recess",
    dutyLabel: "Recess",
  },
  {
    id: "p4",
    dayOfWeek: 5,
    startTime: "09:40",
    endTime: "10:20",
    periodType: "class",
    grade: "2nd grade",
    classroomTeacher: "Ms. Coonradt",
    roomNumber: "Rm I-15",
  },
  {
    id: "p5",
    dayOfWeek: 5,
    startTime: "10:25",
    endTime: "11:05",
    periodType: "class",
    grade: "3rd grade",
    classroomTeacher: "Ms. Nishijima",
    roomNumber: "Rm J-23",
  },
  {
    id: "p6",
    dayOfWeek: 5,
    startTime: "11:10",
    endTime: "11:50",
    periodType: "class",
    grade: "4th grade",
    classroomTeacher: "Ms. Tursi Lee",
    roomNumber: "Rm J-19",
  },
  {
    id: "p7",
    dayOfWeek: 5,
    startTime: "13:00",
    endTime: "13:40",
    periodType: "class",
    grade: "5th grade",
    classroomTeacher: "Ms. Nunez",
    roomNumber: "Rm K-28",
  },
];

// For Phase 1 static display: mark 1st grade (p2) as current.
export const mockCurrentPeriodId = "p2";
export const mockPastPeriodIds = new Set(["p1"]);
// Static clock/countdown values
export const mockClockTime = { h: 8, m: 45, s: 1 }; // ~ start of p2, just after
export const mockRemaining = { h: 0, m: 39, s: 59 };
export const mockDateLabel = "Fri, Jun 27";
