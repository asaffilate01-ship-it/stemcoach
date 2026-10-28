import { useTranslation } from "react-i18next";

export function SkipToContent() {
  const { t } = useTranslation();
  return (
    <a
      href="#app-content"
      onClick={(event) => {
        const target = document.getElementById("main-content") ?? document.querySelector("main") ?? document.getElementById("app-content");
        if (!target) return;
        event.preventDefault();
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus();
        target.scrollIntoView({ block: "start" });
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
    >
      {t("nav.skipToContent")}
    </a>
  );
}
