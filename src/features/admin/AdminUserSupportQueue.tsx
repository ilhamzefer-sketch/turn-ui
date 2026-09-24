import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { SelectField } from "../../shared/ui/SelectField";
import { TextAreaField } from "../../shared/ui/TextAreaField";
export function AdminUserSupportQueue() {
  const [page, setPage] = useState(0);
  const queue = useQuery({
    queryKey: ["admin-user-support", "all", page],
    queryFn: () => stepSixApi.adminSupportRequests("", "", page),
  });
  return (
    <section className="insight-panel admin-section" id="admin-user-support">
      <div className="admin-section__heading">
        <div>
          <p className="eyebrow">İstifadəçi müraciətləri</p>
          <h2>Problem və tövsiyələr</h2>
          <p>
            İstifadəçi mesajlarını, əlavə faylları və cavab tarixçəsini idarə
            edin.
          </p>
        </div>
      </div>
      {queue.isPending ? (
        <p role="status">Müraciətlər açılır…</p>
      ) : queue.isError ? (
        <p role="alert">{queue.error.message}</p>
      ) : queue.data?.items.length ? (
        <div className="admin-case-list">
          {queue.data.items.map((item) => (
            <SupportCase
              key={`${item.id}:${item.updatedAt}`}
              item={item}
              onDone={() => queue.refetch()}
            />
          ))}
        </div>
      ) : (
        <p>Bu səhifədə istifadəçi müraciəti yoxdur.</p>
      )}
      {(page > 0 || queue.data?.hasNext) && <nav className="admin-pagination" aria-label="Müraciət səhifələri">
        <Button variant="secondary" disabled={page === 0 || queue.isFetching} onClick={() => setPage(page - 1)}>Əvvəlki səhifə</Button>
        <span>Səhifə {page + 1}</span>
        <Button variant="secondary" disabled={!queue.data?.hasNext || queue.isFetching} onClick={() => setPage(page + 1)}>Növbəti səhifə</Button>
      </nav>}
    </section>
  );
}
function SupportCase({
  item,
  onDone,
}: {
  item: Awaited<
    ReturnType<typeof stepSixApi.adminSupportRequests>
  >["items"][number];
  onDone: () => void;
}) {
  const [status, setStatus] = useState<"IN_REVIEW" | "RESOLVED" | "REJECTED">(
    item.status === "OPEN" ? "IN_REVIEW" : item.status,
  );
  const [response, setResponse] = useState(item.adminResponse ?? "");
  const closed = item.status === "RESOLVED" || item.status === "REJECTED";
  const mutation = useMutation({
    mutationFn: () =>
      stepSixApi.reviewSupportRequest(item.id, status, response),
    onSuccess: onDone,
  });
  const openAttachment = async () => {
    const blob = await stepSixApi.adminSupportAttachment(item.id);
    window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
  };
  return (
    <article>
      <h3>
        #{item.id} · {item.requestType === "PROBLEM" ? "Problem" : "Tövsiyə"}
      </h3>
      <p>
        {item.firstName} {item.lastName} · {item.phone}
      </p>
      <p>{item.message}</p>
      <p><strong>Cari status:</strong> {({ OPEN: "Açıq", IN_REVIEW: "Yoxlanılır", RESOLVED: "Həll edildi", REJECTED: "Rədd edildi" })[item.status]}</p>
      {item.adminResponse && <p><strong>Əvvəlki admin cavabı:</strong> {item.adminResponse}</p>}
      {item.attachmentId ? (
        <Button variant="secondary" onClick={() => void openAttachment()}>
          Əlavəni aç
        </Button>
      ) : null}
      {!closed && <>
      <SelectField
        disabled={mutation.isPending}
        label="Yeni status"
        value={status}
        onChange={(e) => setStatus(e.target.value as typeof status)}
      >
        <option value="IN_REVIEW">Yoxlanılır</option>
        <option value="RESOLVED">Həll edildi</option>
        <option value="REJECTED">Rədd edildi</option>
      </SelectField>
      <TextAreaField
        disabled={mutation.isPending}
        label="Admin cavabı"
        value={response}
        onChange={(e) => setResponse(e.target.value)}
      />
      {mutation.error ? <p role="alert">{mutation.error.message}</p> : null}
      <Button disabled={status !== "IN_REVIEW" && !response.trim()} loading={mutation.isPending} onClick={() => mutation.mutate()}>
        Yenilə
      </Button>
      </>}
    </article>
  );
}
