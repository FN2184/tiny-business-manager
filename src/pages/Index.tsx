
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Receipt, Settings, Users } from 'lucide-react';
import Card from '@/components/ui-custom/Card';
import { useBusinessContext } from '@/context/BusinessContext';
import PageTransition from '@/components/layout/PageTransition';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const Index = () => {
  const navigate = useNavigate();
  const { products, customers, exchangeRate, lastExchangeRateUpdate } = useBusinessContext();

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'No actualizado';
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Dashboard cards
  const dashboardCards = [
    {
      title: 'Facturación',
      description: 'Gestionar ventas, buscar productos y procesar pagos',
      icon: <Receipt className="h-8 w-8 text-primary" />,
      path: '/facturacion',
      stats: `${products.length} productos disponibles`
    },
    {
      title: 'Administración',
      description: 'Configurar inventario, precios y tasa de cambio',
      icon: <Settings className="h-8 w-8 text-primary" />,
      path: '/administracion',
      stats: `Tasa: ${exchangeRate} Bs/$`
    },
    {
      title: 'Clientes',
      description: 'Administrar clientes, créditos e historial de compras',
      icon: <Users className="h-8 w-8 text-primary" />,
      path: '/clientes',
      stats: `${customers.length} clientes registrados`
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen pt-20 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero section */}
          <section className="mb-16 mt-8 md:mt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-block mb-3"
              >
                <span className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                  Mi Business Manager
                </span>
              </motion.div>
              
              <motion.h1 
                className="text-4xl md:text-5xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Gestión simple y efectiva
              </motion.h1>
              
              <motion.p 
                className="text-lg text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                Sistema completo para gestionar facturación, inventario y clientes de su negocio.
              </motion.p>
            </motion.div>
          </section>

          {/* Dashboard cards */}
          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {dashboardCards.map((card, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card 
                  variant="glass" 
                  hoverEffect 
                  onClick={() => navigate(card.path)}
                  className="h-full"
                >
                  <div className="flex flex-col h-full">
                    <div className="mb-4">{card.icon}</div>
                    <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
                    <p className="text-muted-foreground mb-4 flex-grow">{card.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm font-medium text-muted-foreground">
                        {card.stats}
                      </span>
                      <motion.div
                        whileHover={{ x: 5 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.section>

          {/* Exchange rate info */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-12 bg-primary/5 rounded-xl p-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="text-lg font-medium mb-1">Tasa de cambio actual</h3>
                <p className="text-muted-foreground text-sm">
                  Última actualización: {formatDate(lastExchangeRateUpdate)}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="bg-white shadow-sm border px-4 py-2 rounded-lg">
                  <span className="text-lg font-semibold">{exchangeRate} Bs/$</span>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </PageTransition>
  );
};

export default Index;
