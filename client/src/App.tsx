import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
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

// High-Intent SEO Landing Pages
import MakeFriendsOnline from "./pages/landing/MakeFriendsOnline";
import TalkToSomeoneOnline from "./pages/landing/TalkToSomeoneOnline";
import ChatWithStrangers from "./pages/landing/ChatWithStrangers";
import RandomVideoChat from "./pages/landing/RandomVideoChat";
import AnonymousTextChat from "./pages/landing/AnonymousTextChat";

// SEO Blog Hub & Articles
import BlogIndex from "./pages/blog/BlogIndex";
import BlogPost from "./pages/blog/BlogPost";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      {/* SEO Discovery Landing Pages */}
      <Route path="/make-friends-online" component={MakeFriendsOnline} />
      <Route path="/talk-to-someone-online" component={TalkToSomeoneOnline} />
      <Route path="/chat-with-strangers" component={ChatWithStrangers} />
      <Route path="/random-video-chat" component={RandomVideoChat} />
      <Route path="/anonymous-text-chat" component={AnonymousTextChat} />

      {/* SEO Blog & Guides */}
      <Route path="/blog" component={BlogIndex} />
      <Route path="/blog/:slug" component={BlogPost} />

      {/* Legal & Compliance Pages */}
      <Route path="/terms" component={TermsOfService} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/community-guidelines" component={CommunityGuidelines} />
      <Route path="/guidelines">
        {() => <Redirect to="/community-guidelines" replace />}
      </Route>
      <Route path="/safety" component={SafetyCenter} />
      <Route path="/data-rights" component={DataRights} />
      <Route path="/grievance" component={GrievanceRedressal} />
      <Route path="/report-abuse">
        {() => <Redirect to="/grievance" replace />}
      </Route>
      <Route path="/cookies" component={CookieDisclosure} />

      {/* Error Routes */}
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
