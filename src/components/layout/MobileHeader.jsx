import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Home, Trophy, Target, ShoppingBag, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProgress";
import { HeartTimerPopover } from "@/components/HeartTimerPopover";
import { StreakPopover } from "@/components/StreakPopover";
import { MobileMoreMenu } from "./MobileMoreMenu";
import { useNavigate } from "react-router-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
const navItems = [
    { icon: Home, label: "Learn", path: "/learn" },
    { icon: Trophy, label: "Ranks", path: "/leaderboard" },
    { icon: Target, label: "Quests", path: "/quests" },
    { icon: ShoppingBag, label: "Shop", path: "/shop" }
];
/** Routes that live behind the "More" menu — used to mark that tab active. */
const MORE_ROUTES = [
    "/languages", "/social", "/referral", "/achievements",
    "/practice", "/league-history", "/settings",
];
/** Detect iOS / iPadOS so the liquid-glass behavior only runs there. */
function useIsIOS() {
    return useMemo(() => {
        if (typeof navigator === "undefined" || typeof document === "undefined")
            return false;
        const ua = navigator.userAgent || navigator.vendor || "";
        const iOS = /iPad|iPhone|iPod/.test(ua);
        // iPadOS 13+ reports as Mac but is touch-enabled
        const iPadOS = ua.includes("Mac") && "ontouchend" in document;
        return iOS || iPadOS;
    }, []);
}
export function MobileHeader() {
    const location = useLocation();
    const navigate = useNavigate();
    const { data: profile } = useUserProfile();
    const hearts = profile?.hearts ?? 5;
    const streak = profile?.streak_count ?? 0;
    const gems = profile?.gems ?? 0;
    const isIOS = useIsIOS();

    // ----- Liquid-glass draggable indicator state (iOS only) -----
    const listRef = useRef(null);
    const itemRefs = useRef([]);
    const [rects, setRects] = useState([]); // [{ left, width }] per tab, relative to list
    const [drag, setDrag] = useState(null); // { left } while dragging, else null
    const dragInfo = useRef(null);

    // 4 nav routes + the "More" button = 5 draggable slots
    const activeIndex = useMemo(() => {
        const i = navItems.findIndex((it) => it.path === location.pathname);
        if (i >= 0) return i;
        if (MORE_ROUTES.includes(location.pathname)) return navItems.length;
        return -1;
    }, [location.pathname]);

    /** Measure each tab's position relative to the nav list. */
    const measure = useCallback(() => {
        const list = listRef.current;
        if (!list) return;
        const base = list.getBoundingClientRect();
        const next = itemRefs.current.map((el) => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { left: r.left - base.left, width: r.width };
        });
        setRects(next);
    }, []);

    useLayoutEffect(() => {
        if (!isIOS) return;
        measure();
        const onResize = () => measure();
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
        };
    }, [isIOS, measure]);

    // Re-measure when route changes (label widths can shift active styling)
    useEffect(() => {
        if (isIOS) measure();
    }, [isIOS, location.pathname, measure]);

    /** Trigger the active nav slot at a given index. */
    const goToIndex = useCallback((index) => {
        if (index < 0) return;
        if (index < navItems.length) {
            navigate(navItems[index].path);
        } else {
            // "More" slot — open the bottom sheet by clicking its trigger
            const moreBtn = listRef.current?.querySelector("[data-more-trigger] button");
            moreBtn?.click();
        }
    }, [navigate]);

    const onPointerDown = useCallback((e) => {
        if (!isIOS || activeIndex < 0 || !rects[activeIndex]) return;
        const list = listRef.current;
        if (!list) return;
        list.setPointerCapture?.(e.pointerId);
        dragInfo.current = {
            startX: e.clientX,
            baseLeft: rects[activeIndex].left,
            width: rects[activeIndex].width,
            moved: false,
        };
        setDrag({ left: rects[activeIndex].left });
    }, [isIOS, activeIndex, rects]);

    const onPointerMove = useCallback((e) => {
        const info = dragInfo.current;
        if (!info) return;
        const list = listRef.current;
        if (!list) return;
        const delta = e.clientX - info.startX;
        if (Math.abs(delta) > 3) info.moved = true;
        const maxLeft = list.clientWidth - info.width;
        const left = Math.max(0, Math.min(maxLeft, info.baseLeft + delta));
        setDrag({ left });
    }, []);

    const onPointerUp = useCallback((e) => {
        const info = dragInfo.current;
        if (!info) return;
        dragInfo.current = null;
        listRef.current?.releasePointerCapture?.(e.pointerId);
        // Snap to the nearest tab center
        const current = (drag?.left ?? info.baseLeft) + info.width / 2;
        let nearest = activeIndex;
        let best = Infinity;
        rects.forEach((r, i) => {
            if (!r) return;
            const center = r.left + r.width / 2;
            const dist = Math.abs(center - current);
            if (dist < best) { best = dist; nearest = i; }
        });
        setDrag(null);
        if (info.moved && nearest !== activeIndex) goToIndex(nearest);
    }, [drag, rects, activeIndex, goToIndex]);

    const showGlass = isIOS && activeIndex >= 0 && rects[activeIndex];
    const pill = showGlass
        ? (drag ?? { left: rects[activeIndex].left })
        : null;
    const pillWidth = showGlass ? rects[activeIndex].width : 0;
    return (<>
      {/* Top Header - Stats */}
      <header className="fixed top-0 left-0 right-0 z-50 lg:hidden bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/profile" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ?
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover"/> :
            <span className="text-xs font-bold text-primary">
                  {profile?.display_name?.[0] || "U"}
                </span>}
            </div>
          </Link>

          <div className="flex items-center gap-4" data-tour="mobile-stats">
            <StreakPopover streak={streak}/>
            <div className="flex items-center gap-1 text-golden font-bold text-sm">
              <Gem className="w-5 h-5 border-inherit text-sky-500"/>
              <span className="text-secondary">{gems.toLocaleString()}</span>
            </div>
            <HeartTimerPopover hearts={hearts} compact/>
          </div>
        </div>
      </header>

      {/* Bottom Navigation - Rendered in portal so it stays fixed to viewport (not affected by scroll/transform) */}
      {typeof document !== "undefined" &&
            createPortal(<nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} aria-label="Bottom navigation">
          
            <div
              ref={listRef}
              className="relative flex items-center justify-around h-16 touch-pan-y"
              onPointerDown={isIOS ? onPointerDown : undefined}
              onPointerMove={isIOS ? onPointerMove : undefined}
              onPointerUp={isIOS ? onPointerUp : undefined}
              onPointerCancel={isIOS ? onPointerUp : undefined}
            >
              {/* Liquid-glass active indicator (iOS only) */}
              {pill && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "ios-glass-tab pointer-events-none absolute top-1.5 bottom-1.5 z-0",
                    drag && "is-dragging"
                  )}
                  style={{ left: `${pill.left}px`, width: `${pillWidth}px` }}
                />
              )}
              {navItems.map((item, idx) => {
                    const isActive = location.pathname === item.path;
                    return (<Link key={item.path} to={item.path} ref={(el) => (itemRefs.current[idx] = el)} data-tour={`mobile-${item.label.toLowerCase()}`} className={cn("relative z-10 flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors", isActive ?
                            "text-primary" :
                            "text-muted-foreground hover:text-foreground")}>
                  
                    <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")}/>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </Link>);
                })}
              <div data-tour="mobile-more" data-more-trigger className="relative z-10" ref={(el) => (itemRefs.current[navItems.length] = el)}>
                <MobileMoreMenu />
              </div>
            </div>
          </nav>, document.body)}
    </>);
}
