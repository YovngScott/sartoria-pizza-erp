// ========================================== //
// --- IMPORTACIONES ---
// ========================================== //

// Importa 'useState' de react para gestionar el estado local del componente.
// ¿Por qué?: Permite controlar los campos del formulario, el estado de carga y el modo (Login/Registro).
import { useState } from 'react';

// Importa 'motion' y 'AnimatePresence' de framer-motion para animaciones avanzadas.
// ¿Por qué?: Mejora la interfaz con transiciones suaves entre los modos de login y registro.
import { motion, AnimatePresence } from 'framer-motion';

// Importa iconos de 'lucide-react' para enriquecer visualmente la interfaz de usuario.
// ¿Por qué?: Proporciona pistas visuales claras sobre la función de cada campo y botón.
import { Loader2, Lock, Mail, UserPlus, LogIn } from 'lucide-react';

// Importa el cliente de Supabase para interactuar con los servicios de autenticación y base de datos.
// ¿Por qué?: Es la herramienta principal para gestionar usuarios y sesiones.
import { supabase } from '@/integrations/supabase/client';

// Importa 'toast' de sonner para mostrar notificaciones flotantes al usuario.
// ¿Por qué?: Informa sobre el éxito o error de las operaciones de autenticación.
import { toast } from 'sonner';

// Importa la función 'registrarLogin' del módulo de auditoría.
// ¿Por qué?: Registra cada inicio de sesión exitoso en el sistema de auditoría.
import { registrarLogin } from '@/lib/auditUsuario';

// ========================================== //
// --- TIPOS / INTERFACES ---
// ========================================== //

// Define las propiedades que acepta el componente 'AdminLogin'.
// ¿Por qué?: Asegura que el componente reciba la función 'onLogin' para notificar el éxito al padre.
interface AdminLoginProps {
  onLogin: () => void;
}

// ========================================== //
// --- COMPONENTE PRINCIPAL ---
// ========================================== //

// Componente encargado de renderizar y gestionar el formulario de acceso a administración.
const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  // --- ESTADOS LOCALES ---

  // Determina si el usuario está en modo Login (true) o Registro (false).
  // ¿Por qué?: Permite alternar dinámicamente entre los dos formularios.
  const [isLogin, setIsLogin] = useState(true);

  // Almacena el correo electrónico ingresado por el usuario.
  // ¿Por qué?: Necesario para los procesos de inicio de sesión y registro.
  const [email, setEmail] = useState('');

  // Almacena la contraseña ingresada por el usuario.
  // ¿Por qué?: Dato sensible requerido para la autenticación en Supabase.
  const [password, setPassword] = useState('');

  // Almacena el nombre completo del usuario (solo en modo registro).
  // ¿Por qué?: Se guarda en los metadatos del usuario para su identificación personal.
  const [nombre, setNombre] = useState('');

  // Indica si hay una operación asíncrona en curso.
  // ¿Por qué?: Deshabilita botones y muestra spinners para evitar múltiples envíos.
  const [loading, setLoading] = useState(false);

  // --- MANEJADORES DE EVENTOS ---

  // Función asíncrona que gestiona el envío del formulario de autenticación.
  // ¿Por qué?: Centraliza la lógica de login y registro de Supabase.
  const handleAuth = async (event: React.FormEvent) => {
    // Evita el comportamiento por defecto del formulario (recargar página).
    event.preventDefault();

    // Validación básica de campos requeridos.
    // ¿Por qué?: Asegura que no se envíen datos incompletos a la API.
    if (!email || !password || (!isLogin && !nombre)) {
      toast.error('Completa todos los campos');
      return;
    }

    // Inicia el estado de carga visual.
    setLoading(true);

    try {
      if (isLogin) {
        // --- PROCESO DE INICIO DE SESIÓN ---
        // Llama a Supabase para autenticar al usuario con email y contraseña.
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(), // Elimina espacios accidentales.
          password,
        });
        
        // Si hay un error devuelto por Supabase, lo lanza para capturarlo en el catch.
        if (error) throw error;
        
        // Si el usuario se autentica correctamente.
        if (data.user) {
          // Registra el evento en la tabla de auditoría.
          await registrarLogin({ email: data.user.email });
          // Notifica éxito al usuario.
          toast.success('Bienvenido de nuevo');
          // Ejecuta la función callback para cambiar la vista en el componente padre.
          onLogin(); 
        }
      } else {
        // --- PROCESO DE REGISTRO ---
        // Crea un nuevo usuario en Supabase con metadatos adicionales.
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nombre: nombre.trim(), // Guarda el nombre en 'user_metadata'.
            },
          },
        });
        // Lanza error si el registro falla.
        if (error) throw error;
        // Informa al usuario sobre el registro exitoso.
        toast.success('Cuenta creada. Si fuiste autorizado, ya puedes entrar.');
        // Cambia automáticamente al modo login tras un registro exitoso.
        setIsLogin(true); 
      }
    } catch (error: any) {
      // Muestra un mensaje de error legible al usuario.
      toast.error(error.message || 'Error en la autenticación');
    } finally {
      // Finaliza el estado de carga independientemente del resultado.
      setLoading(false);
    }
  };

  // --- RENDERIZADO ---
  return (
    // Contenedor principal a pantalla completa con fondo oscuro y padding.
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* 
        Tarjeta del formulario con animación de entrada.
        Utiliza motion para aparecer suavemente desde abajo.
      */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-3xl border border-[#D4AF37]/20 bg-card p-8 shadow-2xl"
      >
        {/* Cabecera con logo e icono dinámico según el modo. */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10"
          >
            {/* 
              Muestra un candado si es login, o un icono de usuario+ si es registro.
              ¿Por qué?: Refuerza visualmente el contexto de la acción actual.
            */}
            {isLogin ? (
              <Lock className="h-8 w-8 text-[#D4AF37]" />
            ) : (
              <UserPlus className="h-8 w-8 text-[#D4AF37]" />
            )}
          </motion.div>
          {/* Nombre de la pizzería con estilo elegante. */}
          <h1 className="font-display text-3xl font-bold text-white">
            Sartoria <span className="text-[#D4AF37]">Pizza</span>
          </h1>
          {/* Subtítulo dinámico según el estado 'isLogin'. */}
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin ? 'Panel de Administración' : 'Crear nueva cuenta de Admin'}
          </p>
        </div>

        {/* 
          Selector de modo (Login / Registro).
          Funciona como una pestaña (tab) personalizada.
        */}
        <div className="flex rounded-xl bg-secondary p-1">
          {/* Botón para activar el modo de Entrada (Login). */}
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              isLogin ? 'bg-[#D4AF37] text-black' : 'text-white hover:bg-white/5'
            }`}
          >
            Entrar
          </button>
          {/* Botón para activar el modo de Registro. */}
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              !isLogin ? 'bg-[#D4AF37] text-black' : 'text-white hover:bg-white/5'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Formulario de autenticación. */}
        <form onSubmit={handleAuth} className="space-y-4">
          {/* 
            AnimatePresence permite animar la entrada y salida de elementos.
            Aquí se usa para mostrar/ocultar el campo de nombre.
          */}
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {/* Etiqueta del campo de nombre. */}
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Nombre Completo
                </label>
                <div className="relative">
                  {/* Input de texto para el nombre del nuevo admin. */}
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

          {/* Campo de Correo Electrónico. */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Correo Electrónico
            </label>
            <div className="relative">
              {/* Icono de sobre a la izquierda del input. */}
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

          {/* Campo de Contraseña. */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Contraseña
            </label>
            <div className="relative">
              {/* Icono de candado a la izquierda del input. */}
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

          {/* 
            Botón principal de acción (Entrar o Crear Cuenta).
            Cambia su contenido y estado según el modo y la carga.
          */}
          <button
            type="submit"
            disabled={loading} // Deshabilita mientras carga para prevenir spam.
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-4 text-sm font-bold text-black transition-all hover:bg-[#B8962E] disabled:opacity-50"
          >
            {loading ? (
              /* Muestra un spinner de carga si 'loading' es true. */
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              /* Muestra el icono y texto correspondiente según el modo. */
              <>
                {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </>
            )}
          </button>
        </form>

        {/* Mensaje de ayuda para usuarios que no tienen cuenta. */}
        {isLogin && (
          <p className="text-center text-xs text-muted-foreground">
            ¿No tienes cuenta? Si fuiste autorizado, selecciona "Registrarse" arriba.
          </p>
        )}
      </motion.div>
    </div>
  );
};

// Exporta el componente para ser usado en la gestión de acceso de Admin.tsx.
export default AdminLogin;
