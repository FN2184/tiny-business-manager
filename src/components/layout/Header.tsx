
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Receipt, Settings, Users, Home,
  Menu, X, LogOut, User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

// Animation variants
const navItemVariants = {
  inactive: { opacity: 0.7, scale: 0.95 },
  active: { opacity: 1, scale: 1 }
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  requiresAuth?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, requiresAuth }) => {
  const { isAuthenticated } = useAuth();
  
  // If route requires auth and user is not authenticated, don't show it
  if (requiresAuth && !isAuthenticated) {
    return null;
  }
  
  return (
    <motion.div
      initial="inactive"
      animate={isActive ? "active" : "inactive"}
      variants={navItemVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <Link 
        to={to}
        className={cn(
          "flex items-center px-4 py-2 rounded-full transition-all duration-300",
          "hover:bg-primary/5",
          isActive ? "text-primary font-medium" : "text-muted-foreground"
        )}
      >
        <span className="mr-2">{icon}</span>
        <span>{label}</span>
      </Link>
    </motion.div>
  );
};

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  // Handle scroll events for glass effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/', icon: <Home size={18} />, label: 'Inicio', requiresAuth: false },
    { to: '/facturacion', icon: <Receipt size={18} />, label: 'Facturación', requiresAuth: false },
    { to: '/administracion', icon: <Settings size={18} />, label: 'Administración', requiresAuth: true },
    { to: '/clientes', icon: <Users size={18} />, label: 'Clientes', requiresAuth: true }
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-3",
        scrolled ? "bg-white/70 backdrop-blur-lg shadow-sm border-b" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link 
          to="/" 
          className="font-semibold text-xl text-primary flex items-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="bg-primary text-white rounded-lg p-1 mr-2">
              MB
            </span>
            MiBusiness
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-1">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.to)}
              requiresAuth={item.requiresAuth}
            />
          ))}
        </nav>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center ml-4">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground flex items-center">
                <User size={14} className="mr-1" />
                <span>{user?.username}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-sm">
                <LogOut size={14} className="mr-1" /> Salir
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm">
                <User size={14} className="mr-1" /> Iniciar sesión
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-primary" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden bg-white border-t mt-3"
        >
          <div className="container mx-auto py-2">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={isActive(item.to)}
                requiresAuth={item.requiresAuth}
              />
            ))}
            
            {/* Mobile Auth Actions */}
            <div className="border-t mt-2 pt-2">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-4 py-1 text-sm text-muted-foreground flex items-center">
                    <User size={14} className="mr-2" />
                    <span>{user?.username}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-destructive hover:bg-destructive/5 rounded-full transition-colors"
                  >
                    <LogOut size={18} className="mr-2" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center px-4 py-2 rounded-full hover:bg-primary/5 transition-colors"
                >
                  <User size={18} className="mr-2" />
                  <span>Iniciar sesión</span>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
