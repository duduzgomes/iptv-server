import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster } from "sonner";
import { App } from "./app";
import { useAuthStore } from "./stores/authStore";
import "./index.css";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      if (error?.response?.status === 401) {
        useAuthStore.getState().clear();
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    },
  }),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          style={{ width: "380" }}
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: [
                "flex items-start gap-3 w-full rounded-md px-5 py-4",
                "border border-border bg-surface shadow-lg",
                "text-sm text-text font-[var(--font-sans)]",
              ].join(" "),
              title: "text-sm font-medium text-text",
              description: "text-sm text-text-muted mt-0.5",
              icon: "[&_svg]:size-4.5 shrink-0 mt-0.5",
              success: "border-border [&_[data-icon]]:text-success",
              error: "border-error/30 [&_[data-icon]]:text-error",
              warning: "border-warning/30 [&_[data-icon]]:text-warning",
              info: "border-info/30 [&_[data-icon]]:text-info",
              closeButton: [
                "absolute top-2 right-2 rounded p-0.5",
                "text-text-muted hover:text-text transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-focus",
              ].join(" "),
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
