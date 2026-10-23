import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ActiveWellProvider } from "./state/ActiveWellContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ActiveWellProvider><App /></ActiveWellProvider>
  </StrictMode>
);
