import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import { ManagementError, ManagementLoading, ManagementPageHeader } from "../../features/management/ManagementUi";
import { apiMessage } from "../../features/management/managementUtils";
import { businessProfileSchema, type BusinessProfileFormValues } from "../../features/management/schemas";
import { managementApi } from "../../shared/api/managementApi";
import { publicApi } from "../../shared/api/publicApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { Button, ButtonLink } from "../../shared/ui/Button";
import { PhoneField } from "../../shared/ui/PhoneField";
import { SelectField } from "../../shared/ui/SelectField";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";
import { toLocalPhoneInput } from "../../shared/validation/phoneFormat";
import { nullableText } from "../../features/management/managementLabels";

export function BusinessOverviewPage() {
  const businessId = Number(useParams().businessId);
  usePageMeta("Biznes idarəetməsi — NövbəTime", "Biznes, filial, otaq və komanda hazırlığını idarə edin.");
  const queryClient = useQueryClient();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const businessQuery = useQuery({
    queryKey: ["management-business", businessId],
    queryFn: () => managementApi.business(businessId),
    enabled: Number.isInteger(businessId),
  });
  const branchesQuery = useQuery({
    queryKey: ["management-branches", businessId],
    queryFn: () => managementApi.branches(businessId),
    enabled: Number.isInteger(businessId),
  });
  const roomsQuery = useQuery({
    queryKey: ["management-business-rooms", businessId],
    queryFn: () => managementApi.businessRooms(businessId),
    enabled: Number.isInteger(businessId),
  });
  const membersQuery = useQuery({
    queryKey: ["management-members", businessId],
    queryFn: () => managementApi.members(businessId),
    enabled: Number.isInteger(businessId),
  });
  const categoriesQuery = useQuery({ queryKey: ["public-categories"], queryFn: publicApi.categories });
  const form = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: "",
      phone: "",
      legalName: "",
      taxId: "",
      description: "",
      categoryId: "",
      customSubcategory: "",
    },
  });

  useEffect(() => {
    const business = businessQuery.data;
    if (!business) return;
    form.reset({
      name: business.name,
      phone: toLocalPhoneInput(business.phone),
      legalName: business.legalName ?? "",
      taxId: business.taxId ?? "",
      description: business.description ?? "",
      categoryId: business.category ? String(business.category.id) : "",
      customSubcategory: business.customSubcategory ?? "",
    });
  }, [businessQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: (values: BusinessProfileFormValues) => {
      const current = businessQuery.data;
      if (!current) throw new Error("Biznes məlumatları hazır deyil.");
      return managementApi.updateBusiness(businessId, {
        name: values.name,
        phone: values.phone,
        legalName: nullableText(values.legalName),
        description: nullableText(values.description),
        taxId: nullableText(values.taxId),
        logoUrl: current.logoUrl,
        timezone: current.timezone,
        categoryId: values.categoryId ? Number(values.categoryId) : null,
        customSubcategory: nullableText(values.customSubcategory),
      });
    },
    onSuccess: async () => {
      setSavedMessage("Biznes məlumatları yadda saxlanıldı.");
      await queryClient.invalidateQueries({ queryKey: ["management-business", businessId] });
    },
  });

  if (!Number.isInteger(businessId)) return <ManagementError message="Biznes identifikatoru düzgün deyil." />;
  if (businessQuery.isPending) return <ManagementLoading label="Biznes iş sahəsi açılır…" />;
  if (businessQuery.isError) return <ManagementError message={apiMessage(businessQuery.error, "Biznes açıla bilmədi.")} />;

  const business = businessQuery.data;
  const branchCount = branchesQuery.data?.filter((branch) => branch.status === "ACTIVE").length ?? 0;
  const rooms = roomsQuery.data?.filter((room) => room.status !== "ARCHIVED") ?? [];
  const publishedRooms = rooms.filter((room) => room.status === "PUBLISHED").length;
  const activeMembers = membersQuery.data?.filter((member) => member.status === "ACTIVE").length ?? 0;

  return (
    <div className="management-page">
      <ManagementPageHeader
        eyebrow="Biznes iş sahəsi"
        title={business.name}
        description="Filialdan otağa qədər bütün strukturun hazırlığını bir yerdə izləyin. Otaq yalnız otaq sahibi və iş qrafiki tamamlandıqdan sonra yayımlanır."
        actions={<ButtonLink to={`/app/businesses/${businessId}/branches`}>Filial əlavə et</ButtonLink>}
      />

      <section className="metric-row" aria-label="Biznes xülasəsi">
        <article><span>Filial</span><strong>{branchCount}</strong><p>Aktiv məkan</p></article>
        <article><span>Otaq</span><strong>{rooms.length}</strong><p>{publishedRooms} yayımlanıb</p></article>
        <article><span>Komanda</span><strong>{activeMembers}</strong><p>Aktiv üzv</p></article>
      </section>

      <section className="setup-roadmap" aria-labelledby="setup-roadmap-title">
        <div className="section-heading">
          <div><p className="eyebrow">Qurulum ardıcıllığı</p><h2 id="setup-roadmap-title">Biznesi işə hazırlayın</h2></div>
        </div>
        <ol>
          <li className={branchCount > 0 ? "is-complete" : ""}>
            <span>1</span><div><strong>Filial yaradın</strong><p>Ünvan və əlaqə məlumatları filialda saxlanılır.</p></div>
            <ButtonLink variant="quiet" to={`/app/businesses/${businessId}/branches`}>Filiallara keç</ButtonLink>
          </li>
          <li className={rooms.length > 0 ? "is-complete" : ""}>
            <span>2</span><div><strong>Otaqları əlavə edin</strong><p>Hər müstəqil növbə axını üçün ayrıca otaq yaradın.</p></div>
            <ButtonLink variant="quiet" to={`/app/businesses/${businessId}/rooms`}>Otaqlara keç</ButtonLink>
          </li>
          <li className={activeMembers > 1 ? "is-complete" : ""}>
            <span>3</span><div><strong>Komandanı dəvət edin</strong><p>Administrator və otaq sahiblərini telefon nömrəsi ilə əlavə edin.</p></div>
            <ButtonLink variant="quiet" to={`/app/businesses/${businessId}/team`}>Komandaya keç</ButtonLink>
          </li>
        </ol>
      </section>

      <section className="management-panel" aria-labelledby="business-profile-title">
        <div className="section-heading">
          <div><p className="eyebrow">Profil</p><h2 id="business-profile-title">Biznes məlumatları</h2></div>
          <p>Axtarışda və otaq səhifələrində istifadə olunan əsas məlumatlar.</p>
        </div>
        {updateMutation.isError ? <div className="form-alert" role="alert">{apiMessage(updateMutation.error, "Dəyişiklik saxlanılmadı.")}</div> : null}
        {savedMessage ? <div className="success-alert" role="status">{savedMessage}</div> : null}
        <form
          className="management-form"
          onSubmit={form.handleSubmit((values) => {
            setSavedMessage(null);
            updateMutation.mutate(values);
          })}
          noValidate
        >
          <div className="management-form__grid">
            <TextField label="Biznes adı" autoComplete="organization" error={form.formState.errors.name?.message} {...form.register("name")} />
            <PhoneField label="Əlaqə telefonu" error={form.formState.errors.phone?.message} {...form.register("phone")} />
            <TextField label="Hüquqi ad (istəyə bağlı)" error={form.formState.errors.legalName?.message} {...form.register("legalName")} />
            <TextField label="VÖEN (istəyə bağlı)" error={form.formState.errors.taxId?.message} {...form.register("taxId")} />
            <SelectField label="Kateqoriya" error={form.formState.errors.categoryId?.message} {...form.register("categoryId")}>
              <option value="">Kateqoriya seçilməyib</option>
              {(categoriesQuery.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </SelectField>
            <TextField label="Alt kateqoriya (istəyə bağlı)" error={form.formState.errors.customSubcategory?.message} {...form.register("customSubcategory")} />
          </div>
          <TextAreaField label="Biznes haqqında (istəyə bağlı)" rows={4} error={form.formState.errors.description?.message} {...form.register("description")} />
          <div className="management-form__actions"><Button type="submit" loading={updateMutation.isPending}>Dəyişiklikləri saxla</Button></div>
        </form>
      </section>
    </div>
  );
}
