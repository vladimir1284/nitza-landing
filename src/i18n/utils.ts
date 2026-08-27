import { ui, defaultLang, type languages } from "./ui";

export type Lang = keyof typeof languages;

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split("/");
  if (maybeLang in ui) return maybeLang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

export function getLocalizedPath(lang: Lang, path: string): string {
  const cleanPath = path.replace(/^\//, "");
  if (lang === defaultLang) return `/${cleanPath}`;
  return `/${lang}/${cleanPath}`;
}

export function getCategoryLabel(
  lang: Lang,
  categorySlug: string,
  fallback: string,
): string {
  const key =
    `blog.category.${categorySlug}` as keyof (typeof ui)[typeof defaultLang];
  return ui[lang][key] ?? fallback;
}
