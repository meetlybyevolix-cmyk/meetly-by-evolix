import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import TermsOfService from "./pages/legal/TermsOfService";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import CommunityGuidelines from "./pages/legal/CommunityGuidelines";
import SafetyCenter from "./pages/legal/SafetyCenter";
import DataRights from "./pages/legal/DataRights";
import GrievanceRedressal from "./pages/legal/GrievanceRedressal";
import CookieDisclosure from "./pages/legal/CookieDisclosure";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/community-guidelines" component={CommunityGuidelines} />
      <Route path="/guidelines" component={CommunityGuidelines} />
      <Route path="/safety" component={SafetyCenter} />
      <Route path="/data-rights" component={DataRights} />
      <Route path="/grievance" component={GrievanceRedressal} />
      <Route path="/report-abuse" component={GrievanceRedressal} />
      <Route path="/cookies" component={CookieDisclosure} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
export default App;
