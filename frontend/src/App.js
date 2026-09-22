import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/context/LanguageContext";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import AdminPage from "@/pages/AdminPage";
import AuthCallback from "@/pages/AuthCallback";
import PaymentResult from "@/pages/PaymentResult";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/payment/success" element={<PaymentResult type="success" />} />
      <Route path="/payment/cancel" element={<PaymentResult type="cancel" />} />
    </Routes>
  );
}

function App() {
  return (
    <SiteConfigProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </LanguageProvider>
    </SiteConfigProvider>
  );
}

export default App;
