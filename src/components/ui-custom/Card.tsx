
import { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'outlined';
  hoverEffect?: boolean;
  onClick?: () => void;
}

const Card: FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  hoverEffect = false,
  onClick,
}) => {
  // Base card styles
  const baseStyles = "rounded-xl p-6";
  
  // Variant styles
  const variantStyles = {
    default: "bg-white shadow-sm border",
    glass: "bg-white/80 backdrop-blur-lg border border-white/20 shadow-sm",
    outlined: "border border-border bg-transparent",
  };
  
  // Hover effect
  const hoverStyles = hoverEffect 
    ? "transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-1 cursor-pointer"
    : "";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={hoverEffect ? { y: -5, boxShadow: "0 10px 30px -15px rgba(0,0,0,0.1)" } : {}}
      className={cn(
        baseStyles,
        variantStyles[variant],
        hoverStyles,
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default Card;
