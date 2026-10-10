import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';

import { MenuPage } from './pages/customer/Menu';
import { CartPage } from './pages/customer/Cart';
import { TrackingPage } from './pages/customer/Tracking';

import { StaffRoute } from './components/StaffRoute';
import { StaffLoginPage } from './pages/staff/Login';
import { StaffOrdersPage } from './pages/staff/Orders';
import { StaffMenuPage } from './pages/staff/Menu';
import { AnalyticsPage } from './pages/staff/Analytics';
import { AIPage } from './pages/staff/AI';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders/:token" element={<TrackingPage />} />

          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/staff/orders" element={<StaffRoute><StaffOrdersPage /></StaffRoute>} />
          <Route path="/staff/menu" element={<StaffRoute><StaffMenuPage /></StaffRoute>} />
          <Route path="/staff/analytics" element={<StaffRoute><AnalyticsPage /></StaffRoute>} />
          <Route path="/staff/ai" element={<StaffRoute><AIPage /></StaffRoute>} />

          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
