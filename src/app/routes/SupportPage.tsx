import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { stepSixApi } from "../../shared/api/stepSixApi";
import { Button } from "../../shared/ui/Button";
import { PhoneField } from "../../shared/ui/PhoneField";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { isLocalPhone } from "../../shared/validation/phoneFormat";

export function SupportPage() {
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const change = useMutation({ mutationFn: () => stepSixApi.phoneChange(phone, reason) });
  const deletion = useMutation({ mutationFn: stepSixApi.deleteAccount });
  usePageMeta("Dəstək — NövbəTime", "Telefon dəyişməsi, hesab girişi və hesab silinməsi üçün manual dəstək.");
  return <div className="insight-page">
    <header className="insight-header"><div><p className="eyebrow">Manual dəstək</p><h1>Hesabınızla bağlı müraciət</h1><p>Telefon və hesab sahibliyi avtomatik dəyişdirilmir. Platforma komandası müraciəti yoxlayır və qərarı audit tarixçəsində saxlayır.</p></div></header>
    <div className="support-grid"><section className="insight-panel"><p className="eyebrow">Telefon dəyişikliyi</p><h2>Yeni nömrə üçün müraciət</h2>{change.data ? <div className="success-alert" role="status">Müraciət #{change.data.id} qəbul edildi. Status: {change.data.status}</div> : <form className="operation-form" onSubmit={(e) => { e.preventDefault(); change.mutate(); }}><PhoneField label="Yeni telefon nömrəsi" value={phone} onChange={(e) => setPhone(e.target.value)} required /><TextAreaField label="Dəyişiklik səbəbi" value={reason} onChange={(e) => setReason(e.target.value)} required /><p className="form-note">Yeni nömrə yalnız manual yoxlamadan sonra hesabınıza tətbiq ediləcək.</p><Button type="submit" loading={change.isPending} disabled={!isLocalPhone(phone) || !reason.trim()}>Telefon dəyişikliyi göndər</Button>{change.error ? <div className="form-alert" role="alert">{change.error.message}</div> : null}</form>}</section>
      <section className="insight-panel insight-panel--danger"><p className="eyebrow">Hesabın silinməsi</p><h2>Manual silinmə müraciəti</h2><p>Aktiv biznesin əsas sahibisinizsə, əvvəlcə sahibliyi başqa aktiv administratora ötürməlisiniz.</p>{deletion.data ? <div className="success-alert" role="status">Silinmə müraciəti #{deletion.data.id} qəbul edildi.</div> : <>{confirmDelete ? <div className="confirm-box"><p>Bu əməliyyat dərhal silmir; Platform Support yoxladıqdan sonra hesab anonimləşdirilə bilər.</p><Button loading={deletion.isPending} onClick={() => deletion.mutate()}>Bəli, müraciəti göndər</Button><Button variant="quiet" onClick={() => setConfirmDelete(false)}>Geri qayıt</Button></div> : <Button variant="secondary" onClick={() => setConfirmDelete(true)}>Hesabın silinməsini istə</Button>}{deletion.error ? <div className="form-alert" role="alert">{deletion.error.message}</div> : null}</>}</section></div>
  </div>;
}
