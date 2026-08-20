import type {
  Business,
  BusinessInput,
  BusinessInvitation,
  IndividualWorkspace,
  IndividualWorkspaceInput,
  RoomInvitation,
  UserInvitations,
  WorkspaceContext,
} from "./contracts";
import { apiRequest } from "./httpClient";

export const workspaceApi = {
  list: () => apiRequest<WorkspaceContext[]>("/api/users/me/workspaces"),
  invitations: () => apiRequest<UserInvitations>("/api/users/me/invitations"),
  createIndividual: (input: IndividualWorkspaceInput) =>
    apiRequest<IndividualWorkspace>("/api/individual-workspaces", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createBusiness: (input: BusinessInput) =>
    apiRequest<Business>("/api/businesses", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  acceptBusinessInvitation: (invitationId: number) =>
    apiRequest<BusinessInvitation>(`/api/users/me/business-invitations/${invitationId}/accept`, {
      method: "POST",
    }),
  rejectBusinessInvitation: (invitationId: number) =>
    apiRequest<BusinessInvitation>(`/api/users/me/business-invitations/${invitationId}/reject`, {
      method: "POST",
    }),
  acceptRoomInvitation: (invitationId: number) =>
    apiRequest<RoomInvitation>(`/api/users/me/room-invitations/${invitationId}/accept`, {
      method: "POST",
    }),
  rejectRoomInvitation: (invitationId: number) =>
    apiRequest<RoomInvitation>(`/api/users/me/room-invitations/${invitationId}/reject`, {
      method: "POST",
    }),
};
