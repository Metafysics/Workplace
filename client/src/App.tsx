import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, RequireAuth } from "@/hooks/use-auth";
import { LanguageProvider } from "@/lib/i18n";
import LandingPage from "@/pages/landing";
import CompanyRegistration from "@/pages/company-registration";
import HRDashboard from "@/pages/hr-dashboard";
import EmployeeTimeline from "@/pages/employee-timeline";
import EmployeeProfile from "@/pages/employee-profile";
import MediaLibrary from "@/pages/media-library";
import NotFound from "@/pages/not-found";
import ReferralPortal from "@/pages/referral-portal";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Login from "@/pages/login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/company-registration" component={CompanyRegistration} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/employee/:token" component={EmployeeTimeline} />
      <Route path="/profile/:nfcToken" component={EmployeeProfile} />
      <Route path="/referral/:employeeId">
        {(params) => (
          <ReferralPortal 
            employeeId={parseInt(params.employeeId)} 
            companyId={1} 
            onBack={() => window.history.back()}
          />
        )}
      </Route>
      <Route path="/dashboard">
        <RequireAuth>
          <HRDashboard />
        </RequireAuth>
      </Route>
      <Route path="/hr-dashboard">
        <RequireAuth>
          <HRDashboard />
        </RequireAuth>
      </Route>
      <Route path="/media-library">
        <RequireAuth>
          <MediaLibrary />
        </RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
