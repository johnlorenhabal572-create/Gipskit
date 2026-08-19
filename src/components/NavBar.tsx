import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Flame, User, LogOut, Menu as MenuIcon, X, Home, Utensils, Info, Phone, ClipboardList, Settings, CheckCircle2, Image, TrendingUp, RefreshCw, Users, BarChart2, CreditCard, History, Receipt } from 'lucide-react';
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
            { name: 'Gallery', path: '/gallery', icon: <Image size={20} /> },
            { name: 'About', path: '/about', icon: <Info size={20} /> },
            { name: 'Contact', path: '/contact', icon: <Phone size={20} /> },
          ]
        }
      ];
    }

    if (user.role === 'admin') {
      return [
        {
          title: 'Admin Panel',
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
            { name: 'Gallery', path: '/gallery', icon: <Image size={20} /> },
            { name: 'About', path: '/about', icon: <Info size={20} /> },
            { name: 'Contact', path: '/contact', icon: <Phone size={20} /> },
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
      <header className="bg-white text-dark p-4 shadow-sm sticky top-0 z-40 w-full">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="text-dark hover:text-primary transition-colors">
              <MenuIcon size={24} />
            </button>
            <Link to="/" className="hidden sm:flex items-center gap-2 text-xl font-bold tracking-tighter">
              <div className="bg-dark p-1 rounded-full overflow-hidden w-8 h-8 flex items-center justify-center">
                <img src={IMAGES.LOGO} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span>GIP'S <span className="text-primary text-sm sm:text-xl">KITCHEN</span></span>
            </Link>
            
            {/* Page Title for Mobile/Universal */}
            {pageTitle && (
              <div className="flex items-center gap-2 ml-1 sm:ml-4 border-l border-gray-100 pl-3 sm:pl-4">
                <span className="text-[12px] sm:text-sm font-black text-primary uppercase tracking-widest whitespace-nowrap">
                  {pageTitle}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {(user?.role === 'customer' || !user) && (
              <button 
                onClick={() => setIsCartOpen(true)} 
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
              >
                <ShoppingCart size={24} />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {(user?.role === 'customer' || !user) && (
              <Link 
                to="/menu" 
                className="bg-primary text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold hover:bg-opacity-90 transition-all shadow-sm"
              >
                Order Now
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Notification Popup */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-16 left-1/2 z-50 bg-white border border-gray-100 shadow-xl px-6 py-3 rounded-full flex items-center gap-3"
          >
            <div className="bg-green-100 p-1 rounded-full">
              <CheckCircle2 size={16} className="text-green-600" />
            </div>
            <span className="text-sm font-bold text-gray-800">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white text-dark w-80 shadow-2xl z-50 transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-8">
          {/* Logo & Close */}
          <div className="flex justify-between items-center mb-12">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tighter" onClick={() => setIsSidebarOpen(false)}>
              <div className="bg-dark p-1.5 rounded-full overflow-hidden w-10 h-10 flex items-center justify-center">
                <img src={IMAGES.LOGO} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span>GIP'S <span className="text-primary">KITCHEN</span></span>
            </Link>
            <button className="bg-gray-100 p-2 rounded-full text-gray-400 hover:text-primary transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 space-y-10 overflow-y-auto pr-2 custom-scrollbar">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-3">{section.title}</p>
                <div className="space-y-1">
                  {section.links.map((link) => {
                    const isActive = currentPath === link.path;
                    return (
                      <Link 
                        key={link.name} 
                        to={link.path} 
                        className={`flex items-center gap-3 p-3 rounded-2xl font-bold transition-all group ${
                          isActive 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-gray-700 hover:bg-primary/5 hover:text-primary'
                        }`}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <span className={`p-2 rounded-xl transition-colors ${
                          isActive 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-gray-100 group-hover:bg-primary/10 text-gray-400 group-hover:text-primary'
                        }`}>
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
          <div className="mt-auto pt-6 border-t border-gray-100">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold truncate w-24">{user.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{user.role}</span>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-primary transition-colors p-2" title="Logout">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="w-full bg-gray-100 text-dark py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                onClick={() => setIsSidebarOpen(false)}
              >
                <User size={18} className="text-gray-400" /> Login/Register
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