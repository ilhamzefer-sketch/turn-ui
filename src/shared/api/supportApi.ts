import type { OwnershipDispute, OwnershipDisputeInput } from "./contracts";
import { apiRequest } from "./httpClient";

export const supportApi = {
  createOwnershipDispute: (input: OwnershipDisputeInput) =>
    apiRequest<OwnershipDispute>("/api/support/ownership-disputes", {
      method: "POST",
      body: JSON.stringify(input),
      retryAuthentication: false,
    }),
};
