import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useBeforeUnload, useBlocker, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ManagementError, ManagementLoading, StatusBadge } from "../../features/management/ManagementUi";
import { apiMessage } from "../../features/management/managementUtils";
import { reservationModeLabel, roomStatusLabel, visibilityLabel } from "../../features/management/managementLabels";
import { RoomOverviewSection } from "../../features/management/room/RoomOverviewSection";
import { RoomOwnersSection } from "../../features/management/room/RoomOwnersSection";
import { RoomQrSection } from "../../features/management/room/RoomQrSection";
import { RoomScheduleSection } from "../../features/management/room/RoomScheduleSection";
import { RoomSetupProgress, type RoomSetupStep } from "../../features/management/room/RoomSetupProgress";
import { roomErrorNavigation } from "../../features/management/room/roomErrorNavigation";
import { readScheduleDraft } from "../../features/management/room/roomScheduleDraft";
import { managementApi } from "../../shared/api/managementApi";
import { usePageMeta } from "../../shared/meta/usePageMeta";
import { RoomInlineFeedback, type RoomNavigationState } from "../../features/management/room/RoomInlineFeedback";
import { Button, ButtonLink } from "../../shared/ui/Button";

type RoomSection = "overview" | "owners" | "schedule" | "qr";
type ActiveSetupStep = RoomSetupStep;

function roomSection(value: string | null): RoomSection {
  return value === "owners" || value === "schedule" || value === "qr" ? value : "overview";
}

function requestedSetupStep(value: string | null): ActiveSetupStep | null {
  return value === "basics" || value === "owners" || value === "schedule" || value === "qr" ? value : null;
}

function activeSetupStep(value: string | null, hasOwner: boolean, hasSchedule: boolean, hasModeConfiguration: boolean): ActiveSetupStep {
  const requested = requestedSetupStep(value);
  if (requested) return requested;
  if (!hasOwner) return "owners";
  if (!hasSchedule || !hasModeConfiguration) return "schedule";
  return requested ?? "qr";
}

export function RoomManagementPage() {
  const roomId = Number(useParams().roomId);
  const [searchParams, setSearchParams] = useSearchParams();
  const section = roomSection(searchParams.get("section"));
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const completedNavigationRef = useRef(false);
  const [navigationState, setNavigationState] = useState<RoomNavigationState>({ busy: false, dirty: false });
  const reportNavigationState = useCallback((state: RoomNavigationState) => {
    setNavigationState((current) => current.busy === state.busy && current.dirty === state.dirty ? current : state);
  }, []);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !completedNavigationRef.current && currentLocation.pathname !== nextLocation.pathname && (navigationState.busy || navigationState.dirty));
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (!navigationState.busy && window.confirm("Saxlanmamış dəyişikliklər var. Onları saxlamadan çıxmaq istəyirsiniz?")) blocker.proceed();
    else blocker.reset();
  }, [blocker, navigationState.busy]);
  useBeforeUnload(useCallback((event) => {
    if (!navigationState.dirty && !navigationState.busy) return;
    event.preventDefault();
    event.returnValue = "";
  }, [navigationState]));
  const stepParam = searchParams.get("step");
  const sectionParam = searchParams.get("section");
  useEffect(() => {
    if (window.location.hash) return;
    const frame = window.requestAnimationFrame(() => {
      const heading = contentRef.current?.querySelector<HTMLElement>("h2");
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [stepParam, sectionParam]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const roomQuery = useQuery({
    queryKey: ["management-room", roomId],
    queryFn: () => managementApi.room(roomId),
    enabled: Number.isInteger(roomId),
  });
  const assignmentsQuery = useQuery({
    queryKey: ["management-room-assignments", roomId],
    queryFn: () => managementApi.roomAssignments(roomId),
    enabled: Number.isInteger(roomId),
  });
  const scheduleQuery = useQuery({
    queryKey: ["management-room-schedule", roomId],
    queryFn: () => managementApi.weeklyAvailability(roomId),
    enabled: Number.isInteger(roomId),
  });
  const readinessQuery = useQuery({
    queryKey: ["management-room-readiness", roomId],
    queryFn: () => managementApi.roomSetupReadiness(roomId),
    enabled: Number.isInteger(roomId) && roomQuery.data?.status === "DRAFT",
  });
  const ownerStatusSignature = (assignmentsQuery.data ?? []).map((assignment) => `${assignment.id}:${assignment.status}`).join(",");
  useEffect(() => {
    if (roomQuery.data?.status === "DRAFT") void queryClient.invalidateQueries({ queryKey: ["management-room-readiness", roomId] });
  }, [ownerStatusSignature, queryClient, roomId, roomQuery.data?.status]);
  const publishMutation = useMutation({
    mutationFn: (finishSetup: boolean) => {
      void finishSetup;
      return managementApi.publishRoom(roomId);
    },
    onSuccess: async (saved, finishSetup) => {
      setActionMessage("Otaq yayımlandı və yeni növbələr üçün hazırdır.");
      queryClient.setQueryData(["management-room", roomId], saved);
      if (finishSetup) {
        completedNavigationRef.current = true;
        await navigate(`/app/rooms/${roomId}/today`);
      }
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: () => managementApi.deactivateRoom(roomId),
    onSuccess: async () => {
      setActionMessage("Otaq dayandırıldı. Yeni növbə və rezervasiya qəbul edilmir.");
      await queryClient.invalidateQueries({ queryKey: ["management-room", roomId] });
    },
  });
  const archiveMutation = useMutation({
    mutationFn: () => managementApi.archiveRoom(roomId),
    onSuccess: async () => {
      const room = roomQuery.data;
      queryClient.removeQueries({ queryKey: ["management-room", roomId] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
        room?.businessId
          ? queryClient.invalidateQueries({ queryKey: ["management-business-rooms", room.businessId] })
          : Promise.resolve(),
        room?.individualWorkspaceId
          ? queryClient.invalidateQueries({ queryKey: ["individual-workspace-rooms", room.individualWorkspaceId] })
          : Promise.resolve(),
      ]);
      if (room?.businessId) {
        await navigate(`/app/businesses/${room.businessId}/rooms`);
      } else if (room?.individualWorkspaceId) {
        await navigate(`/app/individual/${room.individualWorkspaceId}`);
      } else {
        await navigate("/app");
      }
    },
  });

  const title = roomQuery.data ? `${roomQuery.data.name} — NövbəTime` : "Otaq idarəetməsi — NövbəTime";
  usePageMeta(title, "Otaq sahibləri, iş qrafiki, növbə rejimi və QR kodlarını idarə edin.");

  if (!Number.isInteger(roomId)) return <ManagementError message="Otaq identifikatoru düzgün deyil." />;
  if (roomQuery.isPending) return <ManagementLoading label="Otaq idarəetməsi açılır…" />;
  if (roomQuery.isError) {
    return <ManagementError message={apiMessage(roomQuery.error ?? assignmentsQuery.error ?? scheduleQuery.error, "Otaq açıla bilmədi.")} />;
  }

  const room = roomQuery.data;
  const hasOwner = (assignmentsQuery.data ?? []).some((assignment) => assignment.status === "ACTIVE");
  const hasSchedule = (scheduleQuery.data ?? []).some((rule) => rule.active);
  const hasModeConfiguration = room.reservationMode === "PLANNED_BOOKING"
    ? room.bookingWindowDays > 0
    : Boolean(room.liveQueueResetPolicy && (room.liveQueueResetLocalTime || room.liveQueueResetIntervalMinutes));
  const readyCount = [Boolean(room.name), hasOwner, hasSchedule, hasModeConfiguration].filter(Boolean).length;
  const setupMode = room.status === "DRAFT";
  const setupStep = activeSetupStep(searchParams.get("step"), hasOwner, hasSchedule, hasModeConfiguration);
  const retainedScheduleDraft = readScheduleDraft(roomId);
  const hasRetainedScheduleDraft = Boolean(retainedScheduleDraft?.days || retainedScheduleDraft?.configuration);
  const goToSetupStep = (step: ActiveSetupStep) => setSearchParams({ step });
  const requestSetupStep = (step: ActiveSetupStep) => {
    if (navigationState.busy || publishMutation.isPending) return;
    if (navigationState.dirty && !window.confirm("Saxlanmamış dəyişikliklər var. İndi başqa mərhələyə keçmək istəyirsiniz?")) return;
    goToSetupStep(step);
  };
  const setupContentPending = setupMode && !requestedSetupStep(stepParam) && (assignmentsQuery.isPending || scheduleQuery.isPending);
  const completedSteps: RoomSetupStep[] = [
    ...(room.name ? ["basics" as const] : []),
    ...(hasOwner ? ["owners" as const] : []),
    ...(hasSchedule && hasModeConfiguration ? ["schedule" as const] : []),
  ];
  const returnFromSetup = () => room.businessId
    ? navigate(`/app/businesses/${room.businessId}/rooms`)
    : navigate(`/app/individual/${room.individualWorkspaceId}`);
  const actionError = publishMutation.error ?? deactivateMutation.error ?? archiveMutation.error;
  const errorAction = actionError ? roomErrorNavigation(actionError, {
    roomId,
    businessId: room.businessId,
    individualWorkspaceId: room.individualWorkspaceId,
    setupMode,
  }) : null;
  const errorTitle = publishMutation.error
    ? "Otaq yayımlanmadı"
    : deactivateMutation.error
      ? "Qəbul dayandırılmadı"
      : "Otaq arxivləşdirilmədi";

  return (
    <div className="management-page room-workspace">
      <header className="room-workspace__header">
        <div>
          <p className="eyebrow">{reservationModeLabel(room.reservationMode)}</p>
          <div className="room-workspace__title">
            <h1>{room.name}</h1>
            <StatusBadge tone={room.status === "PUBLISHED" ? "success" : room.status === "DRAFT" ? "warning" : "neutral"}>{roomStatusLabel(room.status)}</StatusBadge>
          </div>
          <p>{visibilityLabel(room.visibility)} · {room.defaultSlotDurationMinutes} dəqiqəlik standart aralıq</p>
        </div>
        <div className="room-workspace__actions">
          {room.status === "PUBLISHED" && room.visibility !== "PRIVATE" ? <ButtonLink variant="secondary" to={`/rooms/${room.id}`}>İctimai səhifə</ButtonLink> : null}
          {room.status === "PUBLISHED" ? (
            <Button variant="secondary" loading={deactivateMutation.isPending} onClick={() => deactivateMutation.mutate()}>Qəbulu dayandır</Button>
          ) : room.status === "INACTIVE" ? (
            <Button loading={publishMutation.isPending} onClick={() => publishMutation.mutate(false)}>Qəbulu yenidən başlat</Button>
          ) : null}
        </div>
      </header>

      <RoomInlineFeedback success={actionMessage} error={actionError ? `${errorTitle}: ${apiMessage(actionError, "Otaq əməliyyatı tamamlanmadı.")}` : null} action={errorAction} />

      {!setupMode && room.status !== "PUBLISHED" ? (
        <section className="readiness-strip" aria-label={`Otaq hazırlığı: 4 addımdan ${readyCount} addım tamamlanıb`}>
          <div><span>{readyCount}/4</span><strong>Yayıma hazırlıq</strong></div>
          <ul>
            <li className={room.name ? "is-complete" : ""}>Otaq məlumatları</li>
            <li className={hasOwner ? "is-complete" : ""}>Aktiv otaq sahibi</li>
            <li className={hasSchedule ? "is-complete" : ""}>İş qrafiki</li>
            <li className={hasModeConfiguration ? "is-complete" : ""}>Rejim ayarları</li>
          </ul>
        </section>
      ) : null}

      {setupMode ? <RoomSetupProgress currentStep={setupStep} completed={completedSteps} onStepChange={requestSetupStep} disabled={navigationState.busy || publishMutation.isPending} /> : null}
      {setupMode && readinessQuery.isError ? <aside className="warning-note" role="alert">
        Yayımlama tələblərini yoxlamaq mümkün olmadı. Daxil etdiyiniz məlumatlar qorunur.
        <Button variant="secondary" loading={readinessQuery.isFetching} onClick={() => void readinessQuery.refetch()}>Yoxlamanı təkrarla</Button>
      </aside> : null}
      {setupMode && readinessQuery.isError ? <div className="warning-note" role="alert">Yayımlama tələbləri yoxlanılmadı. <Button variant="quiet" loading={readinessQuery.isFetching} onClick={() => void readinessQuery.refetch()}>Yenidən yoxla</Button></div> : null}
      {(assignmentsQuery.isError || scheduleQuery.isError) ? <div className="warning-note" role="alert">Otaq sahibləri və ya qrafik məlumatı açılmadı. <Button variant="quiet" onClick={() => { void assignmentsQuery.refetch(); void scheduleQuery.refetch(); }}>Yenidən yoxla</Button></div> : null}
      {setupMode && readinessQuery.data && !readinessQuery.data.ready ? <aside className="room-helper-card room-readiness-notice" aria-label="Yayımlama üçün tələb olunanlar">
        <div><strong>Yayımlamadan əvvəl</strong><ul>{readinessQuery.data.issues.map((issue) => <li key={issue.code}>{issue.message} {issue.code.toUpperCase().includes("SUBSCRIPTION") || issue.code.toUpperCase().includes("LIMIT") ? <ButtonLink variant="quiet" to={room.businessId ? `/app/businesses/${room.businessId}/subscription` : `/app/individual/${room.individualWorkspaceId}/subscription`}>Abunəliyə bax</ButtonLink> : <button className="room-text-link" onClick={() => requestSetupStep(issue.step)}>Düzəlt</button>}</li>)}</ul></div>
      </aside> : null}

      {!setupMode ? <nav className="room-tabs" aria-label="Otaq ayarları">
        {[
          ["overview", "Əsas ayarlar"],
          ["owners", "Otaq sahibləri"],
          ["schedule", "İş qrafiki"],
          ["qr", "QR kodlar"],
        ].map(([value, label]) => (
          <NavLink
            key={value}
            to={`?section=${value}`}
            className={section === value ? "room-tabs__link room-tabs__link--active" : "room-tabs__link"}
            onClick={(event) => {
              event.preventDefault();
              if (navigationState.busy) return;
              if (navigationState.dirty && !window.confirm("Saxlanmamış dəyişiklikləri saxlamadan keçmək istəyirsiniz?")) return;
              setSearchParams({ section: value });
            }}
          >{label}</NavLink>
        ))}
      </nav> : null}

      <div ref={contentRef} className="room-workspace__content">
      {setupContentPending ? <ManagementLoading label="Qurulum mərhələsi açılır…" /> : null}
      {!setupMode && section === "overview" ? <RoomOverviewSection room={room} onNavigationStateChange={reportNavigationState} /> : null}
      {!setupMode && section === "owners" ? <RoomOwnersSection room={room} onNavigationStateChange={reportNavigationState} /> : null}
      {!setupMode && section === "schedule" ? <RoomScheduleSection room={room} onNavigationStateChange={reportNavigationState} /> : null}
      {!setupMode && section === "qr" ? <RoomQrSection room={room} onNavigationStateChange={reportNavigationState} /> : null}

      {setupMode && !setupContentPending && setupStep === "basics" ? <RoomOverviewSection room={room} onNavigationStateChange={reportNavigationState} setupNavigation={{ onBack: () => void returnFromSetup(), onContinue: () => goToSetupStep("owners") }} /> : null}
      {setupMode && !setupContentPending && setupStep === "owners" ? (
        <RoomOwnersSection
          room={room}
          onNavigationStateChange={reportNavigationState}
          setupNavigation={{ canContinue: hasOwner, onBack: () => requestSetupStep("basics"), onContinue: () => goToSetupStep("schedule") }}
        />
      ) : null}
      {setupMode && !setupContentPending && setupStep === "schedule" ? (
        <RoomScheduleSection
          room={room}
          onNavigationStateChange={reportNavigationState}
          setupNavigation={{ onBack: () => requestSetupStep("owners"), onContinue: () => goToSetupStep("qr") }}
        />
      ) : null}
      {setupMode && !setupContentPending && setupStep === "qr" ? (
        <>
        {hasRetainedScheduleDraft ? <aside className="warning-note" role="status">
          İş qrafikində saxlanmamış dəyişiklikləriniz var. Yayımlamadan əvvəl onları saxlayın və ya ləğv edin.
          <Button variant="secondary" disabled={navigationState.busy} onClick={() => requestSetupStep("schedule")}>İş qrafikinə qayıt</Button>
        </aside> : null}
        <RoomQrSection
          room={room}
          onNavigationStateChange={reportNavigationState}
          setupNavigation={{ finishing: publishMutation.isPending, canFinish: readinessQuery.data?.ready === true && !readinessQuery.isFetching && !hasRetainedScheduleDraft, onBack: () => requestSetupStep("schedule"), onFinish: () => publishMutation.mutate(true) }}
        />
        </>
      ) : null}

      </div>
      {!setupMode && section === "overview" ? <section className="danger-zone" aria-labelledby="room-danger-title">
        <div><h2 id="room-danger-title">Otağı arxivləşdir</h2><p>Tarixçə və hesabatlar saxlanılır, yeni növbə qəbul edilmir.</p></div>
        <Button
          variant="quiet"
          loading={archiveMutation.isPending}
          onClick={() => {
            if (window.confirm(`${room.name} otağını arxivləşdirmək istəyirsiniz? Bu əməliyyat aktiv açıq növbə olduqda qəbul edilməyəcək.`)) archiveMutation.mutate();
          }}
        >Arxivləşdir</Button>
      </section> : null}
    </div>
  );
}
