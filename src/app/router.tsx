import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "./layouts/AppLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { LandingPage } from "./routes/LandingPage";
import { NotFoundPage } from "./routes/NotFoundPage";
import { ProtectedRoute } from "../shared/auth/ProtectedRoute";
import { PageLoader } from "../shared/ui/PageLoader";
import { AnonymousRoute } from "../shared/auth/AnonymousRoute";

export const router = createBrowserRouter([
  {
    path: "/platform/login",
    HydrateFallback: () => <PageLoader label="Admin girişi açılır..." />,
    lazy: () => import("./routes/AdminLoginPage").then((module) => ({ Component: module.AdminLoginPage })),
  },
  {
    path: "/platform",
    HydrateFallback: () => <PageLoader label="Platform açılır..." />,
    lazy: () => import("./routes/AdminPlatformPage").then((module) => ({ Component: module.AdminPlatformPage })),
  },
  {
    element: <PublicLayout />,
    HydrateFallback: () => <PageLoader label="Səhifə açılır..." />,
    children: [
      { path: "/", element: <LandingPage /> },
      {
        path: "/rooms",
        lazy: () => import("./routes/ExplorePage").then((module) => ({ Component: module.ExplorePage })),
      },
      {
        path: "/rooms/:roomId",
        lazy: () => import("./routes/RoomProfilePage").then((module) => ({ Component: module.RoomProfilePage })),
      },
      {
        path: "/q/:token",
        lazy: () => import("./routes/QrResolvePage").then((module) => ({ Component: module.QrResolvePage })),
      },
      {
        path: "/rooms/:roomId/live",
        lazy: () => import("./routes/RoomLiveQueuePage").then((module) => ({ Component: module.RoomLiveQueuePage })),
      },
      {
        path: "/queue/:reference",
        lazy: () => import("./routes/LiveQueueStatusPage").then((module) => ({ Component: module.LiveQueueStatusPage })),
      },
      {
        element: <AnonymousRoute />,
        children: [
          {
            path: "/login",
            lazy: () => import("./routes/LoginPage").then((module) => ({ Component: module.LoginPage })),
          },
          {
            path: "/register",
            lazy: () => import("./routes/RegisterPage").then((module) => ({ Component: module.RegisterPage })),
          },
        ],
      },
      {
        path: "/account-recovery",
        lazy: () => import("./routes/AccountRecoveryPage").then((module) => ({ Component: module.AccountRecoveryPage })),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    HydrateFallback: () => <PageLoader label="Hesab açılır..." />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            path: "/rooms/:roomId/book",
            lazy: () => import("./routes/BookRoomPage").then((module) => ({ Component: module.BookRoomPage })),
          },
        ],
      },
      {
        path: "/onboarding",
        lazy: () => import("./routes/OnboardingPage").then((module) => ({ Component: module.OnboardingPage })),
      },
      {
        path: "/app",
        element: <AppLayout />,
        children: [
          {
            index: true,
            lazy: () => import("./routes/AppHomePage").then((module) => ({ Component: module.AppHomePage })),
          },
          {
            path: "bookings",
            lazy: () => import("./routes/CustomerBookingsPage").then((module) => ({ Component: module.CustomerBookingsPage })),
          },
          {
            path: "support",
            lazy: () => import("./routes/SupportPage").then((module) => ({ Component: module.SupportPage })),
          },
          {
            path: "security",
            lazy: () => import("./routes/AccountSecurityPage").then((module) => ({ Component: module.AccountSecurityPage })),
          },
          {
            path: "businesses/:businessId",
            lazy: () => import("./routes/BusinessOverviewPage").then((module) => ({ Component: module.BusinessOverviewPage })),
          },
          {
            path: "businesses/:businessId/branches",
            lazy: () => import("./routes/BusinessBranchesPage").then((module) => ({ Component: module.BusinessBranchesPage })),
          },
          {
            path: "businesses/:businessId/rooms",
            lazy: () => import("./routes/BusinessRoomsPage").then((module) => ({ Component: module.BusinessRoomsPage })),
          },
          {
            path: "businesses/:businessId/team",
            lazy: () => import("./routes/BusinessTeamPage").then((module) => ({ Component: module.BusinessTeamPage })),
          },
          {
            path: "businesses/:businessId/analytics",
            lazy: () => import("./routes/AnalyticsPage").then((module) => ({ Component: () => <module.AnalyticsPage scope="business" /> })),
          },
          {
            path: "businesses/:businessId/subscription",
            lazy: () => import("./routes/SubscriptionPage").then((module) => ({ Component: () => <module.SubscriptionPage scopeType="BUSINESS" /> })),
          },
          {
            path: "businesses/:businessId/governance",
            lazy: () => import("./routes/BusinessGovernancePage").then((module) => ({ Component: module.BusinessGovernancePage })),
          },
          {
            path: "individual/:workspaceId",
            lazy: () => import("./routes/IndividualWorkspacePage").then((module) => ({ Component: module.IndividualWorkspacePage })),
          },
          {
            path: "individual/:workspaceId/subscription",
            lazy: () => import("./routes/SubscriptionPage").then((module) => ({ Component: () => <module.SubscriptionPage scopeType="INDIVIDUAL_WORKSPACE" /> })),
          },
          {
            path: "rooms/:roomId",
            lazy: () => import("./routes/RoomEntryPage").then((module) => ({ Component: module.RoomEntryPage })),
          },
          {
            path: "rooms/:roomId/settings",
            lazy: () => import("./routes/RoomManagementPage").then((module) => ({ Component: module.RoomManagementPage })),
          },
          {
            path: "rooms/:roomId/today",
            lazy: () => import("./routes/RoomTodayPage").then((module) => ({ Component: module.RoomTodayPage })),
          },
          {
            path: "rooms/:roomId/analytics",
            lazy: () => import("./routes/AnalyticsPage").then((module) => ({ Component: () => <module.AnalyticsPage scope="room" /> })),
          },
          {
            path: "rooms/:roomId/trust",
            lazy: () => import("./routes/RoomTrustPage").then((module) => ({ Component: module.RoomTrustPage })),
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
