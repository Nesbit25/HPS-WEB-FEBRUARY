
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { initAnalytics } from "./utils/initAnalytics";

  // Inject GA4 + GTM as early as possible (no-ops until IDs are configured).
  initAnalytics();

  createRoot(document.getElementById("root")!).render(<App />);
