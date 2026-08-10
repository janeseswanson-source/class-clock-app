// Server-only: converts an Excel workbook into plain text the AI can read.
// Every non-empty sheet is emitted as CSV under a labelled header so the model
// can tell tabs apart (e.g. one tab per day) and skip legend/roster tabs.
import * as XLSX from "xlsx";

export const MAX_WORKBOOK_TEXT_LENGTH = 400_000;

export interface WorkbookText {
  text: string;
  warnings: string[];
}

export function workbookToText(base64: string): WorkbookText {
  const buffer = Buffer.from(base64, "base64");
  let workbook: XLSX.WorkBook;
  try {
    // cellDates keeps real date/time cells as Dates; raw:false below renders
    // them with their display format so times read as "9:15 AM", not 0.385.
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  } catch {
    throw new Error("Couldn't read that spreadsheet — try re-saving it as .xlsx or exporting to CSV.");
  }

  const warnings: string[] = [];
  const chunks: string[] = [];
  let used = 0;

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false, rawNumbers: false }).trim();
    if (!csv) continue;
    chunks.push(`=== Sheet: "${name}" ===\n${csv}`);
    used += csv.length;
  }

  if (chunks.length === 0) {
    throw new Error("That spreadsheet looks empty — check the file and try again.");
  }

  let text = chunks.join("\n\n");
  if (text.length > MAX_WORKBOOK_TEXT_LENGTH) {
    text = text.slice(0, MAX_WORKBOOK_TEXT_LENGTH);
    warnings.push(
      "This workbook was too large to read in full, so only the first part was analyzed. Check for missing periods.",
    );
  }
  void used;

  return { text, warnings };
}
