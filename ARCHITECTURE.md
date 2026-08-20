# E-Növbə Frontend Architecture

## Runtime

- React 19 and TypeScript
- Vite for development and production bundling
- React Router for route boundaries
- TanStack Query for server state
- React Hook Form and Zod for accessible, contract-aligned forms
- Vitest and Testing Library for unit and component tests
- Playwright for representative browser journeys

## Source boundaries

- `src/app`: routing, layouts, providers, and page composition
- `src/features`: product workflows grouped by feature
- `src/shared/api`: typed backend contracts and HTTP/session behavior
- `src/shared/auth`: authentication state and protected-route behavior
- `src/shared/ui`: reusable accessible UI primitives
- `src/styles`: centralized tokens, global rules, components, and page compositions
- `src/test`: shared test setup
- `e2e`: browser-level acceptance checks

Feature code may depend on `shared`, while `shared` must not import feature or route code. Pages coordinate features but must not own reusable API or domain logic.

## Session model

- Access tokens live only in JavaScript memory.
- Refresh tokens remain in the backend-issued HTTP-only cookie.
- The client obtains a CSRF token from `/api/auth/csrf` before state-changing requests.
- Protected routes restore an access token through `/api/auth/refresh`, then rehydrate the user through `/api/users/me`.
- Full authentication tokens are never stored in local storage or session storage.

## Design model

The marketing surface uses an original editorial hierarchy with restrained components, bounded fluid shells, one dominant idea per section, and semantic HTML. Application and dashboard surfaces prioritize task efficiency instead of cinematic storytelling.

All visual values are centralized in `src/styles/tokens.css`. The implementation targets WCAG 2.2 AA, useful 44-pixel touch targets, visible keyboard focus, complete reduced-motion behavior, and Core Web Vitals targets of LCP ≤ 2.5 s, INP ≤ 200 ms, and CLS ≤ 0.1.

## Public discovery

- `/` introduces the two supported reservation modes and starts a public room search.
- `/rooms` keeps search and filter state in the URL so results can be shared and revisited.
- `/rooms/:roomId` is the composite public profile for the provider, branch, room, owners, services, location, rating, mode, and current same-day availability.
- Public pages consume only `/api/public/**` contracts and never require authentication.
- Missing backend data is omitted or described plainly; the frontend does not manufacture reviews, prices, opening hours, logos, or provider claims.
- Business and branch information currently appears inside the room profile because the public backend contract exposes it as one composite resource. Separate business or branch routes will be introduced only when corresponding public endpoints exist.

## Authentication and onboarding

- `/login` uses phone and password only. A `409` response for pending or reset-required accounts directs the person to ordinary registration instead of inventing an activation-code flow.
- `/register` creates a new account, completes the same pending account, or sets a new password after Platform Support marks the existing account `PASSWORD_RESET_REQUIRED`.
- `/account-recovery` creates a manual ownership/recovery request. The interface does not promise an automatic deadline or imply SMS/email verification.
- `/onboarding` lets an authenticated person continue as a customer, create their one Individual Specialist workspace, create a Business, and explicitly accept or reject pending business and room invitations.
- Workspace selection remains in memory. Access authorization always comes from the backend; changing the active workspace never grants permissions by itself.
- New account, workspace, and business configuration is described as free. Payment is not requested until later publish or operational gates require it.

## Management workspace (Step 4)

- `/app/businesses/:businessId` is the business setup overview and profile editor.
- `/app/businesses/:businessId/branches` manages the required branch layer; rooms are created inside a branch.
- `/app/businesses/:businessId/rooms` creates and opens business rooms, while `/app/businesses/:businessId/team` manages phone-based business membership and roles.
- `/app/individual/:workspaceId` creates or opens the account holder's single individual room without introducing a fake branch.
- `/app/rooms/:roomId` is the room workspace for room details, reservation mode, owner access, weekly availability, exceptions, services, and permanent QR codes.
- `/q/:token` resolves a permanent QR through the public backend contract and forwards the visitor to the room profile. Revoked and invalid tokens produce an explicit public error state.
- Business `PRIMARY_OWNER` and `ADMIN` roles manage room-owner assignments. Active room owners manage the room itself and their own public phone visibility. Frontend checks improve the interface, but the backend remains the authorization source of truth.
- Room publication readiness is shown as a short operational checklist. Backend publication and subscription rules remain authoritative and their errors are surfaced without inventing client-side business rules.

## Queue and booking operations (Step 5)

- `/rooms/:roomId/live` is the public live-queue join surface. A permanent QR resolves here with its token preserved so passwordless entries use the QR-specific backend contract.
- `/queue/:publicReference` polls only the participant-safe status contract. It never exposes guest identity or contact details.
- `/rooms/:roomId/book` is protected by the ordinary phone-account session. A planned booking is confirmed immediately after a still-free slot is accepted by the backend.
- `/app/bookings` combines the customer's planned bookings and linked live-queue history without storing private history in browser storage.
- `/app/rooms/:roomId/today` reads the room mode and opens either the live operator or the planned booking operator. The modes are intentionally not mixed in one operational view.
- Live queue ordering is changed only through explicit domain actions: skip, restore, send to end, remove, call next and complete current. Drag-and-drop ordering is not implemented.
- Manual live and planned entries require a name, phone and owner source. They do not create accounts.
- Operator cancellation and rescheduling require an explicit participant-informed acknowledgement. Backend conflict and cutoff decisions remain authoritative.
- Public participant pages use periodic TanStack Query refetching. No socket protocol is implied by the current backend contract.

## Subscription, support and reporting (Step 6)

- Business and room analytics use their own authorized backend scopes. Date ranges remain in page state and are validated by the backend's 366-day ceiling.
- Excel is downloaded directly from the authenticated backend endpoint. The browser does not recreate or reinterpret the workbook.
- Business and individual subscriptions share one plan component but preserve the backend `ProviderScopeType`. Checkout redirects only to the backend-supplied bank URL; card details are not requested by E-Növbə Web.
- `/app/support` creates audited phone-change and account-deletion requests. It does not imply automatic verification or a guaranteed review time.
- Business ownership transfers require an active administrator and are completed only after the invited administrator accepts.
- Room customer blocks apply only to that room. Written rating comments are visible only in authorized room management; public pages keep the aggregate score and count.
- `/platform/login` and `/platform` form a deliberately separate Platform Admin surface. Admin authorization is backend-controlled and never inferred from an ordinary workspace.

## Local development

1. Start the backend on `http://localhost:8080`.
2. Copy `.env.example` to `.env.local` only when the defaults need to change.
3. Run `npm install`.
4. Run `npm run dev`.

The local frontend is served at `http://127.0.0.1:5275` with a strict port so the backend CORS and payment callback configuration remain deterministic.

Vite proxies `/api` to the backend during local development so cookies and CSRF behavior use the same browser origin.
