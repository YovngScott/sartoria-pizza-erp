import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, Mail, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { registrarLogin } from '@/lib/auditUsuario';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password || (!isLogin && !nombre)) {
      toast.error('Completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // INICIAR SESIÓN
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          await registrarLogin({ email: data.user.email });
          toast.success('Bienvenido de nuevo');
          onLogin(); // ESTO CAMBIA LA PANTALLA EN ADMIN.TSX
        }
      } else {
        // REGISTRARSE
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nombre: nombre.trim(),
            },
          },
        });
        if (error) throw error;
        toast.success('Cuenta creada. Si fuiste autorizado, ya puedes entrar.');
        setIsLogin(true); // Volver al login tras registrarse
      }
    } catch (error: any) {
      toast.error(error.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-3xl border border-[#D4AF37]/20 bg-card p-8 shadow-2xl"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10"
          >
            {isLogin ? (
              <Lock className="h-8 w-8 text-[#D4AF37]" />
            ) : (
              <UserPlus className="h-8 w-8 text-[#D4AF37]" />
            )}
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-white">
            Sartoria <span className="text-[#D4AF37]">Pizza</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin ? 'Panel de Administración' : 'Crear nueva cuenta de Admin'}
          </p>
        </div>

        <div className="flex rounded-xl bg-secondary p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              isLogin ? 'bg-[#D4AF37] text-black' : 'text-white hover:bg-white/5'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              !isLogin ? 'bg-[#D4AF37] text-black' : 'text-white hover:bg-white/5'
            }`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Nombre Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary py-3 pl-4 pr-4 text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    placeholder="Ej: Juan Perez"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary py-3 pl-12 pr-4 text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                placeholder="admin@sartoria.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary py-3 pl-12 pr-4 text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-4 text-sm font-bold text-black transition-all hover:bg-[#B8962E] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </>
            )}
          </button>
        </form>

        {isLogin && (
          <p className="text-center text-xs text-muted-foreground">
            ¿No tienes cuenta? Si fuiste autorizado, selecciona "Registrarse" arriba.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default AdminLogin;
