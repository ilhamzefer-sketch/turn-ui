import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import { ManagementError, ManagementLoading, ManagementPageHeader, StatusBadge } from "../../features/management/ManagementUi";
import { apiMessage } from "../../features/management/managementUtils";
import { branchSchema, type BranchFormValues } from "../../features/management/schemas";
import { nullableText } from "../../features/management/managementLabels";
import type { Branch } from "../../shared/api/contracts";
import { managementApi } from "../../shared/api/managementApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";
import { Button } from "../../shared/ui/Button";
import { PhoneField } from "../../shared/ui/PhoneField";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";
import { toLocalPhoneInput } from "../../shared/validation/phoneFormat";

const emptyBranch: BranchFormValues = { name: "", address: "", city: "Bakı", district: "", phone: "", notes: "" };

export function BusinessBranchesPage() {
  const businessId = Number(useParams().businessId);
  usePageMeta("Filiallar — NövbəTime", "Biznes filiallarının ünvan və əlaqə məlumatlarını idarə edin.");
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Branch | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const branchesQuery = useQuery({
    queryKey: ["management-branches", businessId],
    queryFn: () => managementApi.branches(businessId),
    enabled: Number.isInteger(businessId),
  });
  const form = useForm<BranchFormValues>({ resolver: zodResolver(branchSchema), defaultValues: emptyBranch });

  const saveMutation = useMutation({
    mutationFn: (values: BranchFormValues) => {
      const input = {
        name: values.name,
        address: values.address,
        city: values.city,
        district: values.district,
        latitude: editing?.latitude ?? null,
        longitude: editing?.longitude ?? null,
        phone: nullableText(values.phone),
        notes: nullableText(values.notes),
        timezone: editing?.timezone ?? "Asia/Baku",
      };
      return editing ? managementApi.updateBranch(editing.id, input) : managementApi.createBranch(businessId, input);
    },
    onSuccess: async (_, values) => {
      setSuccessMessage(editing ? `${values.name} yeniləndi.` : `${values.name} yaradıldı.`);
      setEditing(null);
      setFormVisible(false);
      form.reset(emptyBranch);
      await queryClient.invalidateQueries({ queryKey: ["management-branches", businessId] });
    },
  });
  const archiveMutation = useMutation({
    mutationFn: (branchId: number) => managementApi.archiveBranch(branchId),
    onSuccess: async () => {
      setSuccessMessage("Filial arxivləşdirildi.");
      await queryClient.invalidateQueries({ queryKey: ["management-branches", businessId] });
    },
  });

  const startCreate = () => {
    setEditing(null);
    setSuccessMessage(null);
    form.reset(emptyBranch);
    setFormVisible(true);
  };
  const startEdit = (branch: Branch) => {
    setEditing(branch);
    setSuccessMessage(null);
    form.reset({
      name: branch.name,
      address: branch.address,
      city: branch.city,
      district: branch.district,
      phone: toLocalPhoneInput(branch.phone),
      notes: branch.notes ?? "",
    });
    setFormVisible(true);
  };

  if (!Number.isInteger(businessId)) return <ManagementError message="Biznes identifikatoru düzgün deyil." />;
  if (branchesQuery.isPending) return <ManagementLoading label="Filiallar açılır…" />;
  if (branchesQuery.isError) return <ManagementError message={apiMessage(branchesQuery.error, "Filiallar açıla bilmədi.")} />;

  const branches = branchesQuery.data.filter((branch) => branch.status === "ACTIVE");

  return (
    <div className="management-page">
      <ManagementPageHeader
        eyebrow="Struktur"
        title="Filiallar"
        description="Biznes otaqları filialın ünvan və əlaqə məlumatlarından istifadə edir. Ən azı bir filial yaratdıqdan sonra otaq əlavə edə bilərsiniz."
        actions={<Button onClick={startCreate}>Yeni filial</Button>}
      />
      <NotificationEvent tone="success" message={successMessage} />
      <NotificationEvent tone="error" message={archiveMutation.isError ? apiMessage(archiveMutation.error, "Filial arxivləşdirilmədi.") : null} />

      {formVisible ? (
        <section className="management-panel management-panel--editor" aria-labelledby="branch-editor-title">
          <div className="section-heading">
            <div><p className="eyebrow">{editing ? "Düzəliş" : "Yeni məkan"}</p><h2 id="branch-editor-title">{editing ? editing.name : "Filial məlumatları"}</h2></div>
            <Button variant="quiet" onClick={() => setFormVisible(false)}>Bağla</Button>
          </div>
          <NotificationEvent tone="error" message={saveMutation.isError ? apiMessage(saveMutation.error, "Filial saxlanılmadı.") : null} />
          <form className="management-form" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} noValidate>
            <div className="management-form__grid">
              <TextField label="Filial adı" autoFocus error={form.formState.errors.name?.message} {...form.register("name")} />
              <PhoneField label="Əlaqə telefonu (istəyə bağlı)" hint="Boş saxlanarsa biznes telefonu istifadə olunur. Format: 0500000000" error={form.formState.errors.phone?.message} {...form.register("phone")} />
              <TextField label="Şəhər" autoComplete="address-level2" error={form.formState.errors.city?.message} {...form.register("city")} />
              <TextField label="Rayon" autoComplete="address-level3" error={form.formState.errors.district?.message} {...form.register("district")} />
            </div>
            <TextField label="Tam ünvan" autoComplete="street-address" error={form.formState.errors.address?.message} {...form.register("address")} />
            <TextAreaField label="Daxili qeyd (istəyə bağlı)" rows={3} error={form.formState.errors.notes?.message} {...form.register("notes")} />
            <div className="management-form__actions">
              <Button type="button" variant="secondary" onClick={() => setFormVisible(false)}>Ləğv et</Button>
              <Button type="submit" loading={saveMutation.isPending}>{editing ? "Filialı yenilə" : "Filial yarat"}</Button>
            </div>
          </form>
        </section>
      ) : null}

      {branches.length === 0 ? (
        <section className="empty-state">
          <span className="empty-state__mark" aria-hidden="true">01</span>
          <h2>İlk filialınızı yaradın</h2>
          <p>Bir məkanınız olsa belə, otağın ünvanını idarə etmək üçün əvvəl filial lazımdır.</p>
          <Button onClick={startCreate}>Filial yarat</Button>
        </section>
      ) : (
        <section className="management-list" aria-label="Aktiv filiallar">
          {branches.map((branch) => (
            <article className="management-list__item" key={branch.id}>
              <div className="management-list__main">
                <div className="management-list__title"><h2>{branch.name}</h2><StatusBadge tone="success">Aktiv</StatusBadge></div>
                <p>{branch.address}</p>
                <dl className="compact-details">
                  <div><dt>Şəhər və rayon</dt><dd>{branch.city}, {branch.district}</dd></div>
                  <div><dt>Əlaqə</dt><dd>{branch.effectivePhone}</dd></div>
                </dl>
              </div>
              <div className="management-list__actions">
                <Button variant="secondary" onClick={() => startEdit(branch)}>Düzəliş et</Button>
                <Button
                  variant="quiet"
                  disabled={archiveMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`${branch.name} filialını arxivləşdirmək istəyirsiniz? Aktiv otaqlar əvvəl köçürülməli və ya arxivləşdirilməlidir.`)) {
                      archiveMutation.mutate(branch.id);
                    }
                  }}
                >Arxivləşdir</Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
