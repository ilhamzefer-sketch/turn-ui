import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { FilePicker } from "../../shared/ui/FilePicker";
import { PhoneField } from "../../shared/ui/PhoneField";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { isLocalPhone } from "../../shared/validation/phoneFormat";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";
import { supportApi } from "../../shared/api/supportApi";

export function SupportPage() {
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [requestType, setRequestType] = useState<"PROBLEM" | "SUGGESTION">(
    "PROBLEM",
  );
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: ["my-support-requests"],
    queryFn: () => supportApi.requests(0, 20),
  });
  const request = useMutation({
    mutationFn: () => supportApi.createRequest(requestType, message),
    onSuccess: async (created) => {
      if (attachment) await supportApi.uploadAttachment(created.id, attachment);
      setMessage("");
      setAttachment(null);
      await queryClient.invalidateQueries({
        queryKey: ["my-support-requests"],
      });
    },
  });
  const change = useMutation({
    mutationFn: () => stepSixApi.phoneChange(phone, reason),
  });
  const deletion = useMutation({ mutationFn: stepSixApi.deleteAccount });
  usePageMeta(
    "Dəstək — NövbəTime",
    "Telefon dəyişməsi, hesab girişi və hesab silinməsi üçün manual dəstək.",
  );
  return (
    <div className="insight-page">
      <header className="insight-header">
        <div>
          <p className="eyebrow">Manual dəstək</p>
          <h1>Hesabınızla bağlı müraciət</h1>
          <p>
            Telefon və hesab sahibliyi avtomatik dəyişdirilmir. Platforma
            komandası müraciəti yoxlayır və qərarı audit tarixçəsində saxlayır.
          </p>
        </div>
      </header>
      <NotificationEvent
        tone="success"
        message={
          change.data
            ? `Müraciət #${change.data.id} qəbul edildi. Status: ${change.data.status}`
            : null
        }
      />
      <NotificationEvent tone="error" message={change.error?.message ?? null} />
      <NotificationEvent
        tone="success"
        message={
          deletion.data
            ? `Silinmə müraciəti #${deletion.data.id} qəbul edildi.`
            : null
        }
      />
      <NotificationEvent
        tone="error"
        message={deletion.error?.message ?? null}
      />
      <section
        className="insight-panel"
        aria-labelledby="general-support-title"
      >
        <p className="eyebrow">Yeni müraciət</p>
        <h2 id="general-support-title">Problem və ya tövsiyə göndərin</h2>
        <form
          className="operation-form"
          onSubmit={(e) => {
            e.preventDefault();
            request.mutate();
          }}
        >
          <label className="field">
            <span>Müraciət növü</span>
            <select
              value={requestType}
              onChange={(e) =>
                setRequestType(e.target.value as typeof requestType)
              }
            >
              <option value="PROBLEM">Problem</option>
              <option value="SUGGESTION">Tövsiyə</option>
            </select>
          </label>
          <TextAreaField
            label="Mesajınız"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <div className="field">
            <span>Şəkil və ya sənəd (istəyə bağlı)</span>
            <FilePicker
              accept="image/jpeg,image/png"
              file={attachment}
              onChange={setAttachment}
            />
          </div>
          {request.error ? (
            <p className="form-note form-note--error" role="alert">
              {request.error.message}
            </p>
          ) : null}
          {request.isSuccess ? (
            <p className="form-note" role="status">
              Müraciətiniz qəbul edildi.
            </p>
          ) : null}
          <Button
            type="submit"
            loading={request.isPending}
            disabled={!message.trim()}
          >
            Müraciəti göndər
          </Button>
        </form>
      </section>
      <section className="insight-panel">
        <p className="eyebrow">Müraciətlərim</p>
        <h2>Cavab və statuslar</h2>
        {requests.isPending ? (
          <p role="status">Müraciətlər açılır…</p>
        ) : requests.isError ? (
          <p role="alert">Müraciət tarixçəsi açıla bilmədi.</p>
        ) : requests.data?.items.length ? (
          <div className="compact-list">
            {requests.data.items.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>
                    #{item.id} ·{" "}
                    {item.requestType === "PROBLEM" ? "Problem" : "Tövsiyə"}
                  </strong>
                  <span>{item.message}</span>
                  <small>
                    {formatDate(item.createdAt)}
                    {item.hasAttachment ? " · Fayl əlavə olunub" : ""}
                  </small>
                  {item.adminResponse ? (
                    <span>Admin cavabı: {item.adminResponse}</span>
                  ) : null}
                </div>
                <strong>{supportStatus(item.status)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p>Hələ müraciət göndərməmisiniz.</p>
        )}
      </section>
      <div className="support-grid">
        <section className="insight-panel">
          <p className="eyebrow">Telefon dəyişikliyi</p>
          <h2>Yeni nömrə üçün müraciət</h2>
          {change.data ? null : (
            <form
              className="operation-form"
              onSubmit={(e) => {
                e.preventDefault();
                change.mutate();
              }}
            >
              <PhoneField
                label="Yeni telefon nömrəsi"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <TextAreaField
                label="Dəyişiklik səbəbi"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              <p className="form-note">
                Yeni nömrə yalnız manual yoxlamadan sonra hesabınıza tətbiq
                ediləcək.
              </p>
              <Button
                type="submit"
                loading={change.isPending}
                disabled={!isLocalPhone(phone) || !reason.trim()}
              >
                Telefon dəyişikliyi göndər
              </Button>
            </form>
          )}
        </section>
        <section className="insight-panel insight-panel--danger">
          <p className="eyebrow">Hesabın silinməsi</p>
          <h2>Manual silinmə müraciəti</h2>
          <p>
            Aktiv biznesin əsas sahibisinizsə, əvvəlcə sahibliyi başqa aktiv
            administratora ötürməlisiniz.
          </p>
          {deletion.data ? null : (
            <>
              {confirmDelete ? (
                <div className="confirm-box">
                  <p>
                    Bu əməliyyat dərhal silmir; Platform Support yoxladıqdan
                    sonra hesab anonimləşdirilə bilər.
                  </p>
                  <Button
                    loading={deletion.isPending}
                    onClick={() => deletion.mutate()}
                  >
                    Bəli, müraciəti göndər
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Geri qayıt
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => setConfirmDelete(true)}
                >
                  Hesabın silinməsini istə
                </Button>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function supportStatus(status: string) {
  return (
    (
      {
        OPEN: "Açıq",
        IN_REVIEW: "Yoxlanılır",
        RESOLVED: "Həll edildi",
        REJECTED: "Rədd edildi",
      } as Record<string, string>
    )[status] ?? status
  );
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
