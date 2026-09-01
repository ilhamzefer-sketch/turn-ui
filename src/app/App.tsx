import { useLayoutEffect } from "react";
import { RouterProvider } from "react-router-dom";

import { AppProviders } from "./AppProviders";
import { router } from "./router";

export function App() {
  useLayoutEffect(() => {
    document.documentElement.dataset.appReady = "true";
    return () => {
      delete document.documentElement.dataset.appReady;
    };
  }, []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
