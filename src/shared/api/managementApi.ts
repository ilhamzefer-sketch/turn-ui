import type {
  AvailabilityException,
  AvailabilityExceptionInput,
  Branch,
  BranchInput,
  Business,
  BusinessInput,
  BusinessMember,
  BusinessMemberInput,
  BusinessRole,
  IndividualWorkspace,
  ManagedRoom,
  QrCredential,
  RoomAssignment,
  RoomConfigurationInput,
  RoomInput,
  WeeklyAvailabilityRule,
  WeeklyAvailabilityRuleInput,
} from "./contracts";
import { apiRequest } from "./httpClient";

export const managementApi = {
  business: (businessId: number) => apiRequest<Business>(`/api/businesses/${businessId}`),
  updateBusiness: (businessId: number, input: BusinessInput) =>
    apiRequest<Business>(`/api/businesses/${businessId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  branches: (businessId: number) => apiRequest<Branch[]>(`/api/businesses/${businessId}/branches`),
  createBranch: (businessId: number, input: BranchInput) =>
    apiRequest<Branch>(`/api/businesses/${businessId}/branches`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateBranch: (branchId: number, input: BranchInput) =>
    apiRequest<Branch>(`/api/branches/${branchId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  archiveBranch: (branchId: number) => apiRequest<void>(`/api/branches/${branchId}`, { method: "DELETE" }),
  members: (businessId: number) => apiRequest<BusinessMember[]>(`/api/businesses/${businessId}/members`),
  inviteMember: (businessId: number, input: BusinessMemberInput) =>
    apiRequest<BusinessMember>(`/api/businesses/${businessId}/members/by-phone`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateMemberRole: (businessId: number, membershipId: number, role: BusinessRole) =>
    apiRequest<BusinessMember>(`/api/businesses/${businessId}/members/${membershipId}`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),
  removeMember: (businessId: number, membershipId: number) =>
    apiRequest<void>(`/api/businesses/${businessId}/members/${membershipId}`, { method: "DELETE" }),
  businessRooms: (businessId: number) => apiRequest<ManagedRoom[]>(`/api/businesses/${businessId}/rooms`),
  createBusinessRoom: (branchId: number, input: RoomInput) =>
    apiRequest<ManagedRoom>(`/api/branches/${branchId}/rooms`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  individualWorkspace: (workspaceId: number) =>
    apiRequest<IndividualWorkspace>(`/api/individual-workspaces/${workspaceId}`),
  individualRooms: (workspaceId: number) =>
    apiRequest<ManagedRoom[]>(`/api/individual-workspaces/${workspaceId}/rooms`),
  createIndividualRoom: (workspaceId: number, input: RoomInput) =>
    apiRequest<ManagedRoom>(`/api/individual-workspaces/${workspaceId}/rooms`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  room: (roomId: number) => apiRequest<ManagedRoom>(`/api/rooms/${roomId}`),
  updateRoom: (roomId: number, input: RoomInput) =>
    apiRequest<ManagedRoom>(`/api/rooms/${roomId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  archiveRoom: (roomId: number) => apiRequest<void>(`/api/rooms/${roomId}`, { method: "DELETE" }),
  updateRoomConfiguration: (roomId: number, input: RoomConfigurationInput) =>
    apiRequest<ManagedRoom>(`/api/rooms/${roomId}/configuration`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  publishRoom: (roomId: number) => apiRequest<ManagedRoom>(`/api/rooms/${roomId}/publish`, { method: "POST" }),
  deactivateRoom: (roomId: number) => apiRequest<ManagedRoom>(`/api/rooms/${roomId}/deactivate`, { method: "POST" }),
  roomAssignments: (roomId: number) => apiRequest<RoomAssignment[]>(`/api/rooms/${roomId}/assignments`),
  assignRoomOwner: (roomId: number, userId: number) =>
    apiRequest<RoomAssignment>(`/api/rooms/${roomId}/assignments`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  revokeRoomOwner: (roomId: number, assignmentId: number) =>
    apiRequest<void>(`/api/rooms/${roomId}/assignments/${assignmentId}`, { method: "DELETE" }),
  updateMyRoomPhoneVisibility: (assignmentId: number, showPhonePublicly: boolean) =>
    apiRequest<RoomAssignment>(`/api/users/me/room-assignments/${assignmentId}/phone-visibility`, {
      method: "PUT",
      body: JSON.stringify({ showPhonePublicly }),
    }),
  weeklyAvailability: (roomId: number) =>
    apiRequest<WeeklyAvailabilityRule[]>(`/api/rooms/${roomId}/availability-rules`),
  replaceWeeklyAvailability: (roomId: number, rules: WeeklyAvailabilityRuleInput[]) =>
    apiRequest<WeeklyAvailabilityRule[]>(`/api/rooms/${roomId}/availability-rules`, {
      method: "PUT",
      body: JSON.stringify({ rules }),
    }),
  availabilityExceptions: (roomId: number) =>
    apiRequest<AvailabilityException[]>(`/api/rooms/${roomId}/availability-exceptions`),
  createAvailabilityException: (roomId: number, input: AvailabilityExceptionInput) =>
    apiRequest<AvailabilityException>(`/api/rooms/${roomId}/availability-exceptions`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteAvailabilityException: (roomId: number, exceptionId: number) =>
    apiRequest<void>(`/api/rooms/${roomId}/availability-exceptions/${exceptionId}`, { method: "DELETE" }),
  qrCodes: (roomId: number) => apiRequest<QrCredential[]>(`/api/rooms/${roomId}/qr-codes`),
  createQrCode: (roomId: number) => apiRequest<QrCredential>(`/api/rooms/${roomId}/qr-codes`, { method: "POST" }),
  regenerateQrCode: (roomId: number, credentialId: number) =>
    apiRequest<QrCredential>(`/api/rooms/${roomId}/qr-codes/${credentialId}/regenerate`, { method: "POST" }),
  revokeQrCode: (roomId: number, credentialId: number) =>
    apiRequest<void>(`/api/rooms/${roomId}/qr-codes/${credentialId}`, { method: "DELETE" }),
};
