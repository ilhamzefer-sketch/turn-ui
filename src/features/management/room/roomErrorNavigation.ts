import { ApiError } from "../../../shared/api/httpClient";
import type { ErrorDialogAction } from "../../../shared/ui/ActionableErrorDialog";

type RoomErrorContext = {
  roomId: number;
  businessId: number | null;
  individualWorkspaceId: number | null;
  setupMode: boolean;
};

export function roomErrorNavigation(error: unknown, context: RoomErrorContext): ErrorDialogAction | null {
  const message = error instanceof Error ? error.message.toLocaleLowerCase("az-AZ") : "";
  const roomSettingsPath = `/app/rooms/${context.roomId}/settings`;

  if ((error instanceof ApiError && error.status === 402) || message.includes("abunəlik")) {
    if (context.businessId) {
      return { label: "Abunəliyə keç", to: `/app/businesses/${context.businessId}/subscription` };
    }
    if (context.individualWorkspaceId) {
      return { label: "Abunəliyə keç", to: `/app/individual/${context.individualWorkspaceId}/subscription` };
    }
  }

  if (message.includes("otaq sahibi")) {
    return {
      label: "Otaq sahiblərinə keç",
      to: context.setupMode ? `${roomSettingsPath}?step=owners` : `${roomSettingsPath}?section=owners`,
    };
  }

  if (message.includes("iş cədvəli") || message.includes("iş qrafiki") || message.includes("həftəlik")) {
    return {
      label: "İş qrafikinə keç",
      to: context.setupMode ? `${roomSettingsPath}?step=schedule` : `${roomSettingsPath}?section=schedule`,
    };
  }

  if (!context.setupMode && message.includes("reset qaydası")) {
    return {
      label: "Sıfırlama ayarına keç",
      to: `${roomSettingsPath}?section=overview#live-queue-reset-policy`,
    };
  }

  if (!context.setupMode && (
    message.includes("əsas məlumat")
    || message.includes("rezervasiya və ləğv parametrləri")
  )) {
    return { label: "Əsas ayarlara keç", to: `${roomSettingsPath}?section=overview` };
  }

  return null;
}
