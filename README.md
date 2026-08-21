# NövbəTime Web

This directory is the only workspace for the NövbəTime frontend.

## Source of truth

- Product and business rules: `../PROJECT_DESCRIPTION.md`
- Backend contract and behavior: `../turn-api`
- UX references: Waitwhile, Qminder, Skiplino, Fresha Business, and Zocdoc

The reference products are used only to study successful interaction patterns. Their branding, layouts, copy, and visual assets must not be copied.

## Clean-room rule

The legacy `../turn-ui` project is explicitly out of scope. It must not be inspected, imported, copied, migrated, or used as a design or implementation reference.

This frontend will be designed and implemented from an empty foundation with its own:

- application architecture;
- routing and data layer;
- design tokens and component system;
- public discovery and booking experience;
- customer, room-owner, and business workspaces;
- accessibility, responsive, performance, and test standards.

## Initial quality baseline

- Mobile-first responsive behavior without reducing desktop capability
- WCAG 2.2 AA-oriented semantic interaction and visible keyboard focus
- Persistent form labels, recoverable validation, and clear loading/error/empty/success states
- Practical touch targets of at least 44 by 44 CSS pixels
- Core Web Vitals targets: LCP at or below 2.5 s, INP at or below 200 ms, CLS at or below 0.1
- Purposeful motion with a complete `prefers-reduced-motion` fallback
- Honest content and trust signals; no fabricated metrics, testimonials, or scarcity
- No unnecessary decorative sections, generic stock imagery, or component clutter

## Development status

Steps 1–6 are implemented in this directory. The application now exposes the complete first-version discovery, account, provider, queue, booking, subscription, support and reporting workflows.

Step 4 includes:

- business profile and setup readiness;
- required business branches with address and contact management;
- business rooms and the single individual-specialist room;
- phone-based business membership and administrator access;
- multiple room-owner assignments and public-phone visibility;
- room visibility, live/planned mode, duration and operating rules;
- weekly availability, date exceptions and optional service information;
- multiple permanent QR codes with copy, SVG download, regeneration and revocation;
- publication, deactivation and safe archival states.

Step 5 includes:

- public or QR-based passwordless live-queue joining with name and phone;
- one-click live joining for an authenticated account;
- private participant status with anonymous references, people ahead and estimated waiting time;
- room-owner queue opening, closing, automatic acceptance, reset and progression;
- owner-created guest entries with source, private note and editable guest details;
- skip, restore, send-to-end and remove operations without arbitrary drag reordering;
- registered-customer slot selection and immediately confirmed planned bookings;
- customer booking history, self-service cancellation and conflict-safe rescheduling;
- daily room booking view, owner-created guest bookings, completion, no-show, cancellation and rescheduling;
- explicit participant-contact acknowledgement for operator cancellation and rescheduling.

Step 6 includes:

- business-wide and authorized room operational analytics with date ranges;
- anonymous guest versus registered-participant, wait-time and room-comparison metrics;
- backend-generated Excel report downloads without reconstructing report data in the browser;
- business and individual-workspace subscription plans, current status and receipt history;
- bank-hosted checkout handoff without collecting or storing card details in this frontend;
- audited phone-change and account-deletion support requests;
- accepted-admin business ownership transfer invitations;
- room-specific customer blocks and authorized written-rating review;
- one-time customer rating creation for completed queue entries and bookings;
- a separate Platform Admin login, overview and manual support-resolution surface.

Local development URL: `http://127.0.0.1:5275`

See `ARCHITECTURE.md` for project boundaries and local development instructions.
