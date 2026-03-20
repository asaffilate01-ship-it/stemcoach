import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./hooks/useTheme";
import App from "./App.tsx";
import "./i18n";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
