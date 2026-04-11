import { ShoppingCart, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Currency } from '@/data/mockData';
import { motion } from 'framer-motion';

const Header = () => {
  const { cart } = useApp();
  const { currency, setCurrency } = useCurrency();
  const location = useLocation();
  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0);
  const isOpen = isStoreOpen();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-display text-2xl font-bold gold-text-gradient">Sartoria della Pizza</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
            <Clock className="h-4 w-4" />
            <span className={isOpen ? 'text-success' : 'text-destructive'}>
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>

          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="DOP">RD$ DOP</option>
            <option value="USD">US$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>

          {location.pathname !== '/cart' && (
            <Link to="/cart" className="relative">
              <motion.div whileTap={{ scale: 0.9 }} className="rounded-full border border-border bg-secondary p-2.5 transition-colors hover:border-primary">
                <ShoppingCart className="h-5 w-5 text-foreground" />
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          )}

          <Link
            to="/admin"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-primary md:block"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
};

export function isStoreOpen(): boolean {
  return true; // siempre abierto (pruebas)
}

export default Header;
