import type { AuditRecord } from "@cro-auditor/shared/types/audit";
import { normalizeAuditAnalysis } from "@cro-auditor/shared/normalize-audit-analysis";
import { useEffect, useRef, type RefObject } from "react";

interface AuditHistoryProps {
  audits: AuditRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  scrollRootRef?: RefObject<HTMLElement | null>;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AuditHistory({
  audits,
  selectedId,
  onSelect,
  hasMore,
  isLoadingMore,
  onLoadMore,
  scrollRootRef,
}: AuditHistoryProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      {
        root: scrollRootRef?.current ?? null,
        rootMargin: "80px",
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore, scrollRootRef]);

  if (audits.length === 0) {
    return (
      <p className="ds-history-empty">
        No audits yet.
        <br />
        Run your first audit to see results here.
      </p>
    );
  }

  return (
    <>
      <ul className="ds-history-grid">
        {audits.map((audit) => {
          const score = normalizeAuditAnalysis(audit.analysis, {
            pageSpeedScore: audit.performance_score,
            totalColors: audit.total_colors,
          }).overallScore;

          return (
          <li key={audit.id}>
            <button
              type="button"
              className={
                selectedId === audit.id
                  ? "ds-history-card ds-history-card--active"
                  : "ds-history-card"
              }
              onClick={() => onSelect(audit.id)}
            >
              <span className="ds-history-card__score">{score}</span>
              <span className="ds-history-card__title">{audit.title}</span>
              <span className="ds-history-card__url">{audit.url}</span>
              <span className="ds-history-card__meta">{formatDate(audit.created_at)}</span>
            </button>
          </li>
          );
        })}
      </ul>

      <div ref={sentinelRef} className="ds-history-sentinel" aria-hidden="true" />

      {isLoadingMore && <p className="ds-history-loading">Loading more...</p>}
    </>
  );
}
