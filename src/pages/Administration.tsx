
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileJson, DollarSign, Upload, PackageOpen, Plus, Tag, 
  Download, BarChart3, AlertTriangle, Edit, Save, X, Boxes
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { useBusinessContext } from '@/context/BusinessContext';
import PageTransition from '@/components/layout/PageTransition';
import Card from '@/components/ui-custom/Card';
import SearchInput from '@/components/ui-custom/SearchInput';
import PrivateRoute from '@/components/auth/PrivateRoute';

// Form schema for exchange rate
const exchangeRateSchema = z.object({
  rate: z.string()
    .min(1, { message: "La tasa de cambio es requerida" })
    .refine(
      val => !isNaN(parseFloat(val.replace(',', '.'))) && parseFloat(val.replace(',', '.')) > 0,
      { message: "Ingrese un número válido mayor que cero" }
    )
});

// Form schema for new product
const productSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  cost: z.string()
    .refine(
      val => !isNaN(parseFloat(val.replace(',', '.'))),
      { message: "Ingrese un número válido" }
    ),
  profit_percentage: z.string()
    .refine(
      val => !isNaN(parseFloat(val.replace(',', '.'))),
      { message: "Ingrese un número válido" }
    ),
  stock: z.string()
    .refine(
      val => !isNaN(parseInt(val, 10)),
      { message: "Ingrese un número entero válido" }
    ),
  category: z.string().min(1, { message: "La categoría es requerida" }),
  min_stock: z.string()
    .refine(
      val => !isNaN(parseInt(val, 10)),
      { message: "Ingrese un número entero válido" }
    ),
});

const Administration = () => {
  // Business context
  const { 
    uploadProductsFromJSON, 
    setExchangeRate, 
    exchangeRate, 
    lastExchangeRateUpdate,
    addProduct,
    products,
    updateProductStock,
    exportProductsToJSON,
    getProductCategories,
    getLowStockProducts,
    getTopSellingProducts
  } = useBusinessContext();
  
  // Local state
  const [isUploading, setIsUploading] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [activeTab, setActiveTab] = useState('general');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<{[key: string]: string}>({});
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newCategory, setNewCategory] = useState('');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  
  // Form for exchange rate
  const exchangeRateForm = useForm<z.infer<typeof exchangeRateSchema>>({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues: {
      rate: exchangeRate.toString(),
    },
  });
  
  // Form for new product
  const newProductForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      cost: '0',
      profit_percentage: '30',
      stock: '0',
      category: 'Sin categoría',
      min_stock: '5',
    },
  });
  
  // Update filtered products when search term, selected category, or products change
  useEffect(() => {
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
  
  // Update product categories
  useEffect(() => {
    setProductCategories(getProductCategories());
  }, [products, getProductCategories]);
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  // Handle add new category
  const handleAddCategory = () => {
    if (newCategory.trim() === '') {
      toast.error("Categoría vacía", {
        description: "Por favor ingrese un nombre para la categoría.",
      });
      return;
    }
    
    if (productCategories.includes(newCategory.trim())) {
      toast.error("Categoría duplicada", {
        description: "Esta categoría ya existe.",
      });
      return;
    }
    
    setProductCategories(prev => [...prev, newCategory.trim()]);
    setSelectedCategory(newCategory.trim());
    setNewCategory('');
    setIsAddCategoryOpen(false);
    
    toast.success("Categoría añadida", {
      description: `La categoría "${newCategory.trim()}" ha sido añadida.`,
    });
  };
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is JSON
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      toast.error("Formato de archivo incorrecto", {
        description: "Por favor seleccione un archivo JSON válido.",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      await uploadProductsFromJSON(file);
      toast.success("Productos importados", {
        description: "Los productos se han importado correctamente.",
      });
    } catch (error) {
      console.error("Error uploading products:", error);
      toast.error("Error al importar productos", {
        description: "Ocurrió un error al procesar el archivo.",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };
  
  // Handle exchange rate update
  const onExchangeRateSubmit = (data: z.infer<typeof exchangeRateSchema>) => {
    const newRate = parseFloat(data.rate.replace(',', '.'));
    setExchangeRate(newRate);
    
    toast.success("Tasa de cambio actualizada", {
      description: `La tasa de cambio se ha actualizado a ${newRate}.`,
    });
  };
  
  // Handle new product submission
  const onNewProductSubmit = (data: z.infer<typeof productSchema>) => {
    const cost = parseFloat(data.cost.replace(',', '.'));
    const profitPercentage = parseFloat(data.profit_percentage.replace(',', '.'));
    const price = cost * (1 + (profitPercentage / 100));
    const stock = parseInt(data.stock, 10);
    const min_stock = parseInt(data.min_stock, 10);
    
    addProduct({
      name: data.name,
      cost,
      price,
      profit_percentage: profitPercentage,
      profit_margin: price - cost,
      stock,
      category: data.category,
      min_stock
    });
    
    setIsAddProductOpen(false);
    newProductForm.reset({
      name: '',
      cost: '0',
      profit_percentage: '30',
      stock: '0',
      category: 'Sin categoría',
      min_stock: '5',
    });
  };
  
  // Handle stock update
  const handleStockUpdate = (productId: string) => {
    if (!editStock[productId]) {
      toast.error("Valor inválido", {
        description: "Por favor ingrese un valor válido para el stock.",
      });
      return;
    }
    
    const newStock = parseInt(editStock[productId], 10);
    
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Valor inválido", {
        description: "El stock debe ser un número entero mayor o igual a cero.",
      });
      return;
    }
    
    updateProductStock(productId, newStock);
    setEditingProductId(null);
    setEditStock(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };
  
  // Start editing stock
  const startEditingStock = (product: typeof products[0]) => {
    setEditingProductId(product.id);
    setEditStock(prev => ({
      ...prev,
      [product.id]: product.stock.toString()
    }));
  };
  
  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  // Get stock status class
  const getStockStatusClass = (product: typeof products[0]) => {
    if (product.stock <= 0) return 'text-destructive';
    if (product.stock <= product.min_stock) return 'text-amber-500';
    return 'text-emerald-500';
  };
  
  return (
    <PrivateRoute>
      <PageTransition>
        <div className="min-h-screen pt-20 pb-8 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold mb-2">Administración</h1>
              <p className="text-muted-foreground">
                Gestione la tasa de cambio, inventario y otros aspectos administrativos.
              </p>
            </motion.div>
            
            <Tabs 
              defaultValue="general" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full mb-8"
            >
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="inventory">Inventario</TabsTrigger>
                <TabsTrigger value="alerts">
                  <div className="flex items-center">
                    Alertas
                    {getLowStockProducts().length > 0 && (
                      <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                        {getLowStockProducts().length}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="reports">Informes</TabsTrigger>
              </TabsList>
              
              {/* General Tab */}
              <TabsContent value="general">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Exchange Rate */}
                  <Card>
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-xl font-semibold">Tasa de Cambio</h2>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Actualizar tasa de cambio USD/BS</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Última actualización: {formatDate(lastExchangeRateUpdate)}</p>
                    </div>
                    
                    <Form {...exchangeRateForm}>
                      <form onSubmit={exchangeRateForm.handleSubmit(onExchangeRateSubmit)} className="space-y-4">
                        <FormField
                          control={exchangeRateForm.control}
                          name="rate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tasa actual: 1 USD = BS</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ej. 35.50" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="w-full">
                          Actualizar Tasa
                        </Button>
                      </form>
                    </Form>
                  </Card>
                  
                  {/* Product Import */}
                  <Card>
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-xl font-semibold">Importar Productos</h2>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <FileJson className="h-5 w-5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Importar productos desde archivo JSON</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Suba un archivo JSON con productos para importarlos al inventario.</p>
                      <p className="mt-1">
                        Formato esperado: array de objetos con campos name, price, cost, stock, category y min_stock.
                      </p>
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-center mb-1">Arrastre un archivo JSON o haga clic para seleccionar</p>
                          <p className="text-xs text-muted-foreground text-center">
                            Solo archivos JSON
                          </p>
                          <input
                            id="file-upload"
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />
                        </div>
                      </label>
                      
                      {isUploading && (
                        <div className="mt-4 text-center">
                          <p className="text-sm">Procesando archivo...</p>
                        </div>
                      )}
                    </div>
                  </Card>
                  
                  {/* Add Product */}
                  <Card>
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-xl font-semibold">Agregar Producto</h2>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PackageOpen className="h-5 w-5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Agregar nuevo producto al inventario</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Agregue un nuevo producto al inventario manualmente.</p>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => setIsAddProductOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </Card>
                  
                  {/* Export Products */}
                  <Card>
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-xl font-semibold">Exportar Inventario</h2>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Download className="h-5 w-5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Exportar inventario a archivo JSON</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Exporte su inventario actual a un archivo JSON.</p>
                      <p className="mt-1">
                        Este archivo puede ser utilizado como respaldo o para importar en otra instalación.
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={exportProductsToJSON}
                      disabled={products.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar a JSON
                    </Button>
                  </Card>
                  
                  {/* Manage Categories */}
                  <Card>
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-xl font-semibold">Categorías</h2>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Tag className="h-5 w-5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gestionar categorías de productos</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Gestione las categorías para organizar sus productos.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {productCategories.map(category => (
                          <div 
                            key={category} 
                            className="px-3 py-1 rounded-full bg-muted text-sm flex items-center"
                          >
                            {category}
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsAddCategoryOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Categoría
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Inventory Tab */}
              <TabsContent value="inventory">
                <Card>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h2 className="text-xl font-semibold">Gestión de Inventario</h2>
                    
                    <div className="flex items-center space-x-2">
                      <Select 
                        value={selectedCategory} 
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filtrar por categoría" />
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
                      
                      <SearchInput 
                        placeholder="Buscar productos..." 
                        onSearch={handleSearch}
                        className="w-full sm:w-auto"
                      />
                    </div>
                  </div>
                  
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Boxes className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">
                        No se encontraron productos
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Intente con diferentes términos de búsqueda o agregue productos nuevos
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Costo</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Stock Min</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map(product => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${product.cost.toFixed(2)}</TableCell>
                              <TableCell className={`text-right font-medium ${getStockStatusClass(product)}`}>
                                {editingProductId === product.id ? (
                                  <Input 
                                    value={editStock[product.id] || ''}
                                    onChange={(e) => setEditStock({
                                      ...editStock,
                                      [product.id]: e.target.value
                                    })}
                                    className="w-20 h-8 text-right inline-block"
                                  />
                                ) : (
                                  product.stock
                                )}
                              </TableCell>
                              <TableCell className="text-right">{product.min_stock}</TableCell>
                              <TableCell className="text-right">
                                {editingProductId === product.id ? (
                                  <div className="flex justify-end space-x-1">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleStockUpdate(product.id)}
                                    >
                                      <Save className="h-4 w-4 text-emerald-500" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => setEditingProductId(null)}
                                    >
                                      <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => startEditingStock(product)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              {/* Alerts Tab */}
              <TabsContent value="alerts">
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Alertas de Inventario</h2>
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Productos con stock por debajo del mínimo establecido.
                    </p>
                  </div>
                  
                  {getLowStockProducts().length === 0 ? (
                    <div className="text-center py-12 border rounded-md">
                      <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                        <Boxes className="h-6 w-6 text-emerald-500" />
                      </div>
                      <p className="text-muted-foreground">
                        No hay productos con stock bajo
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Todos los productos tienen stock suficiente
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Stock Actual</TableHead>
                            <TableHead className="text-right">Stock Mínimo</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getLowStockProducts().map(product => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell className={`text-right font-medium ${getStockStatusClass(product)}`}>
                                {editingProductId === product.id ? (
                                  <Input 
                                    value={editStock[product.id] || ''}
                                    onChange={(e) => setEditStock({
                                      ...editStock,
                                      [product.id]: e.target.value
                                    })}
                                    className="w-20 h-8 text-right inline-block"
                                  />
                                ) : (
                                  product.stock
                                )}
                              </TableCell>
                              <TableCell className="text-right">{product.min_stock}</TableCell>
                              <TableCell className="text-right">
                                {editingProductId === product.id ? (
                                  <div className="flex justify-end space-x-1">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleStockUpdate(product.id)}
                                    >
                                      <Save className="h-4 w-4 text-emerald-500" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => setEditingProductId(null)}
                                    >
                                      <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => startEditingStock(product)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              </TabsContent>
              
              {/* Reports Tab */}
              <TabsContent value="reports">
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Productos Más Vendidos</h2>
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Los productos con mayor número de ventas.
                    </p>
                  </div>
                  
                  {products.length === 0 ? (
                    <div className="text-center py-12 border rounded-md">
                      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">
                        No hay datos de ventas disponibles
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Realice algunas ventas para generar informes
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Unidades Vendidas</TableHead>
                            <TableHead className="text-right">Stock Actual</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getTopSellingProducts(10).map(product => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium">
                                {product.sales_count}
                              </TableCell>
                              <TableCell className={`text-right ${getStockStatusClass(product)}`}>
                                {product.stock}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Add Product Dialog */}
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Producto</DialogTitle>
            </DialogHeader>
            
            <Form {...newProductForm}>
              <form onSubmit={newProductForm.handleSubmit(onNewProductSubmit)} className="space-y-4 py-4">
                <FormField
                  control={newProductForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Producto</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej. Camisa de Algodón" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newProductForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newProductForm.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo (USD)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej. 10.50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newProductForm.control}
                  name="profit_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porcentaje de Ganancia (%)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej. 30" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newProductForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Inicial</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej. 50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newProductForm.control}
                  name="min_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej. 5" />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Se generarán alertas cuando el stock sea menor o igual a este valor.
                      </p>
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-4">
                  <Button variant="outline" type="button" onClick={() => setIsAddProductOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Agregar Producto
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Add Category Dialog */}
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Categoría</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <FormLabel>Nombre de la Categoría</FormLabel>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ej. Bebidas, Alimentos, Ropa"
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddCategory}>
                  Agregar Categoría
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </PrivateRoute>
  );
};

export default Administration;

