
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// Types
export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  profit_percentage: number;
  profit_margin: number;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  credit_limit: number;
  current_credit: number;
  purchase_history: Purchase[];
}

export type PaymentMethod = 'cash' | 'pos' | 'biopayment' | 'credit';

export interface Purchase {
  id: string;
  date: string;
  total_bs: number;
  total_usd: number;
  items: CartItem[];
  payment_status: 'paid' | 'credit' | 'partial';
  payment_method: PaymentMethod;
  amount_paid?: number;
  customer_type: 'regular' | 'occasional';
  customer_id?: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  amount: number;
  currency: 'BS' | 'USD';
  date: string;
}

interface BusinessContextType {
  // Products
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  uploadProductsFromJSON: (file: File) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => void;
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Customers
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  addCustomer: (customer: Omit<Customer, 'id' | 'purchase_history'>) => void;
  addCreditToCustomer: (customerId: string, amount: number) => void;
  makePayment: (customerId: string, amount: number, currency: 'BS' | 'USD') => void;
  
  // Exchange rate
  exchangeRate: number;
  setExchangeRate: React.Dispatch<React.SetStateAction<number>>;
  lastExchangeRateUpdate: Date | null;
  
  // Calculations
  calculateSubtotalBS: () => number;
  calculateSubtotalUSD: () => number;
  
  // Purchases
  completePurchase: (
    customerType: 'regular' | 'occasional',
    customerId: string | null, 
    paymentMethod: PaymentMethod, 
    amountPaid?: number
  ) => void;
}

const BusinessContext = createContext<BusinessContextType | null>(null);

export const useBusinessContext = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinessContext must be used within a BusinessProvider');
  }
  return context;
};

interface BusinessProviderProps {
  children: ReactNode;
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ children }) => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(35.5); // Default value
  const [lastExchangeRateUpdate, setLastExchangeRateUpdate] = useState<Date | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedProducts = localStorage.getItem('business_products');
    const storedCustomers = localStorage.getItem('business_customers');
    const storedExchangeRate = localStorage.getItem('business_exchange_rate');
    const storedExchangeRateUpdate = localStorage.getItem('business_exchange_rate_update');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    if (storedExchangeRate) setExchangeRate(parseFloat(storedExchangeRate));
    if (storedExchangeRateUpdate) setLastExchangeRateUpdate(new Date(storedExchangeRateUpdate));
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('business_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('business_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('business_exchange_rate', exchangeRate.toString());
    setLastExchangeRateUpdate(new Date());
    localStorage.setItem('business_exchange_rate_update', new Date().toISOString());
  }, [exchangeRate]);

  // Check if exchange rate needs update (daily reminder)
  useEffect(() => {
    if (lastExchangeRateUpdate) {
      const today = new Date();
      const lastUpdate = new Date(lastExchangeRateUpdate);
      
      if (today.getDate() !== lastUpdate.getDate() || 
          today.getMonth() !== lastUpdate.getMonth() || 
          today.getFullYear() !== lastUpdate.getFullYear()) {
        toast("Recordatorio", {
          description: "Por favor actualice la tasa de cambio USD-BS para hoy.",
          duration: 5000,
        });
      }
    }
  }, [lastExchangeRateUpdate]);

  // Product functions
  const uploadProductsFromJSON = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const jsonData = JSON.parse(text);
          
          if (!Array.isArray(jsonData)) {
            toast.error("Formato de JSON incorrecto", {
              description: "El archivo debe contener un array de productos",
            });
            reject(new Error("JSON format incorrect"));
            return;
          }
          
          const newProducts: Product[] = [];
          
          for (const item of jsonData) {
            // Check if the item has the required fields
            if (item.name && typeof item.price !== 'undefined') {
              const name = item.name.trim();
              const price = parseFloat(item.price);
              const cost = item.cost ? parseFloat(item.cost) : 0;
              const stock = item.stock ? parseInt(item.stock, 10) : 0;
              
              if (name && !isNaN(price)) {
                const profit_percentage = cost > 0 ? ((price - cost) / cost) * 100 : 0;
                const profit_margin = price - cost;
                
                newProducts.push({
                  id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  name,
                  price,
                  cost,
                  profit_percentage,
                  profit_margin,
                  stock
                });
              }
            }
          }
          
          if (newProducts.length > 0) {
            setProducts(prev => {
              // Remove duplicates based on name
              const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
              const uniqueNewProducts = newProducts.filter(p => !existingNames.has(p.name.toLowerCase()));
              
              toast.success(`${uniqueNewProducts.length} productos importados`, {
                description: `Se han añadido ${uniqueNewProducts.length} nuevos productos al inventario.`,
              });
              
              return [...prev, ...uniqueNewProducts];
            });
            
            resolve();
          } else {
            toast.error("No se encontraron productos válidos", {
              description: "El archivo no contenía productos con el formato correcto.",
            });
            reject(new Error("No valid products found"));
          }
        } catch (error) {
          toast.error("Error al procesar el archivo", {
            description: "Por favor verifique el formato del archivo JSON.",
          });
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        toast.error("Error al leer el archivo", {
          description: "Ocurrió un error al intentar leer el archivo.",
        });
        reject(error);
      };
      
      reader.readAsText(file);
    });
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    
    setProducts(prev => [...prev, newProduct]);
    toast.success("Producto añadido", {
      description: `${newProduct.name} se ha añadido al inventario.`,
    });
  };

  // Cart functions
  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      } else {
        return [...prev, { ...product, quantity }];
      }
    });
    
    toast.success("Producto añadido al carrito", {
      description: `${quantity} x ${product.name}`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev => 
      prev.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Customer functions
  const addCustomer = (customer: Omit<Customer, 'id' | 'purchase_history'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      purchase_history: [],
      current_credit: 0,
    };
    
    setCustomers(prev => [...prev, newCustomer]);
    toast.success("Cliente añadido", {
      description: `${newCustomer.name} se ha añadido a la base de datos.`,
    });
  };

  const addCreditToCustomer = (customerId: string, amount: number) => {
    setCustomers(prev => 
      prev.map(customer => {
        if (customer.id === customerId) {
          return {
            ...customer,
            current_credit: customer.current_credit + amount,
          };
        }
        return customer;
      })
    );
  };

  const makePayment = (customerId: string, amount: number, currency: 'BS' | 'USD') => {
    const amountInUSD = currency === 'BS' ? amount / exchangeRate : amount;
    
    setCustomers(prev => 
      prev.map(customer => {
        if (customer.id === customerId) {
          const newCredit = Math.max(0, customer.current_credit - amountInUSD);
          
          // Create payment record
          const payment: Payment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            customer_id: customerId,
            amount,
            currency,
            date: new Date().toISOString(),
          };
          
          // Could add payment to a separate payments collection if needed
          
          toast.success("Pago registrado", {
            description: `Se registró un pago de ${currency === 'BS' ? 'Bs.' : '$'}${amount} para ${customer.name}.`,
          });
          
          return {
            ...customer,
            current_credit: newCredit,
          };
        }
        return customer;
      })
    );
  };

  // Calculation functions
  const calculateSubtotalBS = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity * exchangeRate), 0);
  };

  const calculateSubtotalUSD = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Purchase completion
  const completePurchase = (
    customerType: 'regular' | 'occasional',
    customerId: string | null, 
    paymentMethod: PaymentMethod, 
    amountPaid?: number
  ) => {
    const totalBS = calculateSubtotalBS();
    const totalUSD = calculateSubtotalUSD();
    
    if (cart.length === 0) {
      toast.error("Carrito vacío", {
        description: "No hay productos en el carrito para completar la compra.",
      });
      return;
    }
    
    // Create purchase record
    const purchase: Purchase = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      total_bs: totalBS,
      total_usd: totalUSD,
      items: [...cart],
      payment_status: paymentMethod === 'credit' ? 'credit' : 'paid',
      payment_method: paymentMethod,
      amount_paid: amountPaid,
      customer_type: customerType,
      customer_id: customerId || undefined,
    };
    
    // Update customer if specified
    if (customerId) {
      setCustomers(prev => 
        prev.map(customer => {
          if (customer.id === customerId) {
            let newCredit = customer.current_credit;
            
            if (paymentMethod === 'credit') {
              newCredit += totalUSD;
            } else if (amountPaid && amountPaid < totalUSD) {
              // Partial payment
              purchase.payment_status = 'partial';
              newCredit += (totalUSD - amountPaid);
            }
            
            if (newCredit > customer.credit_limit) {
              toast.warning("Límite de crédito excedido", {
                description: `${customer.name} ha excedido su límite de crédito.`,
              });
            }
            
            return {
              ...customer,
              current_credit: newCredit,
              purchase_history: [purchase, ...customer.purchase_history],
            };
          }
          return customer;
        })
      );
    }
    
    // Update product stock
    setProducts(prev => 
      prev.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem) {
          return {
            ...product,
            stock: Math.max(0, product.stock - cartItem.quantity),
          };
        }
        return product;
      })
    );
    
    const paymentMethodText = {
      'cash': 'Efectivo',
      'pos': 'Punto de Venta',
      'biopayment': 'Biopago',
      'credit': 'Crédito'
    }[paymentMethod];
    
    toast.success("Compra completada", {
      description: `Compra por $${totalUSD.toFixed(2)} (Bs. ${totalBS.toFixed(2)}) completada exitosamente con ${paymentMethodText}.`,
    });
    
    // Clear cart after purchase
    clearCart();
  };

  const value: BusinessContextType = {
    products,
    setProducts,
    uploadProductsFromJSON,
    addProduct,
    
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    
    customers,
    setCustomers,
    addCustomer,
    addCreditToCustomer,
    makePayment,
    
    exchangeRate,
    setExchangeRate,
    lastExchangeRateUpdate,
    
    calculateSubtotalBS,
    calculateSubtotalUSD,
    
    completePurchase,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};
