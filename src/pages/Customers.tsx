
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, Search, CreditCard,
  DollarSign, Clock, ChevronDown, ChevronUp,
  AlertCircle, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useBusinessContext, Customer, Purchase } from '@/context/BusinessContext';
import PageTransition from '@/components/layout/PageTransition';
import Card from '@/components/ui-custom/Card';
import SearchInput from '@/components/ui-custom/SearchInput';

// Animation variants
const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    transition: { duration: 0.2 } 
  }
};

const Customers = () => {
  const { customers, addCustomer, makePayment, exchangeRate } = useBusinessContext();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState<'BS' | 'USD'>('USD');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    credit_limit: ''
  });
  
  // Update filtered customers when search term or customers change
  React.useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      setFilteredCustomers(
        customers.filter(customer => 
          customer.name.toLowerCase().includes(lowerSearchTerm) ||
          customer.email.toLowerCase().includes(lowerSearchTerm) ||
          customer.phone.toLowerCase().includes(lowerSearchTerm)
        )
      );
    }
  }, [searchTerm, customers]);
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  // Toggle purchase history
  const togglePurchaseHistory = (customerId: string) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId);
  };
  
  // Handle add customer
  const handleAddCustomer = () => {
    // Validate required fields
    if (!newCustomer.name.trim()) {
      toast.error("Campo requerido", {
        description: "El nombre del cliente es obligatorio.",
      });
      return;
    }
    
    // Parse credit limit
    const creditLimit = parseFloat(newCustomer.credit_limit.replace(',', '.') || '0');
    
    if (newCustomer.credit_limit && (isNaN(creditLimit) || creditLimit < 0)) {
      toast.error("Límite de crédito inválido", {
        description: "Ingrese un valor válido mayor o igual a cero.",
      });
      return;
    }
    
    // Add customer
    addCustomer({
      name: newCustomer.name.trim(),
      email: newCustomer.email.trim(),
      phone: newCustomer.phone.trim(),
      credit_limit: creditLimit,
      current_credit: 0
    });
    
    // Reset form and close dialog
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      credit_limit: ''
    });
    
    setIsAddCustomerDialogOpen(false);
  };
  
  // Handle make payment
  const handleMakePayment = () => {
    if (!selectedCustomer) {
      return;
    }
    
    // Validate payment amount
    const amount = parseFloat(paymentAmount.replace(',', '.'));
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Monto inválido", {
        description: "Ingrese un monto válido mayor que cero.",
      });
      return;
    }
    
    // Make payment
    makePayment(selectedCustomer.id, amount, paymentCurrency);
    
    // Reset form and close dialog
    setPaymentAmount('');
    setPaymentCurrency('USD');
    setIsPaymentDialogOpen(false);
  };
  
  // Open payment dialog
  const openPaymentDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsPaymentDialogOpen(true);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };
  
  // Format currency
  const formatCurrency = (value: number, currency: 'BS' | 'USD') => {
    return currency === 'BS' 
      ? `Bs. ${value.toFixed(2)}` 
      : `$${value.toFixed(2)}`;
  };
  
  // Get payment status badge
  const getPaymentStatusBadge = (status: Purchase['payment_status']) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Pagado
          </Badge>
        );
      case 'credit':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <CreditCard className="h-3 w-3 mr-1" />
            Crédito
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Parcial
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <PageTransition>
      <div className="min-h-screen pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold mb-2">Clientes</h1>
              <p className="text-muted-foreground">
                Gestione sus clientes, créditos e historial de compras.
              </p>
            </motion.div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <SearchInput 
              placeholder="Buscar clientes..." 
              onSearch={handleSearch}
              className="w-full md:w-96"
            />
            
            <Button onClick={() => setIsAddCustomerDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Cliente
            </Button>
          </div>
          
          {filteredCustomers.length === 0 ? (
            <Card className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              
              {searchTerm ? (
                <>
                  <p className="text-muted-foreground">
                    No se encontraron clientes que coincidan con "{searchTerm}".
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Intente con otro término de búsqueda.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    No hay clientes registrados.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Agregue clientes para comenzar.
                  </p>
                </>
              )}
            </Card>
          ) : (
            <AnimatePresence>
              {filteredCustomers.map((customer) => (
                <motion.div
                  key={customer.id}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={listItemVariants}
                  className="mb-4"
                >
                  <Card>
                    <div className="md:flex md:justify-between md:items-center">
                      <div className="mb-4 md:mb-0">
                        <h2 className="text-xl font-semibold">{customer.name}</h2>
                        
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground mt-1">
                          {customer.email && (
                            <span>{customer.email}</span>
                          )}
                          
                          {customer.phone && (
                            <span>{customer.phone}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-3">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => togglePurchaseHistory(customer.id)}
                        >
                          {expandedCustomerId === customer.id ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Ocultar Historial
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Ver Historial
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          size="sm"
                          onClick={() => openPaymentDialog(customer)}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Registrar Pago
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t">
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Límite de Crédito</p>
                        <p className="text-lg font-medium">
                          {formatCurrency(customer.credit_limit, 'USD')}
                        </p>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Crédito Actual</p>
                        <p className="text-lg font-medium">
                          {formatCurrency(customer.current_credit, 'USD')}
                        </p>
                      </div>
                      
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Disponible</p>
                        <p className="text-lg font-medium">
                          {formatCurrency(Math.max(0, customer.credit_limit - customer.current_credit), 'USD')}
                        </p>
                        
                        {customer.current_credit > customer.credit_limit && (
                          <p className="flex items-center text-xs text-destructive mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Excede el límite
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Purchase History */}
                    <AnimatePresence>
                      {expandedCustomerId === customer.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 pt-4 border-t"
                        >
                          <h3 className="text-lg font-medium mb-4">Historial de Compras</h3>
                          
                          {customer.purchase_history.length === 0 ? (
                            <div className="text-center py-8 bg-muted/20 rounded-lg">
                              <Clock className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                              <p className="text-muted-foreground">
                                No hay historial de compras.
                              </p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto -mx-6">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Monto (USD)</TableHead>
                                    <TableHead>Monto (BS)</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Productos</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {customer.purchase_history.map((purchase) => (
                                    <TableRow key={purchase.id}>
                                      <TableCell>
                                        {formatDate(purchase.date)}
                                      </TableCell>
                                      <TableCell>
                                        {formatCurrency(purchase.total_usd, 'USD')}
                                      </TableCell>
                                      <TableCell>
                                        {formatCurrency(purchase.total_bs, 'BS')}
                                      </TableCell>
                                      <TableCell>
                                        {getPaymentStatusBadge(purchase.payment_status)}
                                      </TableCell>
                                      <TableCell>
                                        {purchase.items.length} 
                                        {purchase.items.length === 1 ? ' producto' : ' productos'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
      
      {/* Add Customer Dialog */}
      <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nombre del Cliente *</Label>
              <Input
                id="customer-name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Ingrese el nombre del cliente"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer-email">Correo Electrónico</Label>
              <Input
                id="customer-email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="Ingrese el correo electrónico"
                type="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Teléfono</Label>
              <Input
                id="customer-phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="Ingrese el número de teléfono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer-credit-limit">Límite de Crédito (USD)</Label>
              <Input
                id="customer-credit-limit"
                value={newCustomer.credit_limit}
                onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCustomerDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleAddCustomer}>
              <Check className="h-4 w-4 mr-2" />
              Guardar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Make Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                <p className="font-medium">{selectedCustomer.name}</p>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Crédito Actual</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(selectedCustomer.current_credit, 'USD')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Límite de Crédito</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(selectedCustomer.credit_limit, 'USD')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Monto del Pago</Label>
                <Input
                  id="payment-amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment-currency">Moneda</Label>
                <Select 
                  value={paymentCurrency} 
                  onValueChange={(value) => setPaymentCurrency(value as 'BS' | 'USD')}
                >
                  <SelectTrigger id="payment-currency">
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                    <SelectItem value="BS">Bolívar (BS)</SelectItem>
                  </SelectContent>
                </Select>
                
                {paymentCurrency === 'BS' && (
                  <p className="text-xs text-muted-foreground">
                    Tasa de cambio actual: {exchangeRate} Bs/$
                  </p>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleMakePayment}>
              <Check className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default Customers;
