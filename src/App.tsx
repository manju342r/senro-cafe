import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CartProvider } from '@/contexts/CartContext'
import { CustomerShell } from '@/components/shared/CustomerShell'
import { StaffShell } from '@/components/shared/StaffShell'
import { HomePage } from '@/pages/customer/Home'
import { MenuPage } from '@/pages/customer/Menu'
import { CartPage } from '@/pages/customer/Cart'
import { OrderTrackingPage } from '@/pages/customer/OrderTracking'
import { AboutPage } from '@/pages/customer/About'
import { EventsPage } from '@/pages/customer/Events'
import { VisitPage } from '@/pages/customer/Visit'
import { StaffLoginPage } from '@/pages/staff/Login'
import { StaffOrdersPage } from '@/pages/staff/Orders'
import { StaffMenuPage } from '@/pages/staff/Menu'
import { StaffAnalyticsPage } from '@/pages/staff/Analytics'
import { StaffAIPage } from '@/pages/staff/AI'
import { StaffSalesPage } from '@/pages/staff/Sales'
import { StaffCustomersPage } from '@/pages/staff/Customers'
import { StaffEventBookingsPage } from '@/pages/staff/EventBookings'

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<CustomerShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/visit" element={<VisitPage />} />
            <Route path="/orders/:trackingToken" element={<OrderTrackingPage />} />
          </Route>
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/staff" element={<StaffShell />}>
            <Route index element={<Navigate to="/staff/orders" replace />} />
            <Route path="sales" element={<StaffSalesPage />} />
            <Route path="customers" element={<StaffCustomersPage />} />
            <Route path="event-bookings" element={<StaffEventBookingsPage />} />
            <Route path="orders" element={<StaffOrdersPage />} />
            <Route path="menu" element={<StaffMenuPage />} />
            <Route path="analytics" element={<StaffAnalyticsPage />} />
            <Route path="ai" element={<StaffAIPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}
