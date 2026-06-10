import { LogOut } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuditHistory } from "../components/AuditHistory";
import { AuditProgress } from "../components/AuditProgress";
import { AuditResults } from "../components/AuditResults";
import { UrlForm } from "../components/UrlForm";
import { useAuth } from "../contexts/AuthContext";
import { useAudits } from "../contexts/AuditsContext";
import { Button, Modal } from "../components/ui";

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

export function WorkspacePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    audits,
    isLoadingList,
    isLoadingMore,
    hasMore,
    isRunningAudit,
    error,
    clearError,
    progressSteps,
    runNewAudit,
    loadMoreAudits,
    getAuditById,
  } = useAudits();

  const historyScrollRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedAudit = selectedId ? getAuditById(selectedId) : null;
  const email = user?.email ?? "";

  async function handleAudit(url: string) {
    const audit = await runNewAudit(url);
    if (audit) {
      setSelectedId(audit.id);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  function closeReportModal() {
    setSelectedId(null);
  }

  return (
    <div className="ds-home">
      <header className="ds-home__header">
        <div className="ds-home__brand">
          <div className="ds-home__logo" aria-hidden="true">
            M
          </div>
          <div>
            <p className="ds-home__brand-name">CRO Auditor</p>
            <p className="ds-home__brand-tag">Monolitlabs</p>
          </div>
        </div>

        <div className="ds-home__user">
          <span className="ds-user-chip ds-user-chip--static">
            <span className="ds-user-chip__avatar" aria-hidden="true">
              {getInitials(email)}
            </span>
            <span className="ds-user-chip__email">{email}</span>
          </span>
          <Button
            variant="ghost"
            className="ds-home__sign-out"
            onClick={() => void handleSignOut()}
            aria-label="Sign out"
          >
            <LogOut size={16} strokeWidth={2} aria-hidden="true" />
            <span className="ds-home__sign-out-label">Sign out</span>
          </Button>
        </div>
      </header>

      <div className="ds-home__body">
        <main className="ds-home__content">
          <section className="ds-home__hero">
            <h1 className="ds-home__hero-title">Audit any landing page</h1>
            <p className="ds-home__hero-desc">
              Paste a URL to get CRO score, performance metrics, and actionable fixes.
            </p>
            <UrlForm onSubmit={handleAudit} isLoading={isRunningAudit} variant="hero" />
          </section>
        </main>

        <details className="ds-home__history">
          <summary className="ds-home__history-head">
            <span className="ds-home__history-head-inner">
              <h2 className="ds-home__history-title">Recent audits</h2>
              {audits.length > 0 && (
                <span className="ds-home__history-count">
                  {audits.length}
                  {hasMore ? "+" : ""}
                </span>
              )}
            </span>
          </summary>

          <div ref={historyScrollRef} className="ds-home__history-scroll">
            {isLoadingList ? (
              <p className="ds-history-empty">Loading...</p>
            ) : (
              <AuditHistory
                audits={audits}
                selectedId={selectedId}
                onSelect={setSelectedId}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={() => void loadMoreAudits()}
                scrollRootRef={historyScrollRef}
              />
            )}
          </div>
        </details>
      </div>

      <Modal
        open={!!error}
        title="Something went wrong"
        description={error ?? undefined}
        onClose={clearError}
      >
        <Button variant="primary" size="full" onClick={clearError}>
          OK
        </Button>
      </Modal>

      <Modal
        open={isRunningAudit}
        title="Running audit"
        description="Analyzing your page — this usually takes under a minute."
      >
        <AuditProgress steps={progressSteps} />
      </Modal>

      <Modal
        open={!!selectedAudit}
        title="Audit report"
        size="large"
        insetX
        onClose={closeReportModal}
      >
        {selectedAudit && <AuditResults audit={selectedAudit} />}
      </Modal>
    </div>
  );
}
