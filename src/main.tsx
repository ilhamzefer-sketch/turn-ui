import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import "./styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Tətbiqin başladılması üçün root elementi tapılmadı.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
