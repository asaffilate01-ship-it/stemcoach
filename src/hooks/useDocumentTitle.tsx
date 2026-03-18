import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | STEMCoach` : "STEMCoach — Virtual Tuition Centre";
    return () => { document.title = prev; };
  }, [title]);
}
