import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Learn from "./pages/Learn";
import Leaderboard from "./pages/Leaderboard";
import Quests from "./pages/Quests";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import Lesson from "./pages/Lesson";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Marketing */}
            <Route path="/" element={<Landing />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Main App with Sidebar */}
            <Route element={<MainLayout />}>
              <Route path="/learn" element={<Learn />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/quests" element={<Quests />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Lesson (Full screen, no sidebar) */}
            <Route path="/lesson/:lessonId" element={<Lesson />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
