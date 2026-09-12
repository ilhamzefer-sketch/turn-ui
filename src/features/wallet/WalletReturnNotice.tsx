import type { UseQueryResult } from "@tanstack/react-query";
import type { WalletTopUpRequest } from "../../shared/api/contracts";
import { Button } from "../../shared/ui/Button";
import { isFailedTopUp, isPaidTopUp, topUpStatusLabel } from "./topUpPresentation";

export function WalletReturnNotice({
  requestId,
  query,
  onDismiss,
}: {
  requestId: number | null;
  query: UseQueryResult<WalletTopUpRequest, Error>;
  onDismiss: () => void;
}) {
  if (requestId === null) {
    return (
      <div className="wallet-return wallet-return--warning" role="alert">
        <div><strong>Ödəniş nəticəsi yoxlanıla bilmədi</strong><p>Qayıdış linkində sorğu nömrəsi yoxdur.</p></div>
        <Button variant="secondary" onClick={onDismiss}>Bildirişi bağla</Button>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="wallet-return wallet-return--warning" role="alert">
        <div><strong>Nəticə hələ açıla bilmədi</strong><p>{query.error.message}</p></div>
        <Button variant="secondary" onClick={() => void query.refetch()}>Yenidən yoxla</Button>
      </div>
    );
  }
  if (query.isPending || !query.data) {
    return <div className="wallet-return" role="status"><strong>Ödəniş nəticəsi yoxlanılır</strong><p>Sorğu #{requestId} serverdə təsdiqlənir.</p></div>;
  }
  const request = query.data;
  if (isPaidTopUp(request.status)) {
    return (
      <div className="wallet-return wallet-return--success" role="status">
        <div><strong>Ödəniş təsdiqləndi</strong><p>{request.coinAmount} coin balansınıza əlavə edildi.</p></div>
        <Button variant="secondary" onClick={onDismiss}>Bildirişi bağla</Button>
      </div>
    );
  }
  if (isFailedTopUp(request.status)) {
    return (
      <div className="wallet-return wallet-return--warning" role="alert">
        <div><strong>{topUpStatusLabel(request.status)}</strong><p>Server bu sorğu üçün coin əlavə etməyib.</p></div>
        <Button variant="secondary" onClick={onDismiss}>Bildirişi bağla</Button>
      </div>
    );
  }
  return (
    <div className="wallet-return" role="status">
      <div><strong>Ödəniş emal olunur</strong><p>Nəticə hələ server tərəfindən təsdiqlənməyib. Nəticəni yenidən yoxlamaq üçün aşağıdakı düymədən istifadə edin.</p></div>
      <Button variant="secondary" onClick={() => void query.refetch()}>İndi yoxla</Button>
    </div>
  );
}
