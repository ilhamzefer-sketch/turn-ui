import { Link } from "react-router-dom";

export function RoomInlineFeedback({ success, error, action }: {
  success?: string | null;
  error?: string | null;
  action?: { label: string; to: string } | null;
}) {
  return <>
    {success ? <p className="info-note room-inline-feedback" role="status">{success}</p> : null}
    {error ? <div className="warning-note room-inline-feedback" role="alert">{error}{action ? <> <Link to={action.to}>{action.label}</Link></> : null}</div> : null}
  </>;
}

export type RoomNavigationState = { busy: boolean; dirty: boolean };
