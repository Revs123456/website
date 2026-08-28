import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AutoRefresh from '@/components/AutoRefresh';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import MaintenancePage from '@/components/MaintenancePage';
import Chatbot from '@/components/ChatBot';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import ProGateModal from '@/components/ProGateModal';
import PWARegistrar from '@/components/PWARegistrar';
import PushOptInBanner from '@/components/PushOptInBanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { UserProvider } from '@/contexts/UserContext';
import { getPublicSettings } from '@/lib/settings';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();

  if (settings.maintenance_mode === 'true') {
    return (
      <MaintenancePage
        title={settings.maintenance_title || "We'll be back soon"}
        message={settings.maintenance_message || "We're performing maintenance. Check back shortly."}
      />
    );
  }

  return (
    <SettingsProvider settings={settings}>
      <UserProvider>
        <ErrorBoundary>
          <AnalyticsTracker />
          <AnnouncementBanner />
          <AutoRefresh />
          <Navbar />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer settings={settings} />
          <Chatbot />
          <ProGateModal />
          <PWARegistrar />
          <PushOptInBanner />
        </ErrorBoundary>
      </UserProvider>
    </SettingsProvider>
  );
}
