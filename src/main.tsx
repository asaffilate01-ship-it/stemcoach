import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./hooks/useTheme";
import App from "./App.tsx";
import { purgeLegacyQuestionCaches } from "./lib/questionCache";
import "./i18n";
import "./index.css";

void purgeLegacyQuestionCaches();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
