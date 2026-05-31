import { DisplayStatus, STATUS_COLOR, STATUS_LABEL } from "@/lib/status";

export function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
