import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  businessOnboardingSchema,
  individualWorkspaceSchema,
  type BusinessOnboardingFormValues,
  type IndividualWorkspaceFormValues,
} from "../../features/onboarding/schemas";
import { workspaceTypeLabel } from "../../features/workspaces/workspaceLabels";
import type { WorkspaceContext } from "../../shared/api/contracts";
import { ApiError } from "../../shared/api/httpClient";
import { publicApi } from "../../shared/api/publicApi";
import { workspaceApi } from "../../shared/api/workspaceApi";
import { useAuth } from "../../shared/auth/useAuth";
import { Brand } from "../../shared/ui/Brand";
import { Button } from "../../shared/ui/Button";
import { PhoneField } from "../../shared/ui/PhoneField";
import { SelectField } from "../../shared/ui/SelectField";
import { TextAreaField } from "../../shared/ui/TextAreaField";
import { TextField } from "../../shared/ui/TextField";
import { toLocalPhoneInput } from "../../shared/validation/phoneFormat";
import { useWorkspace } from "../../shared/workspace/useWorkspace";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { NotificationEvent } from "../../shared/notifications/NotificationProvider";

type OnboardingMode = "choose" | "individual" | "business";

function parseMode(value: string | null): OnboardingMode {
  return value === "individual" || value === "business" ? value : "choose";
}

function invitationDate(value: string) {
  const date = new Date(value);
  const months = [
    "yanvar", "fevral", "mart", "aprel", "may", "iyun",
    "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function OnboardingPage() {
  usePageMeta("İş sahəsini seçin — NövbəTime", "NövbəTime hesabınız üçün müştəri, fərdi mütəxəssis və ya biznes iş sahəsi seçin.");
  const { user } = useAuth();
  const { workspaces, selectWorkspace, refreshWorkspaces } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = parseMode(searchParams.get("type"));
  const [pageError, setPageError] = useState<string | null>(null);
  const [respondingInvitation, setRespondingInvitation] = useState<string | null>(null);
  const categoriesQuery = useQuery({ queryKey: ["public-categories"], queryFn: publicApi.categories });
  const invitationsQuery = useQuery({ queryKey: ["user-invitations", user?.id], queryFn: workspaceApi.invitations });
  const pendingInvitationCount =
    (invitationsQuery.data?.businessInvitations.length ?? 0) +
    (invitationsQuery.data?.roomInvitations.length ?? 0);
  const existingIndividual = workspaces.find((workspace) => workspace.type === "INDIVIDUAL");

  const chooseMode = (nextMode: OnboardingMode) => {
    setPageError(null);
    if (nextMode === "choose") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ type: nextMode }, { replace: true });
    }
  };

  const enterWorkspace = async (workspace: WorkspaceContext) => {
    selectWorkspace(workspace);
    await navigate("/app");
  };

  const continueAsCustomer = async () => {
    const customer = workspaces.find((workspace) => workspace.type === "CUSTOMER");
    if (customer) selectWorkspace(customer);
    await navigate("/app");
  };

  const respondToInvitation = async (kind: "business" | "room", id: number, accept: boolean) => {
    const responseKey = `${kind}:${id}:${accept ? "accept" : "reject"}`;
    setRespondingInvitation(responseKey);
    setPageError(null);
    try {
      if (kind === "business") {
        await (accept ? workspaceApi.acceptBusinessInvitation(id) : workspaceApi.rejectBusinessInvitation(id));
      } else {
        await (accept ? workspaceApi.acceptRoomInvitation(id) : workspaceApi.rejectRoomInvitation(id));
      }
      await Promise.all([invitationsQuery.refetch(), refreshWorkspaces()]);
    } catch (error) {
      setPageError(error instanceof ApiError ? error.message : "Dəvət cavablandırılmadı. Yenidən cəhd edin.");
    } finally {
      setRespondingInvitation(null);
    }
  };

  return (
    <div className="onboarding-frame">
      <a className="skip-link" href="#onboarding-content">Əsas məzmuna keç</a>
      <header className="onboarding-header">
        <div className="shell onboarding-header__inner">
          <Brand />
          <Link to="/app" className="onboarding-header__link">Hesabıma keç</Link>
        </div>
      </header>
      <main id="onboarding-content" className="onboarding-main shell">
        <div className="onboarding-intro">
          <p className="eyebrow">Vahid hesab, fərqli iş sahələri</p>
          <h1>{mode === "choose" ? "NövbəTime-dan necə istifadə edəcəksiniz?" : mode === "individual" ? "Fərdi iş sahənizi yaradın" : "Biznesinizi yaradın"}</h1>
          <p>
            {mode === "choose"
              ? "İndi birini seçin. Sonradan eyni hesabda başqa biznes və rollar da əlavə edə bilərsiniz."
              : "Bu addım pulsuzdur. Ödəniş yalnız otağı yayımlamaq və növbə qəbul etməyə başlamaq üçün tələb olunur."}
          </p>
        </div>

        <NotificationEvent tone="error" message={pageError} />

        {mode === "choose" ? (
          <OnboardingChoices
            pendingInvitationCount={pendingInvitationCount}
            onCustomer={() => void continueAsCustomer()}
            onIndividual={() => chooseMode("individual")}
            onBusiness={() => chooseMode("business")}
          />
        ) : mode === "individual" ? (
          <IndividualOnboarding
            existingWorkspace={existingIndividual}
            onBack={() => chooseMode("choose")}
            onExisting={(workspace) => void enterWorkspace(workspace)}
            onCreated={async (workspaceId) => {
              const refreshed = await refreshWorkspaces();
              const workspace = refreshed.find((item) => item.type === "INDIVIDUAL" && item.contextId === workspaceId);
              if (workspace) selectWorkspace(workspace);
              await navigate("/app");
            }}
          />
        ) : (
          <BusinessOnboarding
            defaultPhone={user?.phone ?? ""}
            categories={categoriesQuery.data ?? []}
            categoriesLoading={categoriesQuery.isPending}
            onBack={() => chooseMode("choose")}
            onCreated={async (businessId) => {
              const refreshed = await refreshWorkspaces();
              const workspace = refreshed.find((item) => item.type === "BUSINESS" && item.contextId === businessId);
              if (workspace) selectWorkspace(workspace);
              await navigate("/app");
            }}
          />
        )}

        <InvitationPanel
          loading={invitationsQuery.isPending}
          businessInvitations={invitationsQuery.data?.businessInvitations ?? []}
          roomInvitations={invitationsQuery.data?.roomInvitations ?? []}
          respondingInvitation={respondingInvitation}
          onRespond={respondToInvitation}
        />
      </main>
    </div>
  );
}

type OnboardingChoicesProps = {
  pendingInvitationCount: number;
  onCustomer: () => void;
  onIndividual: () => void;
  onBusiness: () => void;
};

function OnboardingChoices({ pendingInvitationCount, onCustomer, onIndividual, onBusiness }: OnboardingChoicesProps) {
  return (
    <section className="onboarding-choices" aria-label="İstifadə növünü seçin">
      <button type="button" className="choice-card" onClick={onCustomer}>
        <span className="choice-card__number" aria-hidden="true">01</span>
        <strong>Müştəri kimi davam et</strong>
        <span>Otaq tapın, canlı növbəyə qoşulun və planlı rezervasiyalarınızı idarə edin.</span>
        <span className="choice-card__action">Hesabıma keç <span aria-hidden="true">→</span></span>
      </button>
      <button type="button" className="choice-card" onClick={onIndividual}>
        <span className="choice-card__number" aria-hidden="true">02</span>
        <strong>Fərdi mütəxəssis</strong>
        <span>Özünüz üçün bir növbə otağı və vahid iş təqvimi yaradın.</span>
        <span className="choice-card__action">Fərdi sahə yarat <span aria-hidden="true">→</span></span>
      </button>
      <button type="button" className="choice-card" onClick={onBusiness}>
        <span className="choice-card__number" aria-hidden="true">03</span>
        <strong>Biznes</strong>
        <span>Filiallar, otaqlar və işçilər üçün çoxsahəli idarəetmə mühiti yaradın.</span>
        <span className="choice-card__action">Biznes yarat <span aria-hidden="true">→</span></span>
      </button>
      {pendingInvitationCount > 0 ? (
        <a className="onboarding-invitation-link" href="#pending-invitations">
          {pendingInvitationCount} gözləyən dəvətiniz var
        </a>
      ) : null}
    </section>
  );
}

type IndividualOnboardingProps = {
  existingWorkspace: WorkspaceContext | undefined;
  onBack: () => void;
  onExisting: (workspace: WorkspaceContext) => void;
  onCreated: (workspaceId: number) => Promise<void>;
};

function IndividualOnboarding({ existingWorkspace, onBack, onExisting, onCreated }: IndividualOnboardingProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IndividualWorkspaceFormValues>({
    resolver: zodResolver(individualWorkspaceSchema),
    defaultValues: { name: "" },
  });

  if (existingWorkspace) {
    return (
      <section className="onboarding-form-card" aria-labelledby="existing-individual-title">
        <p className="eyebrow">Artıq hazırdır</p>
        <h2 id="existing-individual-title">{existingWorkspace.name}</h2>
        <p>Bir hesab yalnız bir fərdi mütəxəssis sahəsi yarada bilər. Mövcud sahənizə keçə bilərsiniz.</p>
        <div className="onboarding-form-actions">
          <Button variant="secondary" onClick={onBack}>Geri</Button>
          <Button onClick={() => onExisting(existingWorkspace)}>İş sahəsinə keç</Button>
        </div>
      </section>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const workspace = await workspaceApi.createIndividual({ name: values.name, timezone: "Asia/Baku" });
      await onCreated(workspace.id);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Fərdi iş sahəsi yaradıla bilmədi.");
    }
  });

  return (
    <section className="onboarding-form-card" aria-labelledby="individual-form-title">
      <h2 id="individual-form-title">İş sahəsinin əsas məlumatları</h2>
      <p>Bu ad müştərilərə sizi tanımağa kömək edəcək. Otaq və açıq saatları növbəti mərhələdə əlavə edəcəksiniz.</p>
      <NotificationEvent tone="error" message={submitError} />
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <TextField label="İş sahəsinin adı" autoComplete="organization" error={errors.name?.message} {...register("name")} />
        <div className="onboarding-form-actions">
          <Button type="button" variant="secondary" onClick={onBack}>Geri</Button>
          <Button type="submit" loading={isSubmitting}>Davam et</Button>
        </div>
      </form>
    </section>
  );
}

type BusinessOnboardingProps = {
  defaultPhone: string;
  categories: Awaited<ReturnType<typeof publicApi.categories>>;
  categoriesLoading: boolean;
  onBack: () => void;
  onCreated: (businessId: number) => Promise<void>;
};

function BusinessOnboarding({ defaultPhone, categories, categoriesLoading, onBack, onCreated }: BusinessOnboardingProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    control,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessOnboardingFormValues>({
    resolver: zodResolver(businessOnboardingSchema),
    defaultValues: { phone: toLocalPhoneInput(defaultPhone), categoryId: "", customSubcategory: "", description: "" },
  });
  const selectedCategoryId = useWatch({ control, name: "categoryId" });
  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === selectedCategoryId),
    [categories, selectedCategoryId],
  );
  const needsCustomCategory = selectedCategory?.code === "OTHER";

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    if (needsCustomCategory && !values.customSubcategory?.trim()) {
      setError("customSubcategory", { message: "Biznes sahəsini yazın." }, { shouldFocus: true });
      return;
    }
    try {
      const business = await workspaceApi.createBusiness({
        name: values.name,
        phone: values.phone,
        description: values.description?.trim() || null,
        legalName: null,
        taxId: null,
        logoUrl: null,
        timezone: "Asia/Baku",
        categoryId: values.categoryId ? Number(values.categoryId) : null,
        customSubcategory: needsCustomCategory ? values.customSubcategory?.trim() || null : null,
      });
      await onCreated(business.id);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Biznes yaradıla bilmədi.");
    }
  });

  return (
    <section className="onboarding-form-card" aria-labelledby="business-form-title">
      <h2 id="business-form-title">Biznesin əsas məlumatları</h2>
      <p>Filial və otaqlar biznes yaradıldıqdan sonra əlavə ediləcək. Hüquqi məlumatları indi daxil etmək məcburi deyil.</p>
      <NotificationEvent tone="error" message={submitError} />
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <TextField label="Biznes adı" autoComplete="organization" error={errors.name?.message} {...register("name")} />
        <PhoneField
          label="Biznes telefonu"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <SelectField
          label="Biznes kateqoriyası (istəyə bağlı)"
          disabled={categoriesLoading}
          error={errors.categoryId?.message}
          {...register("categoryId")}
        >
          <option value="">{categoriesLoading ? "Kateqoriyalar açılır…" : "Kateqoriya seçilməyib"}</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </SelectField>
        {needsCustomCategory ? (
          <TextField label="Biznes sahəsi" error={errors.customSubcategory?.message} {...register("customSubcategory")} />
        ) : null}
        <TextAreaField
          label="Qısa açıqlama (istəyə bağlı)"
          rows={4}
          error={errors.description?.message}
          {...register("description")}
        />
        <div className="onboarding-form-actions">
          <Button type="button" variant="secondary" onClick={onBack}>Geri</Button>
          <Button type="submit" loading={isSubmitting}>Biznes yarat</Button>
        </div>
      </form>
    </section>
  );
}

type InvitationPanelProps = {
  loading: boolean;
  businessInvitations: Awaited<ReturnType<typeof workspaceApi.invitations>>["businessInvitations"];
  roomInvitations: Awaited<ReturnType<typeof workspaceApi.invitations>>["roomInvitations"];
  respondingInvitation: string | null;
  onRespond: (kind: "business" | "room", id: number, accept: boolean) => Promise<void>;
};

function InvitationPanel({ loading, businessInvitations, roomInvitations, respondingInvitation, onRespond }: InvitationPanelProps) {
  const total = businessInvitations.length + roomInvitations.length;

  return (
    <section className="invitation-panel" id="pending-invitations" aria-labelledby="invitation-title">
      <div className="invitation-panel__heading">
        <div>
          <p className="eyebrow">İcazələr sizdədir</p>
          <h2 id="invitation-title">Gözləyən dəvətlər</h2>
        </div>
        {!loading ? <span>{total}</span> : null}
      </div>
      {loading ? <p role="status">Dəvətlər yoxlanılır…</p> : total === 0 ? (
        <p className="invitation-panel__empty">Hazırda cavab gözləyən biznes və ya otaq dəvətiniz yoxdur.</p>
      ) : (
        <div className="invitation-list">
          {businessInvitations.map((invitation) => (
            <article className="invitation-item" key={`business-${invitation.id}`}>
              <div>
                <span className="invitation-item__type">Biznes dəvəti · {workspaceTypeLabel("BUSINESS")}</span>
                <h3>{invitation.businessName}</h3>
                <p>{invitation.invitedFirstName} {invitation.invitedLastName} tərəfindən {invitationDate(invitation.invitedAt)} tarixində göndərilib.</p>
              </div>
              <div className="invitation-item__actions">
                <Button
                  variant="secondary"
                  loading={respondingInvitation === `business:${invitation.id}:reject`}
                  disabled={respondingInvitation !== null}
                  onClick={() => void onRespond("business", invitation.id, false)}
                >Rədd et</Button>
                <Button
                  loading={respondingInvitation === `business:${invitation.id}:accept`}
                  disabled={respondingInvitation !== null}
                  onClick={() => void onRespond("business", invitation.id, true)}
                >Qəbul et</Button>
              </div>
            </article>
          ))}
          {roomInvitations.map((invitation) => (
            <article className="invitation-item" key={`room-${invitation.id}`}>
              <div>
                <span className="invitation-item__type">Otaq sahibi dəvəti</span>
                <h3>{invitation.roomName}</h3>
                <p>{invitationDate(invitation.invitedAt)} tarixində göndərilib. Qəbul etdikdə gözləyən biznes üzvlüyünüz də avtomatik təsdiqlənəcək və otaq ayrıca iş sahəsi kimi görünəcək.</p>
              </div>
              <div className="invitation-item__actions">
                <Button
                  variant="secondary"
                  loading={respondingInvitation === `room:${invitation.id}:reject`}
                  disabled={respondingInvitation !== null}
                  onClick={() => void onRespond("room", invitation.id, false)}
                >Rədd et</Button>
                <Button
                  loading={respondingInvitation === `room:${invitation.id}:accept`}
                  disabled={respondingInvitation !== null}
                  onClick={() => void onRespond("room", invitation.id, true)}
                >Qəbul et</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
