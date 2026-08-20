import { useEffect } from "react";

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionElement = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = descriptionElement?.content;

    document.title = title;
    if (descriptionElement) descriptionElement.content = description;

    return () => {
      document.title = previousTitle;
      if (descriptionElement && previousDescription !== undefined) descriptionElement.content = previousDescription;
    };
  }, [description, title]);
}
