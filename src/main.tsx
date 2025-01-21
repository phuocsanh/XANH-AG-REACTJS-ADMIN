import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import AppProviderTanStack from "./provider/app-provider-tanstack";
import { ToastContainer } from "react-toastify";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppProviderTanStack>
        <App />
        <ToastContainer />
      </AppProviderTanStack>
    </React.StrictMode>
  );
} else {
  console.error("Root element not found.");
}
