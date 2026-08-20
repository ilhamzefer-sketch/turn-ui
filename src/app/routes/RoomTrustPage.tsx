import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";
import { shortDate } from "../../features/step-six/formatters";
import { usePageMeta } from "../../shared/meta/usePageMeta";

export function RoomTrustPage() {
  const roomId = Number(useParams().roomId);
  const blocks = useQuery({ queryKey: ["room-blocks", roomId], queryFn: () => stepSixApi.blocks(roomId) });
  const ratings = useQuery({ queryKey: ["room-ratings", roomId], queryFn: () => stepSixApi.roomRatings(roomId) });
  const [customerId, setCustomerId] = useState(""); const [reason, setReason] = useState("");
  const block = useMutation({ mutationFn: () => stepSixApi.block(roomId, Number(customerId), reason), onSuccess: () => { setCustomerId(""); setReason(""); void blocks.refetch(); } });
  const revoke = useMutation({ mutationFn: (id: number) => stepSixApi.revokeBlock(roomId, id), onSuccess: () => blocks.refetch() });
  usePageMeta("Müştəri etibarı — E-Növbə", "Otaq üçün müştəri blokları və yazılı rəylərin idarə olunması.");
  return <div className="insight-page"><header className="insight-header"><div><p className="eyebrow">Etibar və təhlükəsizlik</p><h1>Müştəri girişləri və rəylər</h1><p>Blok yalnız bu otaqda yeni canlı və planlı girişlərə tətbiq edilir. Səbəb audit üçün saxlanılır.</p></div></header><div className="support-grid"><section className="insight-panel"><h2>Müştərini otaqda blokla</h2><form className="operation-form" onSubmit={(e) => { e.preventDefault(); block.mutate(); }}><TextField label="Müştəri user ID-si" inputMode="numeric" value={customerId} onChange={(e) => setCustomerId(e.target.value)} /><TextAreaField label="Blok səbəbi" value={reason} onChange={(e) => setReason(e.target.value)} /><Button type="submit" loading={block.isPending} disabled={!customerId || !reason.trim()}>Blokla</Button></form><div className="compact-list">{blocks.data?.filter((item) => item.active).map((item) => <article key={item.id}><div><strong>Müştəri #{item.customerUserId}</strong><span>{item.reason}</span></div><Button variant="quiet" loading={revoke.isPending} onClick={() => revoke.mutate(item.customerUserId)}>Bloku ləğv et</Button></article>)}{blocks.data && !blocks.data.some((item) => item.active) ? <p>Aktiv blok yoxdur.</p> : null}</div></section><section className="insight-panel"><h2>Yazılı rəylər</h2><p>Public səhifədə yalnız orta bal və rəy sayı görünür.</p><div className="rating-list">{ratings.data?.map((rating) => <article key={rating.id}><strong>{"★".repeat(rating.score)}{"☆".repeat(5 - rating.score)}</strong><p>{rating.comment || "Yazılı qeyd yoxdur."}</p><span>{shortDate(rating.updatedAt)} · {rating.targetType} #{rating.targetId}</span></article>)}{ratings.data?.length === 0 ? <p>Hələ rəy yoxdur.</p> : null}</div></section></div></div>;
}
