
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, DollarSign, Package, BarChart3,
  Save, AlertTriangle, FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import Card from '@/components/ui-custom/Card';

const Administration = () => {
  const { 
    exchangeRate, 
    setExchangeRate, 
    lastExchangeRateUpdate,
    uploadProductsFromCSV,
    addProduct
  } = useBusinessContext();
  
  // Local state
  const [newExchangeRate, setNewExchangeRate] = useState(exchangeRate.toString());
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    cost: '',
    profit_percentage: '',
    stock: ''
  });
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Handle exchange rate update
  const handleExchangeRateUpdate = () => {
    const rate = parseFloat(newExchangeRate.replace(',', '.'));
    
    if (isNaN(rate) || rate <= 0) {
      toast.error("Tasa inválida", {
        description: "Ingrese un valor numérico mayor que cero.",
      });
      return;
    }
    
    setExchangeRate(rate);
    toast.success("Tasa actualizada", {
      description: `La tasa de cambio se ha actualizado a ${rate} Bs/$`,
    });
  };
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error("Formato inválido", {
        description: "Solo se permiten archivos CSV.",
      });
      return;
    }
    
    try {
      await uploadProductsFromCSV(file);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
    }
  };
  
  // Handle add product
  const handleAddProduct = () => {
    // Validate required fields
    if (!newProduct.name.trim() || !newProduct.price) {
      toast.error("Campos requeridos", {
        description: "Nombre y precio son campos obligatorios.",
      });
      return;
    }
    
    // Parse numeric values
    const price = parseFloat(newProduct.price.replace(',', '.'));
    const cost = parseFloat(newProduct.cost.replace(',', '.') || '0');
    const stock = parseInt(newProduct.stock || '0', 10);
    
    if (isNaN(price) || price <= 0) {
      toast.error("Precio inválido", {
        description: "Ingrese un precio válido mayor que cero.",
      });
      return;
    }
    
    if (newProduct.cost && (isNaN(cost) || cost < 0)) {
      toast.error("Costo inválido", {
        description: "Ingrese un costo válido mayor o igual a cero.",
      });
      return;
    }
    
    if (newProduct.stock && (isNaN(stock) || stock < 0)) {
      toast.error("Stock inválido", {
        description: "Ingrese un stock válido mayor o igual a cero.",
      });
      return;
    }
    
    // Calculate profit percentage and margin
    const profit_percentage = cost > 0 ? ((price - cost) / cost) * 100 : 0;
    const profit_margin = price - cost;
    
    // Add product
    addProduct({
      name: newProduct.name.trim(),
      price,
      cost,
      profit_percentage,
      profit_margin,
      stock
    });
    
    // Reset form and close dialog
    setNewProduct({
      name: '',
      price: '',
      cost: '',
      profit_percentage: '',
      stock: ''
    });
    
    setIsAddProductDialogOpen(false);
  };
  
  // Handle cost or price change to calculate profit
  const handlePriceOrCostChange = (field: 'price' | 'cost', value: string) => {
    const newProductData = { ...newProduct };
    newProductData[field] = value;
    
    // Calculate profit percentage if both price and cost are valid
    const price = parseFloat(newProductData.price.replace(',', '.') || '0');
    const cost = parseFloat(newProductData.cost.replace(',', '.') || '0');
    
    if (!isNaN(price) && !isNaN(cost) && cost > 0) {
      const profitPercentage = ((price - cost) / cost) * 100;
      newProductData.profit_percentage = profitPercentage.toFixed(2);
    } else {
      newProductData.profit_percentage = '';
    }
    
    setNewProduct(newProductData);
  };
  
  // Handle profit percentage change to calculate price
  const handleProfitPercentageChange = (value: string) => {
    const newProductData = { ...newProduct };
    newProductData.profit_percentage = value;
    
    // Calculate price if both percentage and cost are valid
    const percentage = parseFloat(value.replace(',', '.') || '0');
    const cost = parseFloat(newProductData.cost.replace(',', '.') || '0');
    
    if (!isNaN(percentage) && !isNaN(cost) && cost > 0) {
      const price = cost * (1 + percentage / 100);
      newProductData.price = price.toFixed(2);
    }
    
    setNewProduct(newProductData);
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
              <h1 className="text-3xl font-bold mb-2">Administración</h1>
              <p className="text-muted-foreground">
                Configuración de tasa de cambio, inventario y reportes.
              </p>
            </motion.div>
          </div>
          
          <Tabs defaultValue="exchange-rate" className="w-full">
            <TabsList className="grid grid-cols-3 max-w-lg">
              <TabsTrigger value="exchange-rate">
                <DollarSign className="h-4 w-4 mr-2" />
                Tasa de Cambio
              </TabsTrigger>
              <TabsTrigger value="inventory">
                <Package className="h-4 w-4 mr-2" />
                Inventario
              </TabsTrigger>
              <TabsTrigger value="reports">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reportes
              </TabsTrigger>
            </TabsList>
            
            {/* Exchange Rate Tab */}
            <TabsContent value="exchange-rate" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h2 className="text-xl font-semibold mb-4">Tasa de Cambio Actual</h2>
                  
                  <div className="mb-6 p-4 bg-muted/40 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Tasa actual</p>
                        <p className="text-2xl font-semibold">{exchangeRate} Bs/$</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Última actualización</p>
                        <p className="text-sm">{formatDate(lastExchangeRateUpdate)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="exchange-rate">Nueva tasa de cambio (Bs/$)</Label>
                      <Input
                        id="exchange-rate"
                        type="text"
                        value={newExchangeRate}
                        onChange={(e) => setNewExchangeRate(e.target.value)}
                        placeholder="Ingrese la nueva tasa de cambio"
                      />
                    </div>
                    
                    <Button onClick={handleExchangeRateUpdate} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Actualizar Tasa
                    </Button>
                    
                    {lastExchangeRateUpdate && (
                      <div className="text-sm text-muted-foreground mt-4">
                        <p>
                          Es recomendable actualizar la tasa de cambio diariamente para mantener
                          precios precisos.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
                
                <Card>
                  <h2 className="text-xl font-semibold mb-4">Recordatorios</h2>
                  
                  {lastExchangeRateUpdate && new Date().getDate() !== new Date(lastExchangeRateUpdate).getDate() ? (
                    <div className="flex p-4 mb-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">
                          Actualización Pendiente
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          La tasa de cambio no ha sido actualizada hoy. Considere actualizarla para
                          mantener precios precisos.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex p-4 mb-4 border border-green-200 bg-green-50 rounded-lg">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-green-800">
                          Tasa de Cambio Actualizada
                        </h3>
                        <p className="text-sm text-green-700 mt-1">
                          La tasa de cambio está actualizada para hoy.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Ajustes de Recordatorios</h3>
                    <p className="text-sm text-muted-foreground">
                      El sistema mostrará recordatorios cuando:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc ml-5 space-y-1">
                      <li>La tasa de cambio no se actualice en un día</li>
                      <li>El inventario de productos esté bajo</li>
                      <li>Haya clientes que excedan su límite de crédito</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            {/* Inventory Tab */}
            <TabsContent value="inventory" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h2 className="text-xl font-semibold mb-4">Cargar Inventario</h2>
                  
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Cargue un archivo CSV con su inventario. El archivo debe contener columnas para 
                      nombre, precio, costo y stock.
                    </p>
                    
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
                      <p className="text-sm font-medium mb-2">
                        Arrastre su archivo CSV o
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Seleccionar Archivo
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Solo archivos CSV (.csv)
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="text-sm text-muted-foreground">
                    <h3 className="font-medium text-foreground mb-2">
                      Formato del Archivo CSV
                    </h3>
                    <p className="mb-2">
                      El archivo debe contener las siguientes columnas:
                    </p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Nombre del producto</li>
                      <li>Precio de venta</li>
                      <li>Costo (opcional)</li>
                      <li>Stock (opcional)</li>
                    </ul>
                    <p className="mt-3">
                      La primera fila debe contener los nombres de las columnas.
                    </p>
                  </div>
                </Card>
                
                <Card>
                  <h2 className="text-xl font-semibold mb-4">Agregar Producto</h2>
                  
                  <p className="text-sm text-muted-foreground mb-6">
                    Agregue un nuevo producto al inventario manualmente.
                  </p>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => setIsAddProductDialogOpen(true)}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Agregar Nuevo Producto
                  </Button>
                  
                  <Separator className="my-6" />
                  
                  <div className="text-sm text-muted-foreground">
                    <h3 className="font-medium text-foreground mb-2">
                      Tips para Gestión de Inventario
                    </h3>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Actualice el inventario regularmente para mantener datos precisos</li>
                      <li>Establezca precios basados en costos y margen de ganancia deseado</li>
                      <li>Monitoree los productos con bajo stock para reabastecerlos a tiempo</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            {/* Reports Tab */}
            <TabsContent value="reports" className="mt-6">
              <Card>
                <h2 className="text-xl font-semibold mb-4">Reportes</h2>
                
                <p className="text-muted-foreground mb-6">
                  Esta sección le permitirá generar y visualizar reportes sobre su negocio.
                </p>
                
                <div className="bg-muted/30 p-6 rounded-lg text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-2">Próximamente</h3>
                  <p className="text-sm text-muted-foreground">
                    La funcionalidad de reportes estará disponible en una próxima actualización.
                  </p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Add Product Dialog */}
      <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Producto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nombre del Producto *</Label>
              <Input
                id="product-name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Ingrese el nombre del producto"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-price">Precio (USD) *</Label>
                <Input
                  id="product-price"
                  value={newProduct.price}
                  onChange={(e) => handlePriceOrCostChange('price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-cost">Costo (USD)</Label>
                <Input
                  id="product-cost"
                  value={newProduct.cost}
                  onChange={(e) => handlePriceOrCostChange('cost', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-profit">% Ganancia</Label>
                <Input
                  id="product-profit"
                  value={newProduct.profit_percentage}
                  onChange={(e) => handleProfitPercentageChange(e.target.value)}
                  placeholder="0.00"
                  disabled={!newProduct.cost}
                />
                {!newProduct.cost && (
                  <p className="text-xs text-muted-foreground">
                    Ingrese el costo para calcular
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product-stock">Stock</Label>
                <Input
                  id="product-stock"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddProduct}>
              Guardar Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default Administration;
