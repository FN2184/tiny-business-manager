
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileJson, DollarSign, Upload, PackageOpen, Plus } from 'lucide-react';
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
import { toast } from 'sonner';
import { useBusinessContext } from '@/context/BusinessContext';
import PageTransition from '@/components/layout/PageTransition';
import Card from '@/components/ui-custom/Card';

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
});

const Administration = () => {
  // Business context
  const { 
    uploadProductsFromJSON, 
    setExchangeRate, 
    exchangeRate, 
    lastExchangeRateUpdate,
    addProduct
  } = useBusinessContext();
  
  // Local state
  const [isUploading, setIsUploading] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  
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
    },
  });
  
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
    
    addProduct({
      name: data.name,
      cost,
      price,
      profit_percentage: profitPercentage,
      profit_margin: price - cost,
      stock,
    });
    
    setIsAddProductOpen(false);
    newProductForm.reset({
      name: '',
      cost: '0',
      profit_percentage: '30',
      stock: '0',
    });
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
  
  return (
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
                  Formato esperado: array de objetos con campos name, price, cost, stock.
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
          </div>
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
    </PageTransition>
  );
};

export default Administration;
