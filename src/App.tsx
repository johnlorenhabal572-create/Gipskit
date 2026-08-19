import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext'; // 1. Import AuthProvider
import Navbar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPages';
import ProtectedRoute from './components/ProtectedRoute';
import OrderHistory from './pages/TransactionHistory'; // Renamed
import MyBill from './pages/MyBill';
import CustomerPayment from './pages/CustomerPayment';
import CustomerOrderHistory from './pages/CustomerOrderHistory';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Contact from './pages/Contact';
import POS from './pages/POS';
import ManageMenu from './pages/ManageMenu';
import ManageInventory from './pages/ManageInventory';
import Dashboard from './pages/Dashboard';
import ReorderList from './pages/ReorderList';
import AccountManagement from './pages/AccountManagement';
import SalesReport from './pages/SalesReport';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/menu" element={<Catalog />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/my-orders" element={<CustomerOrderHistory />} />
                <Route path="/my-bill" element={<MyBill />} />
                
                {/* Protected Route: Transaction history only for logged in admin */}
                <Route path="/history" element={
                  <ProtectedRoute>
                    <OrderHistory />
                  </ProtectedRoute>
                } />

                {/* Customer Payment: for admin */}
                <Route path="/customer-payment" element={
                  <ProtectedRoute>
                    <CustomerPayment />
                  </ProtectedRoute>
                } />

                {/* POS: Point of Sale for admin */}
                <Route path="/pos" element={
                  <ProtectedRoute>
                    <POS />
                  </ProtectedRoute>
                } />

                {/* Manage Menu: ONLY admins */}
                <Route path="/manage-menu" element={
                  <ProtectedRoute requireAdmin={true}>
                    <ManageMenu />
                  </ProtectedRoute>
                } />

                {/* Manage Inventory: ONLY admins */}
                <Route path="/manage-inventory" element={
                  <ProtectedRoute requireAdmin={true}>
                    <ManageInventory />
                  </ProtectedRoute>
                } />

                {/* Dashboard: ONLY admins */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requireAdmin={true}>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                {/* Reorder List: ONLY admins */}
                <Route path="/reorder-list" element={
                  <ProtectedRoute requireAdmin={true}>
                    <ReorderList />
                  </ProtectedRoute>
                } />

                {/* Account Management: ONLY admins */}
                <Route path="/account-management" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AccountManagement />
                  </ProtectedRoute>
                } />

                {/* Sales Report: ONLY admins */}
                <Route path="/sales-report" element={
                  <ProtectedRoute requireAdmin={true}>
                    <SalesReport />
                  </ProtectedRoute>
                } />

                {/* Protected Route: ONLY admins can see the dashboard */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;