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
  category: string;
  min_stock: number;
  sales_count: number;
  unit?: string;
  additional_info?: string;
  additional_prices?: string;
  key?: string;
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
  addProduct: (product: Omit<Product, 'id' | 'sales_count'>) => void;
  updateProductStock: (productId: string, newStock: number) => void;
  exportProductsToJSON: () => void;
  getProductCategories: () => string[];
  getLowStockProducts: () => Product[];
  getTopSellingProducts: (limit?: number) => Product[];
  addCategory: (category: string) => void;
  
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
  
  // Categories
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  
  // Exchange rate
  exchangeRate: number;
  setExchangeRate: React.Dispatch<React.SetStateAction<number>>;
  lastExchangeRateUpdate: Date | null;
  
  // Calculations
  calculateSubtotalBS: () => number;
  calculateSubtotalUSD: () => number;
  calculateChange: (amountPaid: number, currency: 'BS' | 'USD') => { 
    change_usd: number; 
    change_bs: number;
  };
  
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
  const [categories, setCategories] = useState<string[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(35.5); // Default value
  const [lastExchangeRateUpdate, setLastExchangeRateUpdate] = useState<Date | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedProducts = localStorage.getItem('business_products');
    const storedCustomers = localStorage.getItem('business_customers');
    const storedExchangeRate = localStorage.getItem('business_exchange_rate');
    const storedExchangeRateUpdate = localStorage.getItem('business_exchange_rate_update');
    const storedCategories = localStorage.getItem('business_categories');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    if (storedExchangeRate) setExchangeRate(parseFloat(storedExchangeRate));
    if (storedExchangeRateUpdate) setLastExchangeRateUpdate(new Date(storedExchangeRateUpdate));
    if (storedCategories) setCategories(JSON.parse(storedCategories));
    else {
      // Initialize with default categories
      setCategories(['BEBIDA', 'ALIMENTOS', 'LIMPIEZA', 'OTROS']);
    }
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

  useEffect(() => {
    localStorage.setItem('business_categories', JSON.stringify(categories));
  }, [categories]);

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

  // Check for low stock alerts
  useEffect(() => {
    const lowStockProducts = getLowStockProducts();
    if (lowStockProducts.length > 0) {
      toast.warning("Alerta de inventario bajo", {
        description: `${lowStockProducts.length} productos tienen stock bajo.`,
        duration: 5000,
      });
    }
  }, [products]);

  // Add a new category
  const addCategory = (category: string) => {
    const trimmedCategory = category.trim().toUpperCase();
    
    if (!trimmedCategory) {
      toast.error("Categoría inválida", {
        description: "La categoría no puede estar vacía.",
      });
      return;
    }
    
    if (categories.includes(trimmedCategory)) {
      toast.error("Categoría duplicada", {
        description: `La categoría "${trimmedCategory}" ya existe.`,
      });
      return;
    }
    
    setCategories(prev => [...prev, trimmedCategory]);
    toast.success("Categoría añadida", {
      description: `La categoría "${trimmedCategory}" ha sido añadida.`,
    });
  };

  // Product functions
  const uploadProductsFromJSON = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const jsonData = JSON.parse(text);
          
          // Handle both array and object formats
          const productsArray = Array.isArray(jsonData) ? jsonData : [jsonData];
          
          if (productsArray.length === 0) {
            toast.error("JSON vacío", {
              description: "El archivo no contiene datos de productos.",
            });
            reject(new Error("Empty JSON"));
            return;
          }
          
          const newProducts: Product[] = [];
          const newCategories: string[] = [];
          
          for (const item of productsArray) {
            // Support for the specific JSON format provided
            const name = item.Nombre || item.name || '';
            const stock = parseInt(item.Cantidad || item.stock || 0, 10);
            const cost = parseFloat(item.Costo || item.cost || 0);
            const price = parseFloat(item.Precio || item.price || 0);
            const min_stock = parseInt(item["Cantidad Mínima"] || item.min_stock || 5, 10);
            const category = (item.Categoría || item.category || 'Sin categoría').toUpperCase();
            
            // Add new categories
            if (category && !categories.includes(category) && !newCategories.includes(category)) {
              newCategories.push(category);
            }
            
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
                stock,
                category,
                min_stock,
                sales_count: item.sales_count || 0,
                unit: item.Unidad || item.unit || 'UNIDAD',
                key: item.Clave || item.key || '',
                additional_info: item["Información Adicional"] || item.additional_info || '',
                additional_prices: item["Precios Adicionales"] || item.additional_prices || ''
              });
            }
          }
          
          if (newProducts.length > 0) {
            // Add new categories first
            if (newCategories.length > 0) {
              setCategories(prev => [...prev, ...newCategories]);
              toast.success(`${newCategories.length} categorías nuevas`, {
                description: `Se han añadido ${newCategories.length} nuevas categorías.`,
              });
            }
            
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

  const addProduct = (product: Omit<Product, 'id' | 'sales_count'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      sales_count: 0
    };
    
    setProducts(prev => [...prev, newProduct]);
    
    // Add category if it doesn't exist
    if (newProduct.category && !categories.includes(newProduct.category)) {
      setCategories(prev => [...prev, newProduct.category]);
    }
    
    toast.success("Producto añadido", {
      description: `${newProduct.name} se ha añadido al inventario.`,
    });
  };
  
  const updateProductStock = (productId: string, newStock: number) => {
    if (newStock < 0) {
      toast.error("Stock inválido", {
        description: "El stock no puede ser negativo.",
      });
      return;
    }
    
    setProducts(prev => 
      prev.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            stock: newStock
          };
        }
        return product;
      })
    );
    
    toast.success("Stock actualizado", {
      description: "El stock del producto ha sido actualizado.",
    });
  };
  
  const exportProductsToJSON = () => {
    if (products.length === 0) {
      toast.error("No hay productos", {
        description: "No hay productos para exportar.",
      });
      return;
    }
    
    // Convert products to the requested format
    const formattedProducts = products.map(product => ({
      "Clave": product.key || "",
      "Unidad": product.unit || "UNIDAD",
      "Nombre": product.name,
      "Cantidad": product.stock,
      "Costo": product.cost,
      "Precio": product.price,
      "Cantidad Mínima": product.min_stock,
      "Precios Adicionales": product.additional_prices || "",
      "Información Adicional": product.additional_info || "",
      "Categoría": product.category,
      "Costo Promedio": product.cost
    }));
    
    const dataStr = JSON.stringify(formattedProducts, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `inventario_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Inventario exportado", {
      description: "El inventario ha sido exportado como archivo JSON.",
    });
  };
  
  const getProductCategories = () => {
    return categories;
  };
  
  const getLowStockProducts = () => {
    return products.filter(product => product.stock <= product.min_stock);
  };
  
  const getTopSellingProducts = (limit = 10) => {
    return [...products]
      .sort((a, b) => b.sales_count - a.sales_count)
      .slice(0, limit);
  };

  // Cart functions
  const addToCart = (product: Product, quantity: number) => {
    // We now support decimal quantities, but they must be positive
    if (quantity <= 0) {
      toast.error("Cantidad inválida", {
        description: `La cantidad debe ser mayor que cero.`,
      });
      return;
    }
    
    // Check if there's enough stock - handle decimal comparisons correctly
    if (quantity > product.stock) {
      toast.error("Stock insuficiente", {
        description: `Solo hay ${product.stock} unidades disponibles de ${product.name}.`,
      });
      return;
    }
    
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        // Check if total quantity exceeds stock
        const totalQuantity = parseFloat((existingItem.quantity + quantity).toFixed(2));
        if (totalQuantity > product.stock) {
          toast.error("Stock insuficiente", {
            description: `No hay suficiente stock disponible. Stock actual: ${product.stock}, En carrito: ${existingItem.quantity}.`,
          });
          return prev;
        }
        
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: totalQuantity } 
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
    // Support for decimal quantities
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    // Find product to check stock
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      toast.error("Stock insuficiente", {
        description: `Solo hay ${product.stock} unidades disponibles.`,
      });
      return;
    }
    
    setCart(prev => 
      prev.map(item => 
        item.id === productId ? { ...item, quantity: parseFloat(quantity.toFixed(2)) } : item
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
          // Calculate new credit after payment
          const newCredit = customer.current_credit - amountInUSD;
          let message = `Se registró un pago de ${currency === 'BS' ? 'Bs.' : '$'}${amount} para ${customer.name}.`;
          
          // If payment is greater than debt, handle the excess as a credit
          if (newCredit < 0) {
            message += ` El excedente de ${currency === 'BS' ? 'Bs.' : '$'}${Math.abs(newCredit * (currency === 'BS' ? exchangeRate : 1)).toFixed(2)} queda como crédito a favor.`;
          }
          
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
            description: message,
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

  // Calculation functions - adjusted for decimal quantities
  const calculateSubtotalBS = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity * exchangeRate;
      return total + parseFloat(itemTotal.toFixed(2));
    }, 0);
  };

  const calculateSubtotalUSD = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      return total + parseFloat(itemTotal.toFixed(2));
    }, 0);
  };
  
  const calculateChange = (amountPaid: number, currency: 'BS' | 'USD') => {
    const totalUSD = calculateSubtotalUSD();
    let changeUSD = 0;
    
    if (currency === 'USD') {
      changeUSD = amountPaid - totalUSD;
    } else {
      // Convert BS to USD
      changeUSD = (amountPaid / exchangeRate) - totalUSD;
    }
    
    return {
      change_usd: Math.max(0, changeUSD),
      change_bs: Math.max(0, changeUSD * exchangeRate)
    };
  };

  // Purchase completion - adjusted for decimal quantities
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
    
    // Update product stock and sales count - now handle decimal quantities
    setProducts(prev => 
      prev.map(product => {
        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem) {
          return {
            ...product,
            stock: parseFloat((Math.max(0, product.stock - cartItem.quantity)).toFixed(2)),
            sales_count: parseFloat((product.sales_count + cartItem.quantity).toFixed(2))
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
    updateProductStock,
    exportProductsToJSON,
    getProductCategories,
    getLowStockProducts,
    getTopSellingProducts,
    addCategory,
    
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
    
    categories,
    setCategories,
    
    exchangeRate,
    setExchangeRate,
    lastExchangeRateUpdate,
    
    calculateSubtotalBS,
    calculateSubtotalUSD,
    calculateChange,
    
    completePurchase,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};

