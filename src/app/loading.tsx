import { INFRA } from "@/data/copy"

/* Infrastructure, not in the prototype. A quiet placeholder that reserves the page height. */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="am-container min-h-[60vh] py-16"
    >
      <span className="am-sr">{INFRA.loading}</span>
      <div
        aria-hidden="true"
        className="h-10 w-1/3 animate-pulse rounded-sm bg-bg-3"
      />
    </div>
  )
}
