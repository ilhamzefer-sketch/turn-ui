import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError } from "../../shared/api/httpClient";
import { walletApi } from "../../shared/api/walletApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button } from "../../shared/ui/Button";
import { WalletReturnNotice } from "../../features/wallet/WalletReturnNotice";
import { WalletTopUpPanel } from "../../features/wallet/WalletTopUpPanel";
import { isTerminalTopUp } from "../../features/wallet/topUpPresentation";
import {
  aznAmount,
  coinAmount,
  walletTransactionDate,
  walletTransactionLabel,
} from "../../features/wallet/walletFormatters";
import type { WalletTopUpPackage, WalletTransactionPage } from "../../shared/api/contracts";

const FALLBACK_PACKAGES: WalletTopUpPackage[] = [
  { code: "AZN_3", amountAzn: 3, coinAmount: 30 },
  { code: "AZN_5", amountAzn: 5, coinAmount: 50 },
  { code: "AZN_10", amountAzn: 10, coinAmount: 100 },
  { code: "AZN_15", amountAzn: 15, coinAmount: 150 },
  { code: "AZN_20", amountAzn: 20, coinAmount: 200 },
];

export function WalletPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentReturn = searchParams.get("payment");
  const suppliedRequestId = Number(searchParams.get("requestId"));
  const requestId = Number.isSafeInteger(suppliedRequestId) && suppliedRequestId > 0 ? suppliedRequestId : null;
  const showReturn = paymentReturn === "success" || paymentReturn === "failed";
  const pollingStartedAt = useRef(0);

  useEffect(() => {
    if (showReturn && requestId !== null) pollingStartedAt.current = Date.now();
  }, [showReturn, requestId]);

  const balanceQuery = useQuery({ queryKey: ["wallet-balance"], queryFn: walletApi.balance });
  const optionsQuery = useQuery({ queryKey: ["wallet-top-up-options"], queryFn: walletApi.topUpOptions });
  const activeQuery = useQuery({
    queryKey: ["wallet-active-top-up"],
    queryFn: walletApi.activeTopUpRequest,
    retry: false,
  });
  const historyQuery = useQuery({
    queryKey: ["wallet-transactions", 0, 20],
    queryFn: () => walletApi.transactions(0, 20),
  });
  const returnedQuery = useQuery({
    queryKey: ["wallet-top-up", requestId],
    queryFn: () => walletApi.topUpRequest(requestId as number),
    enabled: showReturn && requestId !== null,
    retry: false,
    refetchInterval: (query) => {
      const request = query.state.data;
      if (request && isTerminalTopUp(request.status)) return false;
      return Date.now() - pollingStartedAt.current < 30_000 ? 1_500 : false;
    },
  });
  const create = useMutation({
    mutationFn: walletApi.createTopUpRequest,
    onSuccess: (request) => {
      queryClient.setQueryData(["wallet-active-top-up"], request);
      if (request.paymentUrl) window.location.assign(request.paymentUrl);
    },
  });
  const upload = useMutation({
    mutationFn: ({ requestId: id, file }: { requestId: number; file: File }) => walletApi.uploadReceipt(id, file),
    onSuccess: (request) => {
      queryClient.setQueryData(["wallet-active-top-up"], request);
      void queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });

  usePageMeta("Balans - NovbeTime", "Coin balansınızı təhlükəsiz şəkildə artırın və əməliyyatları izləyin.", { index: false });

  useEffect(() => {
    const returned = returnedQuery.data;
    if (!returned || !isTerminalTopUp(returned.status)) return;
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] }),
      queryClient.invalidateQueries({ queryKey: ["wallet-active-top-up"] }),
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] }),
    ]);
  }, [queryClient, returnedQuery.data]);

  if (balanceQuery.isPending || optionsQuery.isPending || activeQuery.isPending) {
    return <div className="management-state" role="status">Balansınız açılır...</div>;
  }
  if (balanceQuery.isError || optionsQuery.isError) {
    return (
      <div className="management-state management-state--error" role="alert">
        <strong>Balans açıla bilmədi</strong>
        <p>{balanceQuery.error?.message ?? optionsQuery.error?.message}</p>
        <Button onClick={() => void Promise.all([balanceQuery.refetch(), optionsQuery.refetch()])}>Yenidən yoxla</Button>
      </div>
    );
  }
  const activeMissing = activeQuery.error instanceof ApiError && activeQuery.error.status === 404;
  if (activeQuery.isError && !activeMissing) {
    return (
      <div className="management-state management-state--error" role="alert">
        <strong>Ödəniş sorğusu yoxlanıla bilmədi</strong>
        <p>{activeQuery.error.message}</p>
        <Button onClick={() => void activeQuery.refetch()}>Yenidən yoxla</Button>
      </div>
    );
  }

  const options = optionsQuery.data;
  const packages = options.packages.length ? options.packages : FALLBACK_PACKAGES;
  const active = activeMissing ? null : (activeQuery.data ?? null);
  const dismissReturn = () => {
    setSearchParams((current) => {
      current.delete("payment");
      current.delete("requestId");
      return current;
    }, { replace: true });
  };

  return (
    <div className="wallet-page">
      <header className="wallet-heading">
        <div>
          <p className="eyebrow">Şəxsi coin hesabı</p>
          <h1>Balansınız</h1>
          <p>Coin-lər bütün fərdi və biznes iş sahələrinizdə istifadə olunur.</p>
        </div>
        <section className="wallet-balance" aria-label="Cari coin balansı">
          <span>Mövcud balans</span>
          <strong>{coinAmount(balanceQuery.data.balance)}</strong>
          <small>{aznAmount(balanceQuery.data.balance, options.coinsPerAzn)} dəyərində</small>
        </section>
      </header>

      {showReturn ? <WalletReturnNotice requestId={requestId} query={returnedQuery} onDismiss={dismissReturn} /> : null}

      <div className="wallet-top-up-grid wallet-top-up-grid--single">
        <WalletTopUpPanel options={options} packages={packages} active={active} create={create} upload={upload} />
      </div>

      <WalletHistory query={historyQuery} />
    </div>
  );
}

function WalletHistory({ query }: { query: UseQueryResult<WalletTransactionPage, Error> }) {
  return (
    <section className="wallet-history" aria-labelledby="wallet-history-title">
      <div className="wallet-history__heading">
        <div><p className="eyebrow">Hesab hərəkətləri</p><h2 id="wallet-history-title">Son əməliyyatlar</h2></div>
        <span>Ən yeni əməliyyatlar əvvəl göstərilir</span>
      </div>
      {query.isPending ? <div className="wallet-history__state" role="status">Əməliyyatlar açılır...</div> : null}
      {query.isError ? <div className="wallet-history__state wallet-history__state--error" role="alert">Əməliyyat tarixçəsi açıla bilmədi.</div> : null}
      {query.data?.items.length === 0 ? <div className="wallet-history__state">Hələ balans əməliyyatınız yoxdur.</div> : null}
      {query.data?.items.length ? (
        <ol className="wallet-transaction-list">
          {query.data.items.map((transaction) => (
            <li key={transaction.id}>
              <div className={`wallet-transaction__mark wallet-transaction__mark--${transaction.direction.toLowerCase()}`} aria-hidden="true">
                {transaction.direction === "CREDIT" ? "+" : "-"}
              </div>
              <div className="wallet-transaction__detail">
                <strong>{walletTransactionLabel(transaction.type)}</strong>
                <span>{transaction.description ?? walletTransactionDate(transaction.createdAt)}</span>
                {transaction.description ? <small>{walletTransactionDate(transaction.createdAt)}</small> : null}
              </div>
              <div className="wallet-transaction__amount">
                <strong>{transaction.direction === "CREDIT" ? "+" : "-"}{coinAmount(transaction.amount)}</strong>
                <span>Balans: {coinAmount(transaction.balanceAfter)}</span>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
