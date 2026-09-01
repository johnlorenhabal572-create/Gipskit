import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Flame, User, LogOut, Menu as MenuIcon, X, Home, Utensils, Info, ClipboardList, Settings, CheckCircle2, TrendingUp, RefreshCw, Users, BarChart2, CreditCard, History, Receipt } from 'lucide-react';
import { IMAGES } from '../constants/images';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import CartModal from './CartModal';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
  const { cart, notification } = useContext(CartContext) as any;
  const { user, logout } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const location = useLocation();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPath = location.pathname;

  const getNavSections = () => {
    if (!user) {
      return [
        {
          title: 'Main Menu',
          links: [
            { name: 'Home', path: '/', icon: <Home size={20} /> },
            { name: 'Menu', path: '/menu', icon: <Utensils size={20} /> },
            { name: 'About', path: '/about', icon: <Info size={20} /> },
          ]
        }
      ];
    }

    if (user.role === 'admin' || user.role === 'staff') {
      return [
        {
          title: 'Staff & Admin Panel',
          links: [
            { name: 'Dashboard', path: '/dashboard', icon: <TrendingUp size={20} /> },
            { name: 'Manage Orders', path: '/admin', icon: <ClipboardList size={20} /> },
            { name: 'POS', path: '/pos', icon: <Utensils size={20} /> },
            { name: 'Transaction History', path: '/history', icon: <History size={20} /> },
            { name: 'Manage Menu', path: '/manage-menu', icon: <Utensils size={20} /> },
            { name: 'Manage Inventory', path: '/manage-inventory', icon: <Settings size={20} /> },
            { name: 'Reorder List', path: '/reorder-list', icon: <RefreshCw size={20} /> },
            { name: 'Sales Report', path: '/sales-report', icon: <BarChart2 size={20} /> },
          ]
        },
        {
          title: 'Account',
          links: [
            { name: 'Users Account', path: '/account-management', icon: <Users size={20} /> },
          ]
        }
      ];
    }

    if (user.role === 'customer') {
      return [
        {
          title: 'Main Menu',
          links: [
            { name: 'Home', path: '/', icon: <Home size={20} /> },
            { name: 'Menu', path: '/menu', icon: <Utensils size={20} /> },
            { name: 'About', path: '/about', icon: <Info size={20} /> },
          ]
        },
        {
          title: 'Account',
          links: [
            { name: 'My Order', path: '/my-orders', icon: <ClipboardList size={20} /> },
            { name: 'My Bill', path: '/my-bill', icon: <Receipt size={20} /> },
          ]
        }
      ];
    }

    return [];
  };

  const navSections = getNavSections();

  // Find active link name for the header title
  const allLinks = navSections.flatMap(s => s.links);
  const activeLink = allLinks.find(l => l.path === currentPath);
  const pageTitle = activeLink ? activeLink.name : '';

  return (
    <>
      {/* Top Header (Universal) */}
      <header className="bg-white text-dark py-3 px-4 sm:px-6 border-b border-gray-200 sticky top-0 z-40 w-full">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 text-dark hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
            >
              <MenuIcon size={22} />
            </button>
            <Link to="/" className="hidden sm:flex items-center gap-2.5 text-lg font-black tracking-tight">
              <div className="bg-dark p-1 rounded-md overflow-hidden w-7 h-7 flex items-center justify-center">
                <img src={IMAGES.LOGO} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="tracking-tight">GIP'S <span className="text-primary font-black">KITCHEN</span></span>
            </Link>
            
            {/* Page Title */}
            {pageTitle && (
              <div className="flex items-center gap-2 ml-1 sm:ml-4 border-l border-gray-200 pl-3 sm:pl-4">
                <span className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  {pageTitle}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {(user?.role === 'customer' || !user) && (
              <button 
                id="header-cart-btn"
                onClick={() => setIsCartOpen(true)} 
                className="relative p-2 text-dark hover:bg-gray-100 rounded-lg border border-transparent hover:border-gray-200 transition-colors"
                title="Your Cart"
              >
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center border border-white">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {!user ? (
              <Link 
                id="header-signin-btn"
                to="/login" 
                className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 active:translate-y-0.5"
              >
                <User size={15} />
                <span>Sign In</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-lg">
                  <div className="w-5 h-5 bg-primary text-white rounded text-[11px] font-bold flex items-center justify-center">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-bold text-dark truncate max-w-[120px]">
                    {user.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Popup */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10, x: '-50%' }}
            animate={{ opacity: 1, y: 15, x: '-50%' }}
            exit={{ opacity: 0, y: -10, x: '-50%' }}
            className="fixed top-14 left-1/2 z-50 bg-white border border-gray-200 px-5 py-2.5 rounded-lg flex items-center gap-2.5"
          >
            <CheckCircle2 size={16} className="text-primary shrink-0" />
            <span className="text-xs font-bold text-dark">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white text-dark w-72 border-r border-gray-200 z-50 transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          {/* Logo & Close */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-200">
            <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-tight" onClick={() => setIsSidebarOpen(false)}>
              <div className="bg-dark p-1 rounded-md overflow-hidden w-8 h-8 flex items-center justify-center">
                <img src={IMAGES.LOGO} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span>GIP'S <span className="text-primary">KITCHEN</span></span>
            </Link>
            <button 
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-dark transition-colors" 
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close navigation sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 py-6 space-y-6 overflow-y-auto pr-1">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">{section.title}</p>
                <div className="space-y-0.5">
                  {section.links.map((link) => {
                    const isActive = currentPath === link.path;
                    return (
                      <Link 
                        key={link.name} 
                        to={link.path} 
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                          isActive 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-dark border border-transparent'
                        }`}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <span className={isActive ? 'text-primary' : 'text-gray-500'}>
                          {link.icon}
                        </span>
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Section */}
          <div className="pt-4 border-t border-gray-200 mt-auto">
            {user ? (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 bg-primary text-white rounded font-bold text-xs flex items-center justify-center shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-dark">{user.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{user.role}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors" 
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="w-full bg-dark text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-dark/90 transition-colors flex items-center justify-center gap-2"
                onClick={() => setIsSidebarOpen(false)}
              >
                <User size={16} /> Sign In / Sign Up
              </Link>
            )}
          </div>
        </div>
      </aside>

      {(user?.role === 'customer' || !user) && <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </>
  );
};

export default Navbar;