interface DetailsFormProps {
  subjectTitle: string;
  teacherName: string;
  onChange: (next: { subjectTitle: string; teacherName: string }) => void;
}

export function DetailsForm({ subjectTitle, teacherName, onChange }: DetailsFormProps) {
  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-xs font-bold tracking-[0.2em] text-navy/60">
          SUBJECT TITLE
        </span>
        <input
          type="text"
          value={subjectTitle}
          maxLength={40}
          onChange={(e) =>
            onChange({ subjectTitle: e.target.value, teacherName })
          }
          placeholder="Art Class"
          className="mt-2 w-full rounded-xl border-2 border-navy/15 bg-white px-4 py-3 text-lg font-bold text-navy focus:border-gold focus:outline-none"
        />
        <span className="mt-1 block text-xs text-navy/50">
          Shown large across the top of the wall display.
        </span>
      </label>

      <label className="block">
        <span className="text-xs font-bold tracking-[0.2em] text-navy/60">
          YOUR NAME
        </span>
        <input
          type="text"
          value={teacherName}
          maxLength={60}
          onChange={(e) =>
            onChange({ subjectTitle, teacherName: e.target.value })
          }
          placeholder="Ms. Ferguson"
          className="mt-2 w-full rounded-xl border-2 border-navy/15 bg-white px-4 py-3 text-lg text-navy focus:border-gold focus:outline-none"
        />
        <span className="mt-1 block text-xs text-navy/50">
          Used on exported behavior reports.
        </span>
      </label>
    </div>
  );
}
