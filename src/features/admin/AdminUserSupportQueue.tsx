import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { SelectField } from "../../shared/ui/SelectField";
import { TextAreaField } from "../../shared/ui/TextAreaField";
export function AdminUserSupportQueue() {
  const queue = useQuery({
    queryKey: ["admin-user-support", "all"],
    queryFn: () => stepSixApi.adminSupportRequests(),
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
              key={item.id}
              item={item}
              onDone={() => queue.refetch()}
            />
          ))}
        </div>
      ) : (
        <p>Açıq istifadəçi müraciəti yoxdur.</p>
      )}
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
    "IN_REVIEW",
  );
  const [response, setResponse] = useState("");
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
      {item.attachmentId ? (
        <Button variant="secondary" onClick={() => void openAttachment()}>
          Əlavəni aç
        </Button>
      ) : null}
      <SelectField
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as typeof status)}
      >
        <option value="IN_REVIEW">Yoxlanılır</option>
        <option value="RESOLVED">Həll edildi</option>
        <option value="REJECTED">Rədd edildi</option>
      </SelectField>
      <TextAreaField
        label="Admin cavabı"
        value={response}
        onChange={(e) => setResponse(e.target.value)}
      />
      {mutation.error ? <p role="alert">{mutation.error.message}</p> : null}
      <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
        Yenilə
      </Button>
    </article>
  );
}
