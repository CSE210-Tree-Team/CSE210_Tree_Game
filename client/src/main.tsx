import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { Auth0ProviderWithConfig } from "./auth/auth0-provider.tsx";

import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0ProviderWithConfig>
      <App />
    </Auth0ProviderWithConfig>
  </StrictMode>
);
