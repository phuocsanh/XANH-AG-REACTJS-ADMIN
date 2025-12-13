import { createRoot } from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import AppProviderTanStack from "./provider/app-provider-tanstack";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PWAUpdatePrompt } from "./components/pwa/pwa-update-prompt";

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <AppProviderTanStack>
      <App />
      <ToastContainer />
      <PWAUpdatePrompt />
    </AppProviderTanStack>
  );
} else {
  console.error("Root element not found.");
}
