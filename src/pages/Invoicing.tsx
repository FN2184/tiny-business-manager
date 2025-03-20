
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, X, Plus, Minus, Calculator,
  Trash2, CreditCard, DollarSign, Users, User, CreditCardIcon, SmartphoneIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useBusinessContext, PaymentMethod } from '@/context/BusinessContext';
import PageTransition from '@/components/layout/PageTransition';
import SearchInput from '@/components/ui-custom/SearchInput';
import Card from '@/components/ui-custom/Card';

// Animation variants
const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
  exit: { 
    opacity: 0, 
    x: 20, 
    transition: { duration: 0.2 } 
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const Invoicing = () => {
  // Get context data and functions
  const { 
    products, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartItemQuantity,
    customers,
    calculateSubtotalBS,
    calculateSubtotalUSD,
    exchangeRate,
    completePurchase,
    calculateChange
  } = useBusinessContext();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [customerType, setCustomerType] = useState<'regular' | 'occasional'>('occasional');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState<string>('');
  const [calculatorCurrency, setCalculatorCurrency] = useState<'BS' | 'USD'>('USD');
  const [calculatorResult, setCalculatorResult] = useState<{ change_usd: number; change_bs: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productCategories, setProductCategories] = useState<string[]>([]);
  
  // Update filtered products when search term, selected category, or products change
  useEffect(() => {
    // Extract unique categories
    const categories = new Set(products.map(product => product.category));
    setProductCategories(Array.from(categories));
    
    let filtered = [...products];
    
    if (searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);
  
  // Update filtered customers when search term changes
  useEffect(() => {
    if (customerSearchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const lowerSearchTerm = customerSearchTerm.toLowerCase();
      setFilteredCustomers(
        customers.filter(customer => 
          customer.name.toLowerCase().includes(lowerSearchTerm) ||
          customer.email.toLowerCase().includes(lowerSearchTerm) ||
          customer.phone.toLowerCase().includes(lowerSearchTerm)
        )
      );
    }
  }, [customerSearchTerm, customers]);
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  // Handle customer search
  const handleCustomerSearch = (term: string) => {
    setCustomerSearchTerm(term);
  };
  
  // Handle adding product to cart
  const handleAddToCart = (product: typeof products[0], quantity: number = 1) => {
    if (quantity <= 0) {
      toast.error("Cantidad inválida", {
        description: "La cantidad debe ser mayor que cero.",
      });
      return;
    }
    
    // Check if there's enough stock
    if (quantity > product.stock) {
      toast.error("Stock insuficiente", {
        description: `Solo hay ${product.stock} unidades disponibles.`,
      });
      return;
    }
    
    addToCart(product, quantity);
  };
  
  // Handle quantity change
  const handleQuantityChange = (productId: string, value: string) => {
    // Allow decimal values with comma or dot
    const sanitizedValue = value.replace(',', '.');
    const quantity = parseFloat(sanitizedValue);
    
    if (!isNaN(quantity) && quantity > 0) {
      updateCartItemQuantity(productId, quantity);
    }
  };
  
  // Handle checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Carrito vacío", {
        description: "Agregue productos al carrito para continuar.",
      });
      return;
    }
    
    setIsCheckoutDialogOpen(true);
  };
  
  // Handle complete purchase
  const handleCompletePurchase = () => {
    // For credit payment, customer must be selected
    if (paymentMethod === 'credit' && !selectedCustomerId) {
      toast.error("Cliente requerido", {
        description: "Debe seleccionar un cliente para ventas a crédito.",
      });
      return;
    }
    
    // For cash payment, ensure amount paid is valid if entered
    if (paymentMethod === 'cash' && amountPaid) {
      const amount = parseFloat(amountPaid.replace(',', '.'));
      
      if (isNaN(amount) || amount <= 0) {
        toast.error("Monto inválido", {
          description: "Ingrese un monto válido para el pago.",
        });
        return;
      }
      
      // Check if amount paid is sufficient
      if (amount < calculateSubtotalUSD()) {
        // If customer is selected, this will be partial credit
        if (!selectedCustomerId) {
          toast.error("Monto insuficiente", {
            description: "El monto pagado es menor que el total y no se ha seleccionado un cliente para crédito.",
          });
          return;
        }
      }
      
      completePurchase(customerType, selectedCustomerId, paymentMethod, amount);
    } else {
      completePurchase(customerType, selectedCustomerId, paymentMethod);
    }
    
    setIsCheckoutDialogOpen(false);
    setSelectedCustomerId(null);
    setPaymentMethod('cash');
    setAmountPaid('');
    setCustomerType('occasional');
  };
  
  // Handle calculator
  const handleCalculateChange = () => {
    if (!calculatorAmount || isNaN(parseFloat(calculatorAmount.replace(',', '.')))) {
      toast.error("Monto inválido", {
        description: "Ingrese un monto válido para calcular el cambio.",
      });
      return;
    }
    
    const amount = parseFloat(calculatorAmount.replace(',', '.'));
    const change = calculateChange(amount, calculatorCurrency);
    
    setCalculatorResult(change);
  };
  
  // Increase/decrease quantity in cart
  const handleUpdateQuantity = (productId: string, increment: boolean) => {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    const newQuantity = increment ? item.quantity + 1 : item.quantity - 1;
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    // Check if there's enough stock when incrementing
    if (increment) {
      const product = products.find(p => p.id === productId);
      if (product && newQuantity > product.stock) {
        toast.error("Stock insuficiente", {
          description: `Solo hay ${product.stock} unidades disponibles.`,
        });
        return;
      }
    }
    
    updateCartItemQuantity(productId, newQuantity);
  };
  
  // Format currency
  const formatCurrency = (value: number, currency: 'BS' | 'USD') => {
    return currency === 'BS' 
      ? `Bs. ${value.toFixed(2)}` 
      : `$${value.toFixed(2)}`;
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
              <h1 className="text-3xl font-bold mb-2">Facturación</h1>
              <p className="text-muted-foreground">
                Busque productos, agregue a la venta y procese el pago.
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Search */}
            <div className="lg:col-span-2">
              <Card>
                <h2 className="text-xl font-semibold mb-4">Productos</h2>
                
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
                  <SearchInput 
                    placeholder="Buscar productos por nombre..." 
                    onSearch={handleSearch}
                    className="flex-1"
                  />
                  
                  <Select 
                    value={selectedCategory} 
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {productCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      No se encontraron productos.
                    </p>
                  </div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-1"
                  >
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        variants={listItemVariants}
                        className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <div className="flex items-center mt-1 text-sm">
                            <span className="text-muted-foreground">
                              {formatCurrency(product.price, 'USD')}
                            </span>
                            <span className="mx-2 text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {formatCurrency(product.price * exchangeRate, 'BS')}
                            </span>
                            
                            {product.stock === 0 && (
                              <span className="ml-2 text-destructive">
                                Sin stock
                              </span>
                            )}
                            {product.stock > 0 && (
                              <span className="ml-2 text-emerald-500">
                                Stock: {product.stock}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </Card>
            </div>
            
            {/* Shopping Cart */}
            <div>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Carrito</h2>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <ShoppingCart className="h-4 w-4" />
                    <span>{cart.length} items</span>
                  </div>
                </div>
                
                {cart.length === 0 ? (
                  <div className="text-center py-12 border-t border-dashed">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      No hay productos en el carrito.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Busque y agregue productos para comenzar.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[calc(100vh-500px)] overflow-y-auto pr-1 mb-4 border-t border-dashed pt-4">
                      <AnimatePresence>
                        {cart.map((item) => (
                          <motion.div
                            key={item.id}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={listItemVariants}
                            className="flex items-center justify-between py-3 border-b last:border-b-0"
                          >
                            <div className="flex-1 pr-2">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(item.price, 'USD')} ({formatCurrency(item.price * exchangeRate, 'BS')})
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center border rounded-md overflow-hidden">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-none border-r"
                                  onClick={() => handleUpdateQuantity(item.id, false)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                
                                <Input
                                  type="text"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                  className="w-12 h-8 text-center text-sm border-0 rounded-none"
                                />
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-none border-l"
                                  onClick={() => handleUpdateQuantity(item.id, true)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Subtotal (USD):</span>
                        <span className="font-medium">{formatCurrency(calculateSubtotalUSD(), 'USD')}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-4">
                        <span className="text-muted-foreground">Subtotal (BS):</span>
                        <span className="font-medium">{formatCurrency(calculateSubtotalBS(), 'BS')}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <Popover open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline">
                              <Calculator className="mr-2 h-4 w-4" />
                              Calcular Cambio
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-4">
                              <h3 className="font-medium">Calculadora de Cambio</h3>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Monto Recibido</Label>
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className={calculatorCurrency === 'USD' ? 'bg-primary/10' : ''}
                                      onClick={() => setCalculatorCurrency('USD')}
                                    >
                                      USD
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className={calculatorCurrency === 'BS' ? 'bg-primary/10' : ''}
                                      onClick={() => setCalculatorCurrency('BS')}
                                    >
                                      BS
                                    </Button>
                                  </div>
                                </div>
                                
                                <Input
                                  value={calculatorAmount}
                                  onChange={(e) => setCalculatorAmount(e.target.value)}
                                  placeholder={`Ej. 50${calculatorCurrency === 'USD' ? '' : '0'}`}
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsCalculatorOpen(false)}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={handleCalculateChange}
                                >
                                  Calcular
                                </Button>
                              </div>
                              
                              {calculatorResult && (
                                <div className="mt-4 space-y-2 p-3 bg-muted rounded-md">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">Cambio (USD):</span>
                                    <span className="font-medium">{formatCurrency(calculatorResult.change_usd, 'USD')}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">Cambio (BS):</span>
                                    <span className="font-medium">{formatCurrency(calculatorResult.change_bs, 'BS')}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                        
                        <Button className="w-full" onClick={handleCheckout}>
                          Procesar Compra
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Checkout Dialog */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Completar Compra</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Customer Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Cliente</label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={customerType === 'occasional' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setCustomerType('occasional')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Ocasional
                </Button>
                <Button
                  type="button"
                  variant={customerType === 'regular' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setCustomerType('regular')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Usual
                </Button>
              </div>
            </div>
            
            {/* Customer Selection (for regular customers) */}
            {customerType === 'regular' && (
              <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                <label className="text-sm font-medium">Seleccionar Cliente</label>
                <SearchInput 
                  placeholder="Buscar cliente por nombre, email o teléfono..." 
                  onSearch={handleCustomerSearch}
                  className="mb-2"
                />
                
                <div className="max-h-[200px] overflow-y-auto mt-2">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 text-center">
                      No se encontraron clientes
                    </p>
                  ) : (
                    <RadioGroup
                      value={selectedCustomerId || ""}
                      onValueChange={(value) => setSelectedCustomerId(value)}
                      className="space-y-1"
                    >
                      {filteredCustomers.map((customer) => (
                        <div key={customer.id} className="flex items-center space-x-2 rounded hover:bg-muted p-2">
                          <RadioGroupItem value={customer.id} id={`customer-${customer.id}`} />
                          <Label htmlFor={`customer-${customer.id}`} className="flex-1 cursor-pointer">
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                                <span>{customer.email}</span>
                                <span>{customer.phone}</span>
                                <span className={customer.current_credit > 0 ? "text-amber-500" : ""}>
                                  Crédito: {formatCurrency(customer.current_credit, 'USD')}
                                </span>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>
              </div>
            )}
            
            {/* Payment Method Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Método de Pago</label>
              <Tabs defaultValue="cash" onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="cash">Efectivo</TabsTrigger>
                  <TabsTrigger value="pos">Punto de venta</TabsTrigger>
                  <TabsTrigger value="biopayment">Biopago</TabsTrigger>
                  <TabsTrigger 
                    value="credit" 
                    disabled={customerType !== 'regular' || !selectedCustomerId}
                  >
                    Crédito
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="cash">
                  <div className="space-y-2 mt-2">
                    <label className="text-sm font-medium">Monto Pagado (USD)</label>
                    <Input
                      type="text"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="Ingrese el monto pagado"
                    />
                    <p className="text-xs text-muted-foreground">
                      Dejar en blanco para pago exacto. 
                      {(customerType === 'regular' && selectedCustomerId) && 
                        " Si el monto es menor que el total, la diferencia se aplicará como crédito."}
                    </p>
                    
                    {amountPaid && !isNaN(parseFloat(amountPaid.replace(',', '.'))) && (
                      <div className="p-3 bg-muted rounded-md mt-3">
                        <h4 className="text-sm font-medium mb-2">Cálculo de Cambio</h4>
                        {(() => {
                          const amount = parseFloat(amountPaid.replace(',', '.'));
                          const total = calculateSubtotalUSD();
                          
                          if (amount < total) {
                            return (
                              <p className="text-sm text-amber-500">
                                El monto pagado es menor que el total. 
                                {customerType === 'regular' && selectedCustomerId 
                                  ? " La diferencia se registrará como crédito." 
                                  : ""}
                              </p>
                            );
                          }
                          
                          const change = calculateChange(amount, 'USD');
                          
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Monto recibido:</span>
                                <span>${amount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Total a pagar:</span>
                                <span>${total.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm font-medium">
                                <span>Cambio (USD):</span>
                                <span>${change.change_usd.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm font-medium">
                                <span>Cambio (BS):</span>
                                <span>Bs. {change.change_bs.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="pos">
                  <div className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <CreditCardIcon className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm">Utilice el punto de venta para procesar el pago completo.</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="biopayment">
                  <div className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <SmartphoneIcon className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm">Escanee el código de pago o utilice la aplicación Biopago.</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="credit">
                  <div className="flex items-center justify-center p-6">
                    <div className="text-center">
                      <CreditCard className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm">El total se añadirá al crédito del cliente seleccionado.</p>
                      {selectedCustomerId && (
                        <div className="mt-2 p-2 bg-muted rounded">
                          {(() => {
                            const customer = customers.find(c => c.id === selectedCustomerId);
                            if (!customer) return null;
                            
                            const newCredit = customer.current_credit + calculateSubtotalUSD();
                            const willExceedLimit = newCredit > customer.credit_limit;
                            
                            return (
                              <>
                                <p className="text-sm">
                                  Crédito actual: <span className="font-medium">{formatCurrency(customer.current_credit, 'USD')}</span>
                                </p>
                                <p className="text-sm">
                                  Nuevo crédito: <span className={`font-medium ${willExceedLimit ? 'text-destructive' : ''}`}>
                                    {formatCurrency(newCredit, 'USD')}
                                  </span>
                                </p>
                                <p className="text-sm">
                                  Límite de crédito: <span className="font-medium">{formatCurrency(customer.credit_limit, 'USD')}</span>
                                </p>
                                
                                {willExceedLimit && (
                                  <p className="text-xs text-destructive mt-1">
                                    ¡Advertencia! Esta compra excederá el límite de crédito del cliente.
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Order Summary */}
            <div className="bg-muted/50 p-3 rounded-lg mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm">Total (USD):</span>
                <span className="font-semibold">{formatCurrency(calculateSubtotalUSD(), 'USD')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total (BS):</span>
                <span className="font-semibold">{formatCurrency(calculateSubtotalBS(), 'BS')}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCompletePurchase}>
              Completar Compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default Invoicing;

