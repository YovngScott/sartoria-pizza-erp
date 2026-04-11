import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const ClosedBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mx-auto mb-8 max-w-2xl rounded-xl border border-primary/30 bg-secondary p-5 text-center"
  >
    <Clock className="mx-auto mb-2 h-8 w-8 text-primary" />
    <h3 className="font-display text-lg font-semibold text-foreground">Cerrado en este momento</h3>
    <p className="mt-1 text-sm text-muted-foreground">
      Volvemos a las 12:00 PM. Nuestro horario es de 12:00 PM a 11:00 PM.
    </p>
  </motion.div>
);

export default ClosedBanner;
