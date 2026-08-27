import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import { ManagementError, ManagementLoading, ManagementPageHeader, StatusBadge } from "../../features/management/ManagementUi";
import { apiMessage } from "../../features/management/managementUtils";
import { businessRoleLabel, membershipStatusLabel, nullableText } from "../../features/management/managementLabels";
import { memberInviteSchema, type MemberInviteFormValues } from "../../features/management/schemas";
import type { BusinessRole } from "../../shared/api/contracts";
import { managementApi } from "../../shared/api/managementApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button } from "../../shared/ui/Button";
import { PhoneField } from "../../shared/ui/PhoneField";
import { SelectField } from "../../shared/ui/SelectField";
import { TextField } from "../../shared/ui/TextField";

export function BusinessTeamPage() {
  const businessId = Number(useParams().businessId);
  usePageMeta("Komanda — NövbəTime", "Administratorları, işçiləri və otaq sahiblərini telefonla idarə edin.");
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const membersQuery = useQuery({
    queryKey: ["management-members", businessId],
    queryFn: () => managementApi.members(businessId),
    enabled: Number.isInteger(businessId),
  });
  const form = useForm<MemberInviteFormValues>({
    resolver: zodResolver(memberInviteSchema),
    defaultValues: { phone: "", firstName: "", lastName: "", role: "EMPLOYEE" },
  });
  const inviteMutation = useMutation({
    mutationFn: (values: MemberInviteFormValues) => managementApi.inviteMember(businessId, {
      phone: values.phone,
      firstName: nullableText(values.firstName),
      lastName: nullableText(values.lastName),
      role: values.role,
    }),
    onSuccess: async (member) => {
      setSuccessMessage(`${member.firstName} ${member.lastName} üçün dəvət yaradıldı.`);
      setInviteOpen(false);
      form.reset({ phone: "", firstName: "", lastName: "", role: "EMPLOYEE" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["management-members", businessId] }),
        queryClient.invalidateQueries({ queryKey: ["management-business", businessId] }),
      ]);
    },
  });
  const roleMutation = useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: number; role: BusinessRole }) =>
      managementApi.updateMemberRole(businessId, membershipId, role),
    onSuccess: async () => {
      setSuccessMessage("Komanda üzvünün rolu yeniləndi.");
      await queryClient.invalidateQueries({ queryKey: ["management-members", businessId] });
    },
  });
  const removeMutation = useMutation({
    mutationFn: (membershipId: number) => managementApi.removeMember(businessId, membershipId),
    onSuccess: async () => {
      setSuccessMessage("Komanda üzvünün biznes və otaq icazələri ləğv edildi.");
      await queryClient.invalidateQueries({ queryKey: ["management-members", businessId] });
    },
  });

  if (!Number.isInteger(businessId)) return <ManagementError message="Biznes identifikatoru düzgün deyil." />;
  if (membersQuery.isPending) return <ManagementLoading label="Komanda açılır…" />;
  if (membersQuery.isError) return <ManagementError message={apiMessage(membersQuery.error, "Komanda açıla bilmədi.")} />;

  const members = membersQuery.data.filter((member) => member.status !== "REMOVED");
  const mutationError = inviteMutation.error ?? roleMutation.error ?? removeMutation.error;

  return (
    <div className="management-page">
      <ManagementPageHeader
        eyebrow="İnsanlar və icazələr"
        title="Komanda"
        description="İstifadəçi telefon nömrəsi ilə tanınır. Sistemdə hesab yoxdursa müvəqqəti hesab yaradılır; istifadəçi qeydiyyatdan keçib dəvəti ayrıca qəbul edir."
        actions={<Button onClick={() => { setSuccessMessage(null); setInviteOpen(true); }}>Komanda üzvü əlavə et</Button>}
      />
      {successMessage ? <div className="success-alert" role="status">{successMessage}</div> : null}
      {mutationError ? <div className="form-alert" role="alert">{apiMessage(mutationError, "Əməliyyat tamamlanmadı.")}</div> : null}

      {inviteOpen ? (
        <section className="management-panel management-panel--editor" aria-labelledby="team-invite-title">
          <div className="section-heading">
            <div><p className="eyebrow">Telefonla dəvət</p><h2 id="team-invite-title">Yeni komanda üzvü</h2></div>
            <Button variant="quiet" onClick={() => setInviteOpen(false)}>Bağla</Button>
          </div>
          <form className="management-form" onSubmit={form.handleSubmit((values) => inviteMutation.mutate(values))} noValidate>
            <div className="management-form__grid">
              <PhoneField label="Telefon nömrəsi" autoFocus error={form.formState.errors.phone?.message} {...form.register("phone")} />
              <SelectField label="Biznes rolu" error={form.formState.errors.role?.message} {...form.register("role")}>
                <option value="EMPLOYEE">İşçi</option>
                <option value="ADMIN">Administrator</option>
              </SelectField>
              <TextField label="Ad (yeni hesab üçün)" error={form.formState.errors.firstName?.message} {...form.register("firstName")} />
              <TextField label="Soyad (yeni hesab üçün)" error={form.formState.errors.lastName?.message} {...form.register("lastName")} />
            </div>
            <p className="form-note">Administrator biznesin bütün gündəlik idarəetmə işlərini görə bilər. İşçiyə otaq sahibi icazəsi ayrıca verilir.</p>
            <div className="management-form__actions">
              <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Ləğv et</Button>
              <Button type="submit" loading={inviteMutation.isPending}>Dəvət göndər</Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="management-list" aria-label="Biznes komandası">
        {members.map((member) => {
          const active = member.status === "ACTIVE";
          return (
            <article className="management-list__item" key={member.id}>
              <div className="management-list__main">
                <div className="management-list__title">
                  <h2>{member.firstName} {member.lastName}</h2>
                  <StatusBadge tone={active ? "success" : "warning"}>{membershipStatusLabel(member.status)}</StatusBadge>
                </div>
                <p>{member.phone}</p>
                <p className="management-list__meta">{businessRoleLabel(member.role)}</p>
              </div>
              <div className="management-list__actions management-list__actions--team">
                {member.role === "PRIMARY_OWNER" ? (
                  <span className="role-lock">Əsas sahibin rolu burada dəyişmir</span>
                ) : (
                  <>
                    <label className="compact-select">
                      <span>Rol</span>
                      <select
                        value={member.role}
                        disabled={roleMutation.isPending || removeMutation.isPending}
                        onChange={(event) => roleMutation.mutate({ membershipId: member.id, role: event.target.value as BusinessRole })}
                      >
                        <option value="EMPLOYEE">İşçi</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </label>
                    <Button
                      variant="quiet"
                      disabled={roleMutation.isPending || removeMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`${member.firstName} ${member.lastName} biznesdən silinsin? Bütün aktiv otaq sahibi icazələri də ləğv ediləcək.`)) {
                          removeMutation.mutate(member.id);
                        }
                      }}
                    >Biznesdən sil</Button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
