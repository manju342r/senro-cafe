import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { CartProvider } from './contexts/CartContext';

import AuthScreen from './pages/AuthScreen';
import { OnboardingStep1, OnboardingStep2, OnboardingStep3 } from './pages/Onboarding';
import DashboardLayout from './layouts/DashboardLayout';

import { MenuPage } from './pages/customer/Menu';
import { CartPage } from './pages/customer/Cart';
import { OrderTrackingPage } from './pages/customer/OrderTracking';

import { StaffRoute } from './components/StaffRoute';
import { StaffLoginPage } from './pages/staff/Login';
import { StaffOrdersPage } from './pages/staff/Orders';
import { StaffMenuPage } from './pages/staff/Menu';
import { AnalyticsPage } from './pages/staff/Analytics';
import { AIPage } from './pages/staff/AI';

import { Overview } from './components/Overview';
import { CompareHub } from './components/CompareHub';
import { BattlecardsList } from './components/BattlecardsList';
import { LiveSignals } from './components/LiveSignals';
import { SettingsUI } from './components/SettingsUI';
import { Profile } from './components/Profile';
import { ScheduledReports } from './components/ScheduledReports';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Terms } from './components/Terms';

function App() {
  React.useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    }
  }, []);

  return (
    <DataProvider>
      <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* CaféOS customer app */}
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders/:token" element={<OrderTrackingPage />} />

          {/* CaféOS staff dashboard (role-guarded) */}
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/staff/orders" element={<StaffRoute><StaffOrdersPage /></StaffRoute>} />
          <Route path="/staff/menu" element={<StaffRoute><StaffMenuPage /></StaffRoute>} />
          <Route path="/staff/analytics" element={<StaffRoute><AnalyticsPage /></StaffRoute>} />
          <Route path="/staff/ai" element={<StaffRoute><AIPage /></StaffRoute>} />

          <Route path="/login" element={<AuthScreen isLogin={true} />} />
          <Route path="/signup" element={<AuthScreen isLogin={false} />} />
          
          <Route path="/onboarding/step-1" element={<OnboardingStep1 />} />
          <Route path="/onboarding/step-2" element={<OnboardingStep2 />} />
          <Route path="/onboarding/step-3" element={<OnboardingStep3 />} />
          
          <Route path="/dashboard" element={<DashboardLayout><Overview /></DashboardLayout>} />
          <Route path="/dashboard/compare" element={<DashboardLayout><CompareHub /></DashboardLayout>} />
          <Route path="/dashboard/live-signals" element={<DashboardLayout><LiveSignals /></DashboardLayout>} />
          <Route path="/dashboard/battlecards" element={<DashboardLayout><BattlecardsList /></DashboardLayout>} />
          <Route path="/dashboard/settings" element={<DashboardLayout><SettingsUI /></DashboardLayout>} />
          <Route path="/dashboard/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
          <Route path="/dashboard/reports" element={<DashboardLayout><ScheduledReports /></DashboardLayout>} />
          <Route path="/dashboard/privacy" element={<DashboardLayout><PrivacyPolicy /></DashboardLayout>} />
          <Route path="/dashboard/terms" element={<DashboardLayout><Terms /></DashboardLayout>} />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </CartProvider>
    </DataProvider>
  );
}

export default App;
