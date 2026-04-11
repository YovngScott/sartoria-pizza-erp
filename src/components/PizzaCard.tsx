import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { pizzaImages } from '@/data/pizzaImages';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useApp } from '@/contexts/CartContext';
import { isStoreOpen } from './Header';
import type { Tables } from '@/integrations/supabase/types';
import { normalizePizzaImageKey } from '@/lib/erp';

type Pizza = Tables<'pizzas'>;

interface Props {
  pizza: Pizza;
  index: number;
}

const PizzaCard = ({ pizza, index }: Props) => {
  const { format } = useCurrency();
  const { addToCart } = useApp();
  const open = isStoreOpen();

  const imgSrc =
    pizza.imagen_url ||
    pizzaImages[normalizePizzaImageKey(pizza)] ||
    '/placeholder.svg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/40"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={imgSrc}
          alt={pizza.nombre}
          loading={index < 4 ? undefined : 'lazy'}
          width={512}
          height={512}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <span className="absolute bottom-3 left-3 font-display text-lg font-semibold text-foreground">
          {format(Number(pizza.precio_venta_publico))}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-foreground">{pizza.nombre}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{pizza.descripcion}</p>

        <button
          onClick={() => open && addToCart(pizza)}
          disabled={!open}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          {open ? 'Añadir al Carrito' : 'No disponible'}
        </button>
      </div>
    </motion.div>
  );
};

export default PizzaCard;
