export type RawStatus = "new" | "in_progress" | "done";
export type DisplayStatus = RawStatus | "overdue";

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  new: "新規",
  in_progress: "対応中",
  done: "完了",
  overdue: "期限超過",
};

export const STATUS_COLOR: Record<DisplayStatus, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-300",
  in_progress: "bg-amber-100 text-amber-800 border-amber-300",
  done: "bg-emerald-100 text-emerald-800 border-emerald-300",
  overdue: "bg-red-100 text-red-800 border-red-300",
};

export function resolveDisplayStatus(
  status: string,
  deadline: Date | string,
): DisplayStatus {
  if (status === "done") return "done";
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  if (d.getTime() < Date.now()) return "overdue";
  return status as RawStatus;
}
