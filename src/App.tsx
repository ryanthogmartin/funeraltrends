import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import Landing from "./pages/Landing";
import VideoIdeas from "./pages/VideoIdeas";
import SavedIdeas from "./pages/SavedIdeas";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import VoiceProfile from "./pages/VoiceProfile";
import NotFound from "./pages/NotFound";
import SiteLayout from "./components/SiteLayout";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/video-ideas" element={<SiteLayout><VideoIdeas /></SiteLayout>} />
            <Route path="/saved" element={<SiteLayout><SavedIdeas /></SiteLayout>} />
            <Route path="/auth" element={<SiteLayout><Auth /></SiteLayout>} />
            <Route path="/voice-profile" element={<SiteLayout><VoiceProfile /></SiteLayout>} />
            <Route path="/reset-password" element={<SiteLayout><ResetPassword /></SiteLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
