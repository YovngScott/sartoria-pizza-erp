
-- Add unique constraint for recetas to enable ON CONFLICT
ALTER TABLE public.recetas ADD CONSTRAINT recetas_pizza_ingrediente_unique UNIQUE (id_pizza, id_ingrediente);

-- Allow admins to insert audit logs from client
CREATE POLICY "Admins can insert audit logs" ON public.auditoria_logs
FOR INSERT TO authenticated
WITH CHECK (is_admin_user());

-- Allow admins to delete pizzas
-- (ALL policy already exists, but let's ensure recetas can be deleted for cleanup)
-- Already covered by "Admins can manage recetas" ALL policy

-- Seed pizzas
INSERT INTO public.pizzas (id, nombre, descripcion, precio_venta_dop, imagen_url) VALUES
('pz-1', 'Margherita Classica', 'San Marzano, mozzarella fior di latte, albahaca fresca y aceite de oliva.', 550, ''),
('pz-2', 'Pizza al Tartufo', 'Crema de trufa negra, mozzarella, parmigiano y aceite trufado.', 1200, ''),
('pz-3', 'Prosciutto e Rúcula', 'Prosciutto di Parma, rúcula, parmigiano y aceite de oliva.', 950, ''),
('pz-4', 'Diavola Picante', 'Pepperoni artesanal, San Marzano, mozzarella y chile calabrés.', 750, ''),
('pz-5', 'Quattro Formaggi', 'Mozzarella, gorgonzola, parmigiano y fontina.', 850, ''),
('pz-6', 'Napolitana DOC', 'Doble San Marzano, mozzarella, anchoas, alcaparras y orégano.', 650, ''),
('pz-7', 'Capricciosa', 'Jamón, alcachofas, champiñones, aceitunas y mozzarella.', 800, ''),
('pz-8', 'Pesto Genovese', 'Pesto de albahaca, tomates cherry, mozzarella y piñones.', 780, ''),
('pz-9', 'Sartoria Especial', 'Prosciutto, trufa, mozzarella, rúcula y reducción balsámica.', 1350, ''),
('pz-10', 'Marinara Tradizionale', 'San Marzano, ajo, orégano y aceite de oliva. Sin queso.', 450, '')
ON CONFLICT (id) DO NOTHING;

-- Seed ingredientes
INSERT INTO public.ingredientes (id, nombre, unidad_medida, costo_unidad_dop, stock_actual, stock_minimo) VALUES
('ing-1', 'Harina 00', 'g', 0.035, 50000, 10000),
('ing-2', 'Mozzarella Fior di Latte', 'g', 0.18, 15000, 5000),
('ing-3', 'Tomate San Marzano', 'g', 0.12, 20000, 5000),
('ing-4', 'Pepperoni Artesanal', 'g', 0.35, 8000, 2000),
('ing-5', 'Prosciutto di Parma', 'g', 0.85, 5000, 1500),
('ing-6', 'Trufa Negra', 'g', 4.50, 500, 200),
('ing-7', 'Aceite de Oliva Extra Virgen', 'ml', 0.15, 10000, 3000),
('ing-8', 'Albahaca Fresca', 'g', 0.25, 2000, 500),
('ing-9', 'Cajas de Cartón Premium', 'unidad', 25.00, 200, 50),
('ing-10', 'Parmigiano Reggiano', 'g', 0.55, 3000, 1000)
ON CONFLICT (id) DO NOTHING;

-- Seed recetas
INSERT INTO public.recetas (id_pizza, id_ingrediente, cantidad_necesaria) VALUES
('pz-1', 'ing-1', 250), ('pz-1', 'ing-2', 150), ('pz-1', 'ing-3', 100), ('pz-1', 'ing-7', 15), ('pz-1', 'ing-8', 5), ('pz-1', 'ing-9', 1),
('pz-2', 'ing-1', 250), ('pz-2', 'ing-2', 180), ('pz-2', 'ing-6', 20), ('pz-2', 'ing-10', 30), ('pz-2', 'ing-7', 15), ('pz-2', 'ing-9', 1),
('pz-3', 'ing-1', 250), ('pz-3', 'ing-2', 150), ('pz-3', 'ing-3', 80), ('pz-3', 'ing-5', 60), ('pz-3', 'ing-10', 20), ('pz-3', 'ing-7', 15), ('pz-3', 'ing-9', 1),
('pz-4', 'ing-1', 250), ('pz-4', 'ing-2', 150), ('pz-4', 'ing-3', 100), ('pz-4', 'ing-4', 80), ('pz-4', 'ing-9', 1),
('pz-5', 'ing-1', 250), ('pz-5', 'ing-2', 120), ('pz-5', 'ing-10', 40), ('pz-5', 'ing-7', 10), ('pz-5', 'ing-9', 1),
('pz-6', 'ing-1', 250), ('pz-6', 'ing-2', 140), ('pz-6', 'ing-3', 150), ('pz-6', 'ing-7', 15), ('pz-6', 'ing-9', 1),
('pz-7', 'ing-1', 250), ('pz-7', 'ing-2', 150), ('pz-7', 'ing-3', 80), ('pz-7', 'ing-7', 10), ('pz-7', 'ing-9', 1),
('pz-8', 'ing-1', 250), ('pz-8', 'ing-2', 140), ('pz-8', 'ing-8', 30), ('pz-8', 'ing-7', 20), ('pz-8', 'ing-9', 1),
('pz-9', 'ing-1', 250), ('pz-9', 'ing-2', 160), ('pz-9', 'ing-5', 50), ('pz-9', 'ing-6', 15), ('pz-9', 'ing-7', 15), ('pz-9', 'ing-9', 1),
('pz-10', 'ing-1', 250), ('pz-10', 'ing-3', 120), ('pz-10', 'ing-7', 20), ('pz-10', 'ing-9', 1)
ON CONFLICT (id_pizza, id_ingrediente) DO NOTHING;

-- Seed audit logs
INSERT INTO public.auditoria_logs (accion, entidad, descripcion_detallada, timestamp) VALUES
('Insertar', 'Pedido', 'Nuevo pedido #001 insertado por María García — 2x Margherita, 1x Tartufo', now() - interval '1 hour'),
('Actualizar', 'Precio', 'Administrador actualizó precio de Pizza Tartufo de RD$1,100 a RD$1,200', now() - interval '2 hours'),
('Actualizar', 'Inventario', 'Reabastecimiento: +20,000g de Harina 00 al inventario', now() - interval '3 hours'),
('Insertar', 'Pedido', 'Nuevo pedido #002 insertado por Carlos Mejía — 3x Diavola', now() - interval '4 hours'),
('Eliminar', 'Pedido', 'Pedido #003 cancelado por el cliente Juan Rodríguez', now() - interval '5 hours');
