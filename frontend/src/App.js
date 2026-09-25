import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";

import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import FacilityDetail from "@/pages/FacilityDetail";
import MapPage from "@/pages/MapPage";
import Discover from "@/pages/Discover";
import DiscoverDetail from "@/pages/DiscoverDetail";
import HowItWorks from "@/pages/HowItWorks";
import About from "@/pages/About";
import RequestWizard from "@/pages/RequestWizard";
import RequestTrack from "@/pages/RequestTrack";
import Compare from "@/pages/Compare";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminFacilities from "@/pages/admin/AdminFacilities";
import AdminRequests from "@/pages/admin/AdminRequests";
import AdminContent from "@/pages/admin/AdminContent";
import AdminSchedule from "@/pages/admin/AdminSchedule";
import AdminAvailability from "@/pages/admin/AdminAvailability";
import AdminUsers from "@/pages/admin/AdminUsers";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/facility/:slug" element={<FacilityDetail />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/discover/:slug" element={<DiscoverDetail />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/request" element={<RequestWizard />} />
            <Route path="/track" element={<RequestTrack />} />
            <Route path="/compare" element={<Compare />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="facilities" element={<AdminFacilities />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="schedule" element={<AdminSchedule />} />
            <Route path="availability" element={<AdminAvailability />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
