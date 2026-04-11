import { useApp } from '@/contexts/CartContext';
import PizzaCard from '@/components/PizzaCard';
import ClosedBanner from '@/components/ClosedBanner';
import { isStoreOpen } from '@/components/Header';
import { motion } from 'framer-motion';

const Index = () => {
  const open = isStoreOpen();
  const { pizzas, loading } = useApp();

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="font-display text-4xl font-bold gold-text-gradient md:text-5xl">
          Il Nostro Menu
        </h1>
        <p className="mt-3 text-muted-foreground">
          Pizzas artesanales horneadas en horno de leña a 450°C
        </p>
      </motion.div>

      {!open && <ClosedBanner />}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pizzas.map((pizza, i) => (
            <PizzaCard key={pizza.id} pizza={pizza} index={i} />
          ))}
        </div>
      )}
    </main>
  );
};

export default Index;
