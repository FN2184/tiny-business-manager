
import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(!isAuthenticated);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simple hardcoded authentication
    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        localStorage.setItem('isAuthenticated', 'true');
        window.location.reload(); // Reload to update auth state
        toast.success('Inicio de sesión exitoso');
      } else {
        toast.error('Credenciales incorrectas', {
          description: 'El usuario o la contraseña son incorrectos.'
        });
      }
      setIsSubmitting(false);
    }, 500);
  };

  if (!isAuthenticated) {
    // Show login dialog instead of redirecting
    return (
      <Dialog open={isLoginDialogOpen} onOpenChange={(open) => {
        setIsLoginDialogOpen(open);
        if (!open) {
          // Redirect to home if dialog is closed
          window.location.href = '/';
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Área Restringida
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleLogin} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Usuario
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su usuario"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                required
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              Usuario por defecto: admin<br />
              Contraseña por defecto: admin
            </p>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsLoginDialogOpen(false);
                  window.location.href = '/';
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Iniciando sesión...' : 'Acceder'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
};

export default PrivateRoute;
