import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApi } from "../../shared/api/authApi";
import type { UserSession } from "../../shared/api/contracts";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";
import { Button } from "../../shared/ui/Button";

const SESSIONS_QUERY_KEY = ["account-sessions"] as const;

export function AccountSecurityPage() {
  const queryClient = useQueryClient();
  const sessions = useQuery({ queryKey: SESSIONS_QUERY_KEY, queryFn: authApi.sessions });
  const revoke = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY }),
  });
  const revokeOthers = useMutation({
    mutationFn: authApi.revokeOtherSessions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY }),
  });

  return (
    <div className="account-security">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Hesab təhlükəsizliyi</p>
          <h1>Aktiv sessiyalar</h1>
          <p>Hesabınıza daxil olmuş cihazları yoxlayın və tanımadığınız sessiyaları dayandırın.</p>
        </div>
        <Button
          variant="secondary"
          loading={revokeOthers.isPending}
          disabled={(sessions.data?.length ?? 0) < 2}
          onClick={() => revokeOthers.mutate()}
        >
          Digər cihazlardan çıxış et
        </Button>
      </header>

      {sessions.isPending ? <div className="management-state" role="status">Sessiyalar yoxlanılır…</div> : null}
      <NotificationEvent tone="error" message={sessions.error?.message ?? null} />
      <NotificationEvent tone="error" message={(revoke.error ?? revokeOthers.error)?.message ?? null} />

      <div className="session-list">
        {sessions.data?.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            busy={revoke.isPending && revoke.variables === session.id}
            onRevoke={() => revoke.mutate(session.id)}
          />
        ))}
      </div>
    </div>
  );
}

type SessionCardProps = {
  session: UserSession;
  busy: boolean;
  onRevoke: () => void;
};

function SessionCard({ session, busy, onRevoke }: SessionCardProps) {
  return (
    <article className={`session-card ${session.current ? "session-card--current" : ""}`.trim()}>
      <div className="session-card__heading">
        <div>
          <h2>{deviceLabel(session.userAgent)}</h2>
          <p>{session.current ? "Cari cihaz" : "Aktiv cihaz"} · {session.ipAddress ?? "IP məlum deyil"}</p>
        </div>
        {session.current ? <span className="status-badge status-badge--success">Cari sessiya</span> : null}
      </div>
      <dl className="session-card__details">
        <div><dt>İlk giriş</dt><dd>{dateTime(session.createdAt)}</dd></div>
        <div><dt>Son fəaliyyət</dt><dd>{dateTime(session.lastActivityAt)}</dd></div>
        <div><dt>Fəaliyyətsizlik limiti</dt><dd>{dateTime(session.idleExpiresAt)}</dd></div>
        <div><dt>Maksimum sessiya</dt><dd>{dateTime(session.absoluteExpiresAt)}</dd></div>
      </dl>
      {!session.current ? <Button variant="danger" loading={busy} onClick={onRevoke}>Bu cihazdan çıxış et</Button> : null}
    </article>
  );
}

function deviceLabel(userAgent: string | null) {
  if (!userAgent) return "Naməlum cihaz";
  const browser = userAgent.includes("Edg/") ? "Microsoft Edge"
    : userAgent.includes("Chrome/") ? "Google Chrome"
      : userAgent.includes("Firefox/") ? "Mozilla Firefox"
        : userAgent.includes("Safari/") ? "Safari"
          : "Brauzer";
  const system = userAgent.includes("iPhone") ? "iPhone"
    : userAgent.includes("Android") ? "Android"
      : userAgent.includes("Macintosh") ? "Mac"
        : userAgent.includes("Windows") ? "Windows"
          : "cihaz";
  return `${browser} · ${system}`;
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
