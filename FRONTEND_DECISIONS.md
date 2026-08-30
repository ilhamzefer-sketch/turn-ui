# Frontend Decisions

## FD-001 — Independent rebuild

**Status:** Accepted
**Date:** 2026-08-18

The E-Növbə frontend will be rebuilt from zero in `enovbe-web`.

The existing `turn-ui` directory is not a migration source. It will not be opened for analysis, reused for code, or treated as a visual reference. This prevents legacy structure, state management, styling, and UX assumptions from shaping the new product.

The new implementation may depend only on:

1. the documented E-Növbə product rules;
2. the current backend API contract;
3. newly defined frontend architecture and design standards;
4. original interaction patterns synthesized from the approved reference products.

Any future exception to this rule requires an explicit user decision recorded in this file.

## FD-002 — Composite public profiles

**Status:** Accepted
**Date:** 2026-08-18

Public discovery links to one room profile that includes its provider and branch context. Separate business and branch profile routes are deferred until the backend provides stable public resources for them. This avoids dead routes and prevents the frontend from reconstructing incomplete business data from search results.

## FD-003 — Unified onboarding and recovery

**Status:** Accepted
**Date:** 2026-08-18

Every registered person begins with the customer workspace and may add an Individual Specialist workspace, one or more Businesses, or accepted room assignments without creating another login.

Pending-account completion and support-approved password reset both use the ordinary registration form with the same normalized phone number. There is no separate activation-code, SMS, or email flow. Forgotten-password and ownership cases create a manual support request and avoid promising an automatic resolution time.

Business and room invitations remain pending after registration. The person must explicitly accept or reject each invitation before the related workspace and permissions become active.

## FD-004 — Operational management before queue execution

**Status:** Accepted
**Date:** 2026-08-20

Business management follows the product hierarchy `Business → Branch → Room`. A business room cannot be created without selecting an active branch, while an Individual Specialist manages one personal room without a fabricated branch.

The room workspace keeps operational configuration in one task-focused surface: details and mode, owners, schedule and exceptions, services, and permanent QR codes. Publication readiness is informative; the backend remains authoritative for permissions, subscription gates, active-owner requirements, schedule validity, and archival safety.

Room owners share the same room configuration and future queue state. Business `PRIMARY_OWNER` and `ADMIN` members manage owner assignments, while each active room owner controls only their own public phone visibility. Destructive actions remain explicit and preserve backend history.

## FD-005 — Separate live and planned operational journeys

**Status:** Accepted
**Date:** 2026-08-20

A room uses exactly one operational mode at a time. The shared `Today` route resolves the room first and then renders either live-queue operations or the planned-booking calendar. This prevents controls from the inactive mode appearing together and reflects the backend's mode-switch safeguards.

Passwordless public self-service exists only for live queues. Planned self-booking uses the ordinary registered phone account, while authorized operators may create manual guest entries in either mode. Public live status is keyed by an anonymous reference and never displays private participant identity.

Queue progression uses explicit audited actions instead of drag-and-drop. Planned operator cancellation and rescheduling keep the participant-contact acknowledgement adjacent to the final action because the first version has no automatic customer notification channel.

## FD-006 — Operational reporting and audited platform controls

**Status:** Accepted
**Date:** 2026-08-20

Step 6 keeps financial and operational concepts separate. Analytics describes queue and booking operations only; it does not infer revenue, profit, average receipt value, real service duration, or employee performance facts that the backend does not measure.

Excel workbooks are generated and authorized by the backend. Subscription activation uses the authenticated user's coin wallet and never introduces card fields or bank redirects into the subscription flow. Bank-card top-up remains disabled on the balance surface, while WhatsApp carries the requested coin and AZN amount for manual processing. Support, ownership transfer, customer blocking and Platform Admin resolution are explicit audited actions with nearby consequences and confirmation, rather than ordinary profile toggles.
