
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, X, Plus, Minus, 
  Trash2, CreditCard, DollarSign
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
import { toast } from 'sonner';
import { useBusinessContext } from '@/context/BusinessContext';
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
    completePurchase
  } = useBusinessContext();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  
  // Update filtered products when search term or products change
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      setFilteredProducts(
        products.filter(product => 
          product.name.toLowerCase().includes(lowerSearchTerm)
        )
      );
    }
  }, [searchTerm, products]);
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  // Handle adding product to cart
  const handleAddToCart = (product: typeof products[0], quantity: number = 1) => {
    if (quantity <= 0) {
      toast.error("Cantidad inválida", {
        description: "La cantidad debe ser mayor que cero.",
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
      
      completePurchase(selectedCustomerId, paymentMethod, amount);
    } else {
      completePurchase(selectedCustomerId, paymentMethod);
    }
    
    setIsCheckoutDialogOpen(false);
    setSelectedCustomerId(null);
    setPaymentMethod('cash');
    setAmountPaid('');
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
                
                <SearchInput 
                  placeholder="Buscar productos por nombre..." 
                  onSearch={handleSearch}
                  className="mb-6"
                />
                
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
                            
                            {product.stock > 0 && (
                              <>
                                <span className="mx-2 text-muted-foreground">•</span>
                                <span className="text-muted-foreground">
                                  Stock: {product.stock}
                                </span>
                              </>
                            )}
                            
                            {product.stock === 0 && (
                              <span className="ml-2 text-destructive">
                                Sin stock
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
                    <div className="max-h-[calc(100vh-420px)] overflow-y-auto pr-1 mb-4 border-t border-dashed pt-4">
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
                              <Input
                                type="text"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                className="w-16 h-8 text-center text-sm"
                              />
                              
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
                      
                      <Button className="w-full" onClick={handleCheckout}>
                        Procesar Compra
                      </Button>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Completar Compra</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente (opcional)</label>
              <Select 
                value={selectedCustomerId || ""} 
                onValueChange={(value) => setSelectedCustomerId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno - Venta directa</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Método de Pago</label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Efectivo
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'credit' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setPaymentMethod('credit')}
                  disabled={!selectedCustomerId}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Crédito
                </Button>
              </div>
              {paymentMethod === 'credit' && !selectedCustomerId && (
                <p className="text-sm text-destructive">
                  Debe seleccionar un cliente para usar crédito.
                </p>
              )}
            </div>
            
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Monto Pagado (USD)</label>
                <Input
                  type="text"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Ingrese el monto pagado"
                />
                <p className="text-xs text-muted-foreground">
                  Dejar en blanco para pago exacto. 
                  {selectedCustomerId && " Si el monto es menor que el total, la diferencia se aplicará como crédito."}
                </p>
              </div>
            )}
            
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
