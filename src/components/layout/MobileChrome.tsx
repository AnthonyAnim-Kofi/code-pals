import { ReactNode } from "react";

/**
 * Mobile-only visual shell.
 * Desktop/tablet remains unchanged via responsive classes.
 */
export function MobileChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] lg:min-h-0 lg:bg-transparent">
      {/* Background (mobile only) */}
      <div className="mobile-attendance-bg lg:hidden" />

      {/* Mobile container + card surface (mobile only) */}
      <div className="mobile-attendance-surface lg:contents">
        <div className="mobile-attendance-container lg:contents">
          <div className="mobile-attendance-card lg:contents">{children}</div>
        </div>
      </div>
    </div>
  );
}

