
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Receipt, Settings, Users, Home,
  Menu, X
} from 'lucide-react';

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
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  const navItems = [
    { to: '/', icon: <Home size={18} />, label: 'Inicio' },
    { to: '/facturacion', icon: <Receipt size={18} />, label: 'Facturación' },
    { to: '/administracion', icon: <Settings size={18} />, label: 'Administración' },
    { to: '/clientes', icon: <Users size={18} />, label: 'Clientes' }
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
            />
          ))}
        </nav>

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
              />
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
