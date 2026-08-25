export type UserStatus =
  | "PENDING"
  | "ACTIVE"
  | "PASSWORD_RESET_REQUIRED"
  | "SUSPENDED"
  | "ANONYMIZED";

export type ReservationMode = "LIVE_QUEUE" | "PLANNED_BOOKING";

export type CurrentUser = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  status: UserStatus;
  createdAt: string;
};

export type AuthenticatedUserResponse = CurrentUser & {
  accessToken: string;
};

export type SessionInfo = {
  id: number;
  serverTime: string;
  lastActivityAt: string;
  idleExpiresAt: string;
  absoluteExpiresAt: string;
};

export type UserSession = {
  id: number;
  current: boolean;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  lastActivityAt: string;
  idleExpiresAt: string;
  absoluteExpiresAt: string;
};

export type LoginInput = {
  phone: string;
  password: string;
};

export type RegistrationInput = {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
};

export type IndividualWorkspaceInput = {
  name: string;
  timezone: string;
};

export type IndividualWorkspace = {
  id: number;
  ownerUserId: number;
  name: string;
  timezone: string;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  archivedAt: string | null;
};

export type BusinessInput = {
  name: string;
  legalName: string | null;
  description: string | null;
  taxId: string | null;
  logoUrl: string | null;
  phone: string;
  timezone: string;
  categoryId: number | null;
  customSubcategory: string | null;
};

export type Business = {
  id: number;
  primaryOwnerUserId: number;
  name: string;
  legalName: string | null;
  description: string | null;
  taxId: string | null;
  logoUrl: string | null;
  phone: string;
  timezone: string;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  archivedAt: string | null;
  category: PublicCategory | null;
  customSubcategory: string | null;
};

export type BusinessRole = "PRIMARY_OWNER" | "ADMIN" | "EMPLOYEE";

export type BusinessMembershipStatus =
  | "PENDING_ACCEPTANCE"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "REMOVED";

export type BusinessMemberInput = {
  phone: string;
  firstName: string | null;
  lastName: string | null;
  role: Exclude<BusinessRole, "PRIMARY_OWNER">;
};

export type BusinessMember = {
  id: number;
  businessId: number;
  businessName: string;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
  role: BusinessRole;
  status: BusinessMembershipStatus;
  invitedByUserId: number;
  invitedFirstName: string;
  invitedLastName: string;
  invitedAt: string;
  acceptedAt: string | null;
};

export type BranchInput = {
  name: string;
  address: string;
  city: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  notes: string | null;
  timezone: string;
};

export type Branch = BranchInput & {
  id: number;
  businessId: number;
  effectivePhone: string;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  archivedAt: string | null;
};

export type RoomVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
export type RoomStatus = "DRAFT" | "PUBLISHED" | "INACTIVE" | "ARCHIVED";
export type LiveQueueResetPolicy = "DAILY_AT_TIME" | "EVERY_INTERVAL";

export type RoomInput = {
  name: string;
  roomNumberOrCode: string | null;
  description: string | null;
  notes: string | null;
  timezone: string;
  reservationMode: ReservationMode;
  defaultSlotDurationMinutes: number;
  visibility: RoomVisibility;
  personalPublicAddress: string | null;
  personalLatitude: number | null;
  personalLongitude: number | null;
};

export type ManagedRoom = RoomInput & {
  id: number;
  businessId: number | null;
  branchId: number | null;
  individualWorkspaceId: number | null;
  createdByUserId: number;
  appointmentBufferMinutes: number;
  bookingWindowDays: number;
  minimumAdvanceMinutes: number;
  cancellationCutoffMinutes: number;
  liveQueueResetPolicy: LiveQueueResetPolicy | null;
  liveQueueResetLocalTime: string | null;
  liveQueueResetIntervalMinutes: number | null;
  liveQueueMaxParticipants: number | null;
  liveQueueAcceptingNewEntries: boolean;
  status: RoomStatus;
  createdAt: string;
  archivedAt: string | null;
};

export type RoomAssignmentStatus = "PENDING_ACCEPTANCE" | "ACTIVE" | "REJECTED" | "REVOKED";

export type RoomAssignment = {
  id: number;
  roomId: number;
  roomName: string;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
  role: "ROOM_OWNER";
  status: RoomAssignmentStatus;
  showPhonePublicly: boolean;
  invitedByUserId: number;
  invitedAt: string;
  respondedAt: string | null;
};

export type RoomConfigurationInput = {
  defaultSlotDurationMinutes: number;
  appointmentBufferMinutes: number;
  bookingWindowDays: number;
  minimumAdvanceMinutes: number;
  cancellationCutoffMinutes: number;
  liveQueueResetPolicy: LiveQueueResetPolicy | null;
  liveQueueResetLocalTime: string | null;
  liveQueueResetIntervalMinutes: number | null;
  liveQueueMaxParticipants: number | null;
  liveQueueAcceptingNewEntries: boolean;
};

export type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type WeeklyAvailabilityRuleInput = {
  dayOfWeek: Weekday;
  startTime: string;
  endTime: string;
  active: boolean;
};

export type WeeklyAvailabilityRule = WeeklyAvailabilityRuleInput & {
  id: number;
  roomId: number;
};

export type AvailabilityExceptionType = "CLOSED" | "CUSTOM_HOURS" | "BLOCKED_INTERVAL";

export type AvailabilityExceptionInput = {
  date: string;
  type: AvailabilityExceptionType;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

export type AvailabilityException = AvailabilityExceptionInput & {
  id: number;
  roomId: number;
};

export type QrCredential = {
  id: number;
  roomId: number;
  type: "PERMANENT_ROOM";
  active: boolean;
  token: string | null;
  createdAt: string;
  revokedAt: string | null;
};

export type PublicCategory = {
  id: number;
  code: string;
  name: string;
};

export type PublicRoomLocation = {
  address: string | null;
  city: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type PublicRoomSummary = {
  id: number;
  name: string;
  description: string | null;
  reservationMode: ReservationMode;
  providerName: string;
  branchName: string | null;
  category: PublicCategory | null;
  customSubcategory: string | null;
  location: PublicRoomLocation | null;
  averageRating: number;
  ratingCount: number;
};

export type PublicRoomSearchPage = {
  items: PublicRoomSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type PublicRoomOwner = {
  displayName: string;
  phone: string | null;
};

export type PublicRoomProfile = {
  id: number;
  name: string;
  roomNumberOrCode: string | null;
  description: string | null;
  timezone: string;
  reservationMode: ReservationMode;
  defaultSlotDurationMinutes: number;
  appointmentBufferMinutes: number;
  liveQueueAcceptingNewEntries: boolean;
  providerName: string;
  providerDescription: string | null;
  providerLogoUrl: string | null;
  branchName: string | null;
  category: PublicCategory | null;
  customSubcategory: string | null;
  location: PublicRoomLocation | null;
  contactPhone: string | null;
  owners: PublicRoomOwner[];
  averageRating: number;
  ratingCount: number;
};

export type AvailableSlot = {
  startAt: string;
  endAt: string;
  timezone: string;
};

export type PublicQrResolution = {
  roomId: number;
  reservationMode: ReservationMode;
  publicPath: string;
};

export type LiveQueueEntryStatus = "WAITING" | "CURRENT" | "SKIPPED" | "COMPLETED" | "REMOVED" | "RESET";
export type LiveQueueSessionStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type LiveQueueAcceptanceOverride = "AUTO" | "FORCE_OPEN" | "FORCE_CLOSED";
export type LiveQueueEntrySource = "WEB" | "QR" | "OWNER_PHONE" | "OWNER_WALK_IN" | "OWNER_OTHER";

export type LiveQueuePublicEntry = {
  publicReference: string;
  queuePosition: number;
  status: LiveQueueEntryStatus;
};

export type LiveQueuePublic = {
  roomId: number;
  roomName: string;
  sessionId: number | null;
  status: LiveQueueSessionStatus | null;
  acceptingNewEntries: boolean;
  nextOpeningAt: string | null;
  nextResetAt: string | null;
  currentPublicReference: string | null;
  waitingCount: number;
  approximateWaitingMinutes: number;
  entries: LiveQueuePublicEntry[];
};

export type LiveQueueJoinInput = {
  displayName: string;
  phone: string;
};

export type LiveQueueJoinResponse = {
  sessionId: number;
  publicReference: string;
  queuePosition: number;
  status: LiveQueueEntryStatus;
  peopleAhead: number;
  approximateWaitingMinutes: number;
  currentPublicReference: string | null;
  acceptingNewEntries: boolean;
};

export type LiveQueueParticipantStatus = Omit<LiveQueueJoinResponse, "sessionId" | "queuePosition">;

export type LiveQueueEntry = {
  id: number;
  publicReference: string;
  queuePosition: number;
  status: LiveQueueEntryStatus;
  source: LiveQueueEntrySource;
  displayName: string;
  phone: string;
  linkedUserId: number | null;
  internalNote: string | null;
  createdByUserId: number | null;
  createdAt: string;
  completedAt: string | null;
  removedAt: string | null;
};

export type LiveQueueSession = {
  id: number;
  roomId: number;
  roomName: string;
  serviceDate: string;
  status: LiveQueueSessionStatus;
  acceptanceOverride: LiveQueueAcceptanceOverride;
  acceptingNewEntries: boolean;
  nextOpeningAt: string | null;
  nextResetAt: string | null;
  currentPublicReference: string | null;
  waitingCount: number;
  skippedCount: number;
  activeCount: number;
  openedAt: string;
  closedAt: string | null;
  entries: LiveQueueEntry[];
};

export type LiveQueueManualEntryInput = LiveQueueJoinInput & {
  source: Exclude<LiveQueueEntrySource, "WEB" | "QR">;
  internalNote: string | null;
};

export type LiveQueueEntryUpdateInput = LiveQueueJoinInput & {
  internalNote: string | null;
};

export type PlannedBookingStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type BookingCancellationReason = "CUSTOMER_CANCELLED" | "OWNER_CANCELLED" | "NO_SHOW";

export type PlannedBooking = {
  id: number;
  bookingReference: string;
  roomId: number;
  roomName: string;
  status: PlannedBookingStatus;
  participantName: string;
  participantPhone: string;
  startAt: string;
  endAt: string;
  timezone: string;
  customerNote: string | null;
  internalNote: string | null;
  source: LiveQueueEntrySource;
  cancellationReason: BookingCancellationReason | null;
  cancellationDetail: string | null;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
};

export type BookingCreateInput = {
  roomId: number;
  startAt: string;
  customerNote: string | null;
};

export type BookingManualCreateInput = {
  displayName: string;
  phone: string;
  startAt: string;
  source: Exclude<LiveQueueEntrySource, "WEB" | "QR">;
  internalNote: string | null;
};

export type LiveQueueHistoryItem = {
  entryId: number;
  roomId: number;
  roomName: string;
  publicReference: string;
  queuePosition: number;
  status: LiveQueueEntryStatus;
  source: LiveQueueEntrySource;
  createdAt: string;
  completedAt: string | null;
};

export type WorkspaceContext = {
  type: "CUSTOMER" | "INDIVIDUAL" | "BUSINESS" | "ROOM";
  contextId: number;
  name: string;
  role: string;
};

export type BusinessInvitation = {
  id: number;
  businessId: number;
  businessName: string;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
  role: "PRIMARY_OWNER" | "ADMIN" | "EMPLOYEE";
  status: "PENDING_ACCEPTANCE" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "REMOVED";
  invitedByUserId: number;
  invitedFirstName: string;
  invitedLastName: string;
  invitedAt: string;
  acceptedAt: string | null;
};

export type RoomInvitation = {
  id: number;
  roomId: number;
  roomName: string;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
  role: "ROOM_OWNER";
  status: "PENDING_ACCEPTANCE" | "ACTIVE" | "REJECTED" | "REVOKED";
  showPhonePublicly: boolean;
  invitedByUserId: number;
  invitedAt: string;
  respondedAt: string | null;
};

export type UserInvitations = {
  businessInvitations: BusinessInvitation[];
  roomInvitations: RoomInvitation[];
};

export type OwnershipDisputeInput = {
  disputedPhone: string;
  claimantName: string;
  claimantContactPhone: string;
  description: string;
};

export type OwnershipDispute = OwnershipDisputeInput & {
  id: number;
  disputedUserId: number | null;
  status: "OPEN" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "RESOLVED" | "COMPLETED";
  resolutionAction: "NO_ACTION" | "SUSPEND" | "RESET_PASSWORD" | "RESTORE_ACCESS" | null;
  resolutionNote: string | null;
  reviewedByAdmin: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type ProviderScopeType = "INDIVIDUAL_WORKSPACE" | "BUSINESS";
export type BillingPeriod = "MONTHLY" | "YEARLY";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type SubscriptionStatus = "PENDING_PAYMENT" | "ACTIVE" | "GRACE_PERIOD" | "SUSPENDED" | "CANCELLED";

export type SubscriptionPlan = {
  id: number; code: string; name: string; billingPeriod: BillingPeriod; amount: number; currency: string;
  roomLimit: number; employeeLimit: number;
};
export type ProviderSubscription = {
  id: number; scopeType: ProviderScopeType; scopeId: number; plan: SubscriptionPlan; billingPeriod: BillingPeriod;
  status: SubscriptionStatus; roomLimit: number; employeeLimit: number; startsAt: string; expiresAt: string;
  graceEndsAt: string | null; usageGraceEndsAt: string | null;
};
export type SubscriptionReceipt = {
  paymentId: number; planCode: string; billingPeriod: BillingPeriod; status: PaymentStatus; amount: number;
  currency: string; provider: string; paymentReference: string; createdAt: string; completedAt: string | null;
};
export type SubscriptionPaymentSession = {
  id: number; sessionToken: string | null; status: PaymentStatus; provider: string; paymentMode: string; amount: number; currency: string;
  paymentReference: string; checkoutUrl: string | null; subscription: ProviderSubscription | null;
  createdAt: string; completedAt: string | null;
};

export type RoomOperationalMetric = {
  roomId: number; roomName: string; branchId: number | null; branchName: string | null; liveEntries: number;
  plannedBookings: number; completed: number; cancelled: number; skipped: number; removed: number; reset: number;
  guestParticipants: number; registeredParticipants: number; estimatedCapacityMinutes: number;
};
export type OperationalAnalytics = {
  from: string; to: string; totalPeople: number; liveQueueEntries: number; plannedBookings: number; completed: number;
  cancelled: number; skipped: number; removed: number; reset: number; guestParticipants: number;
  registeredParticipants: number; averageEstimatedWaitMinutes: number; maximumEstimatedWaitMinutes: number;
  busiestDay: string | null; busiestHour: number | null; rooms: RoomOperationalMetric[];
};

export type PhoneChangeRequest = {
  id: number; userId: number; currentPhone: string; requestedPhone: string; reason: string;
  status: OwnershipDispute["status"]; resolutionNote: string | null; createdAt: string; resolvedAt: string | null;
};
export type AccountDeletionRequest = {
  id: number; userId: number; status: OwnershipDispute["status"]; resolutionNote: string | null;
  requestedAt: string; processedAt: string | null;
};
export type OwnershipTransfer = {
  id: number; businessId: number; fromOwnerUserId: number; toAdminUserId: number;
  status: "PENDING_ACCEPTANCE" | "ACCEPTED" | "REJECTED" | "CANCELLED"; createdAt: string; respondedAt: string | null;
};
export type RoomCustomerBlock = {
  id: number; roomId: number; customerUserId: number; reason: string; active: boolean;
  blockedByUserId: number; createdAt: string; revokedAt: string | null;
};
export type ServiceRating = {
  id: number; roomId: number; targetType: string; targetId: number; score: number; comment: string | null;
  createdAt: string; updatedAt: string; editableUntil: string;
};

export type AdminPlatformOverview = {
  users: number; activeUsers: number; suspendedUsers: number; businesses: number; rooms: number;
  activeSubscriptions: number; graceSubscriptions: number; suspendedSubscriptions: number;
  completedSubscriptionPayments: number; openOwnershipDisputes: number; openPhoneChanges: number; openDeletionRequests: number;
};
