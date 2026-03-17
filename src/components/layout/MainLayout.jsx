import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { UserProgress } from "@/components/UserProgress";
import { NotificationManager } from "@/components/NotificationManager";
import { UsernamePrompt } from "@/components/UsernamePrompt";
import { ProductTour } from "@/components/ProductTour";
import { ChestRewardModal } from "@/components/ChestRewardModal";
import { useLeagueNotifications } from "@/hooks/useLeagueNotifications";
import { useGlobalAchievementMonitor } from "@/hooks/useAchievements";
export function MainLayout() {
    // Subscribe to league change notifications
    useLeagueNotifications();
    // Monitor achievements for immediate real-time notifications across the entire app
    useGlobalAchievementMonitor();
    return (<div className="min-h-screen bg-background">
      <NotificationManager />
      <UsernamePrompt />
      <ProductTour />
      <ChestRewardModal />
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
            <div className="sticky top-6 space-y-6" data-tour="user-progress">
              <UserProgress />
            </div>
          </div>
        </div>
      </main>
    </div>);
}
