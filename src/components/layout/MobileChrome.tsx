import { ReactNode } from "react";

/**
 * Mobile-only visual shell.
 * Desktop/tablet remains unchanged via responsive classes.
 */
export function MobileChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:min-h-0 lg:bg-transparent">
      {/* Background (mobile only) */}
      <div className="mobile-attendance-bg lg:hidden" />

      {/* Page surface (mobile only) */}
      <div className="mobile-attendance-surface lg:contents">{children}</div>
    </div>
  );
}

