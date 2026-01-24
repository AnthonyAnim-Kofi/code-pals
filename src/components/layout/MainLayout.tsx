import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { UserProgress } from "@/components/UserProgress";
import { NotificationManager } from "@/components/NotificationManager";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <NotificationManager />
      <Sidebar />
      <MobileHeader />
      
      <main className="lg:pl-[256px] pt-14 pb-20 lg:pt-0 lg:pb-0">
        <div className="max-w-[1200px] mx-auto flex gap-8 p-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
          
          {/* Right Sidebar - Desktop Only */}
          <div className="hidden xl:block w-[300px] shrink-0">
            <div className="sticky top-6 space-y-6">
              <UserProgress />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
