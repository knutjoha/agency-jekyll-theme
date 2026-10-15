"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { RouteSkeleton } from "@/components/shell/RouteSkeleton";
import { appPathFromHref, isAppPath, type AppPath } from "@/components/shell/navPaths";

const FADE_MS = 160;
const MIN_MS = 180;
const MIN_REDUCE_MS = 80;

type RouteLoadingApi = {
  visible: boolean;
  route: AppPath;
  show: (path: AppPath) => void;
  markPending: (path: AppPath, pending: boolean) => void;
};

const RouteLoadingContext = createContext<RouteLoadingApi | null>(null);

function prefersReduce(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function currentAppPath(): AppPath | null {
  return appPathFromHref(window.location.href, window.location.origin);
}

export function RouteLoadingRoot({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [route, setRoute] = useState<AppPath>(isAppPath(pathname) ? pathname : "/");
  const visibleRef = useRef(false);
  const shownAt = useRef(0);
  const targetRef = useRef<AppPath | null>(null);
  const pendingRef = useRef(0);
  const hideTimer = useRef(0);

  const hideIfIdle = useCallback(() => {
    if (pendingRef.current > 0) return;
    if (targetRef.current && pathname !== targetRef.current) return;
    const min = prefersReduce() ? MIN_REDUCE_MS : MIN_MS;
    const wait = Math.max(0, min - (performance.now() - shownAt.current));
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (pendingRef.current > 0) return;
      if (targetRef.current && window.location.pathname !== targetRef.current) return;
      visibleRef.current = false;
      targetRef.current = null;
      setVisible(false);
    }, wait);
  }, [pathname]);

  const show = useCallback(
    (path: AppPath) => {
      // Home paints from its own cache. A full-page skeleton would hide that.
      if (path === "/") return;
      if (path === pathname && pendingRef.current === 0) return;
      window.clearTimeout(hideTimer.current);
      targetRef.current = path;
      setRoute(path);
      if (!visibleRef.current) {
        shownAt.current = performance.now();
        visibleRef.current = true;
        setVisible(true);
      }
    },
    [pathname],
  );

  const markPending = useCallback(
    (path: AppPath, pending: boolean) => {
      if (path === "/") return;
      if (pending) {
        pendingRef.current += 1;
        show(path);
        return;
      }
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      hideIfIdle();
    },
    [hideIfIdle, show],
  );

  useEffect(() => {
    hideIfIdle();
  }, [pathname, hideIfIdle]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const next = appPathFromHref(anchor.href, window.location.origin);
      const current = currentAppPath();
      if (!next || !current || next === current) return;
      show(next);
    };

    const onPop = () => {
      const next = currentAppPath();
      const current = isAppPath(pathname) ? pathname : null;
      if (!next || !current || next === current) return;
      show(next);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.clearTimeout(hideTimer.current);
    };
  }, [pathname, show]);

  const api = useMemo(
    () => ({ visible, route, show, markPending }),
    [visible, route, show, markPending],
  );

  return <RouteLoadingContext.Provider value={api}>{children}</RouteLoadingContext.Provider>;
}

export function NavPendingBeacon({ href }: { href: string }) {
  const { pending } = useLinkStatus();
  const api = useContext(RouteLoadingContext);
  const path = appPathFromHref(href);

  useEffect(() => {
    if (!api || !path || !pending) return;
    api.markPending(path, true);
    return () => api.markPending(path, false);
  }, [api, path, pending]);

  return null;
}

export function RouteLoadingOverlay() {
  const api = useContext(RouteLoadingContext);
  if (!api) return null;
  const { visible, route } = api;

  return (
    <>
      <div
        className="route-loading"
        data-region="route-loading"
        data-route={route}
        data-visible={visible ? "true" : "false"}
        aria-hidden="true"
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        <RouteSkeleton route={route} />
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {visible ? "Laster siden" : ""}
      </div>
    </>
  );
}
