import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { formDevtoolsPlugin } from "@tanstack/react-form-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <TanStackDevtools plugins={[formDevtoolsPlugin()]} />
  </StrictMode>,
);
