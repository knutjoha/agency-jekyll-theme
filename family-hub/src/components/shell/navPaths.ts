export const APP_PATHS = ["/", "/kalender", "/todo", "/middag", "/verdi"] as const;

export type AppPath = (typeof APP_PATHS)[number];

export function isAppPath(pathname: string): pathname is AppPath {
  return (APP_PATHS as readonly string[]).includes(pathname);
}

export function appPathFromHref(href: string, origin = "http://family.local"): AppPath | null {
  try {
    const url = new URL(href, origin);
    return isAppPath(url.pathname) ? url.pathname : null;
  } catch {
    return null;
  }
}
