import type { AuditRecord } from "@cro-auditor/shared/types/audit";
import type {
  AuditProgressPayload,
  AuditStepId,
  AuditStreamEvent,
} from "@cro-auditor/shared/types/audit-stream";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchAudits, runAudit } from "../lib/api";

export const AUDITS_PAGE_SIZE = 8;

interface AuditsContextValue {
  audits: AuditRecord[];
  isLoadingList: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  isRunningAudit: boolean;
  error: string | null;
  clearError: () => void;
  progressSteps: Partial<Record<AuditStepId, AuditProgressPayload>>;
  loadAudits: () => Promise<void>;
  loadMoreAudits: () => Promise<void>;
  runNewAudit: (url: string) => Promise<AuditRecord | null>;
  getAuditById: (id: string) => AuditRecord | undefined;
}

const AuditsContext = createContext<AuditsContextValue | null>(null);

export function AuditsProvider({ children }: { children: ReactNode }) {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<
    Partial<Record<AuditStepId, AuditProgressPayload>>
  >({});

  const loadAudits = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const result = await fetchAudits(AUDITS_PAGE_SIZE, 0);
      setAudits(result.audits);
      setHasMore(result.hasMore);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load audits";
      setError(message);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const loadMoreAudits = useCallback(async () => {
    if (isLoadingMore || isLoadingList || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const result = await fetchAudits(AUDITS_PAGE_SIZE, audits.length);
      setAudits((prev) => {
        const existingIds = new Set(prev.map((audit) => audit.id));
        const nextItems = result.audits.filter((audit) => !existingIds.has(audit.id));
        return [...prev, ...nextItems];
      });
      setHasMore(result.hasMore);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load more audits";
      setError(message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [audits.length, hasMore, isLoadingList, isLoadingMore]);

  useEffect(() => {
    void loadAudits();
  }, [loadAudits]);

  const runNewAudit = useCallback(async (url: string) => {
    setIsRunningAudit(true);
    setError(null);
    setProgressSteps({});

    function handleStreamEvent(event: AuditStreamEvent) {
      if (event.type === "progress") {
        setProgressSteps((prev) => ({
          ...prev,
          [event.data.step]: event.data,
        }));
      }
    }

    try {
      const audit = await runAudit(url, handleStreamEvent);
      setAudits((prev) => [audit, ...prev.filter((item) => item.id !== audit.id)]);
      return audit;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Audit failed";
      setError(message);
      return null;
    } finally {
      setIsRunningAudit(false);
      setProgressSteps({});
    }
  }, []);

  const getAuditById = useCallback(
    (id: string) => audits.find((audit) => audit.id === id),
    [audits]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      audits,
      isLoadingList,
      isLoadingMore,
      hasMore,
      isRunningAudit,
      error,
      clearError,
      progressSteps,
      loadAudits,
      loadMoreAudits,
      runNewAudit,
      getAuditById,
    }),
    [
      audits,
      isLoadingList,
      isLoadingMore,
      hasMore,
      isRunningAudit,
      error,
      clearError,
      progressSteps,
      loadAudits,
      loadMoreAudits,
      runNewAudit,
      getAuditById,
    ]
  );

  return <AuditsContext.Provider value={value}>{children}</AuditsContext.Provider>;
}

export function useAudits(): AuditsContextValue {
  const context = useContext(AuditsContext);
  if (!context) {
    throw new Error("useAudits must be used within AuditsProvider");
  }
  return context;
}
