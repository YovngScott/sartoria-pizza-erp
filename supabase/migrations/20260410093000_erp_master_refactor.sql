BEGIN;

-- =====================================
-- SECCION: EXTENSIONES Y HELPERS
-- =====================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================
-- SECCION: RESPALDO DE TABLAS EXISTENTES
-- =====================================

DO $$
DECLARE
  table_name text;
  legacy_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'auditoria_logs',
    'clientes',
    'ingredientes',
    'inventario_movimientos',
    'pedido_items',
    'pedidos',
    'perfiles',
    'pizzas',
    'recetas',
    'roles',
    'unidades_medida',
    'usuario_roles'
  ]
  LOOP
    legacy_name := format('%s_legacy_20260410', table_name);

    IF to_regclass(format('public.%I', table_name)) IS NOT NULL
       AND to_regclass(format('public.%I', legacy_name)) IS NULL THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I', table_name, legacy_name);
    END IF;
  END LOOP;
END;
$$;

-- =====================================
-- SECCION: NUEVO ESQUEMA RELACIONAL
-- =====================================

CREATE TABLE IF NOT EXISTS public.unidades_medida (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  categoria text NOT NULL,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.perfiles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id text NOT NULL UNIQUE,
  nombre text,
  email text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usuario_roles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id text NOT NULL,
  rol_id bigint NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT usuario_roles_usuario_rol_unique UNIQUE (usuario_id, rol_id)
);

CREATE TABLE IF NOT EXISTS public.clientes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL,
  telefono text,
  email text,
  direccion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pizzas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo text UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  precio_venta_publico numeric(12,2) NOT NULL DEFAULT 0,
  costo_teorico_actual numeric(12,2) NOT NULL DEFAULT 0,
  margen_teorico_actual numeric(12,2) NOT NULL DEFAULT 0,
  porcentaje_margen_teorico numeric(8,2) NOT NULL DEFAULT 0,
  imagen_url text,
  activa boolean NOT NULL DEFAULT true,
  tiempo_preparacion_minutos integer NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ingredientes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo text UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  unidad_medida_id bigint NOT NULL REFERENCES public.unidades_medida(id),
  stock_actual numeric(14,3) NOT NULL DEFAULT 0,
  stock_minimo numeric(14,3) NOT NULL DEFAULT 0,
  costo_unitario_actual numeric(12,4) NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recetas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pizza_id bigint NOT NULL REFERENCES public.pizzas(id) ON DELETE CASCADE,
  ingrediente_id bigint NOT NULL REFERENCES public.ingredientes(id),
  cantidad_requerida numeric(14,3) NOT NULL,
  merma_porcentaje numeric(6,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recetas_pizza_ingrediente_unique UNIQUE (pizza_id, ingrediente_id)
);

CREATE TABLE IF NOT EXISTS public.pedidos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id bigint REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nombre_snapshot text NOT NULL,
  cliente_telefono_snapshot text,
  usuario_id text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  impuesto_total numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente',
  tipo text NOT NULL DEFAULT 'delivery',
  direccion_entrega text,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pedidos_estado_check CHECK (estado IN ('pendiente', 'completado', 'cancelado')),
  CONSTRAINT pedidos_tipo_check CHECK (tipo IN ('delivery', 'recogida'))
);

CREATE TABLE IF NOT EXISTS public.pedido_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id bigint NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  pizza_id bigint NOT NULL REFERENCES public.pizzas(id),
  pizza_nombre_snapshot text NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  costeo_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ingrediente_id bigint NOT NULL REFERENCES public.ingredientes(id),
  pedido_item_id bigint REFERENCES public.pedido_items(id) ON DELETE SET NULL,
  tipo_movimiento text NOT NULL,
  cantidad numeric(14,3) NOT NULL,
  stock_anterior numeric(14,3) NOT NULL,
  stock_posterior numeric(14,3) NOT NULL,
  costo_unitario_snapshot numeric(12,4) NOT NULL DEFAULT 0,
  motivo text,
  usuario_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.auditoria_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tabla_afectada text NOT NULL,
  entidad_id bigint,
  accion text NOT NULL,
  datos_antes jsonb,
  datos_despues jsonb,
  usuario_id text NOT NULL DEFAULT 'sistema',
  fecha timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auditoria_logs_accion_check CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS'))
);

CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes (lower(email));
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON public.clientes (telefono);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON public.pedidos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_tipo ON public.pedidos (tipo);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON public.pedido_items (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pizza_id ON public.pedido_items (pizza_id);
CREATE INDEX IF NOT EXISTS idx_recetas_pizza_id ON public.recetas (pizza_id);
CREATE INDEX IF NOT EXISTS idx_recetas_ingrediente_id ON public.recetas (ingrediente_id);
CREATE INDEX IF NOT EXISTS idx_inventario_movimientos_ingrediente_id ON public.inventario_movimientos (ingrediente_id);
CREATE INDEX IF NOT EXISTS idx_inventario_movimientos_pedido_item_id ON public.inventario_movimientos (pedido_item_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_tabla_afectada ON public.auditoria_logs (tabla_afectada);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_fecha ON public.auditoria_logs (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_usuario_id ON public.usuario_roles (usuario_id);

-- =====================================
-- SECCION: MIGRACION DE DATOS EXISTENTES
-- =====================================

CREATE TEMP TABLE tmp_unidades_map (
  legacy_id text PRIMARY KEY,
  nuevo_id bigint NOT NULL
) ON COMMIT DROP;

INSERT INTO public.unidades_medida (codigo, nombre, categoria, activa, created_at)
SELECT
  legacy.codigo,
  legacy.nombre,
  COALESCE(legacy.categoria, 'general'),
  COALESCE(legacy.activa, true),
  COALESCE(legacy.created_at, now())
FROM public.unidades_medida_legacy_20260410 AS legacy
WHERE to_regclass('public.unidades_medida_legacy_20260410') IS NOT NULL
ORDER BY legacy.created_at NULLS FIRST, legacy.codigo
ON CONFLICT (codigo) DO UPDATE
SET
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  activa = EXCLUDED.activa;

INSERT INTO tmp_unidades_map (legacy_id, nuevo_id)
SELECT legacy.id::text, nueva.id
FROM public.unidades_medida_legacy_20260410 AS legacy
JOIN public.unidades_medida AS nueva
  ON nueva.codigo = legacy.codigo
WHERE to_regclass('public.unidades_medida_legacy_20260410') IS NOT NULL;

CREATE TEMP TABLE tmp_roles_map (
  legacy_id text PRIMARY KEY,
  nuevo_id bigint NOT NULL
) ON COMMIT DROP;

INSERT INTO public.roles (codigo, nombre, descripcion, created_at)
SELECT
  legacy.codigo,
  legacy.nombre,
  legacy.descripcion,
  COALESCE(legacy.created_at, now())
FROM public.roles_legacy_20260410 AS legacy
WHERE to_regclass('public.roles_legacy_20260410') IS NOT NULL
ORDER BY legacy.created_at NULLS FIRST, legacy.codigo
ON CONFLICT (codigo) DO UPDATE
SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion;

INSERT INTO public.roles (codigo, nombre, descripcion)
VALUES
  ('admin', 'Administrador', 'Acceso completo al ERP'),
  ('cajero', 'Cajero', 'Gestiona ventas y pedidos'),
  ('cocina', 'Cocina', 'Consulta y actualiza produccion')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO tmp_roles_map (legacy_id, nuevo_id)
SELECT legacy.id::text, nueva.id
FROM public.roles_legacy_20260410 AS legacy
JOIN public.roles AS nueva
  ON nueva.codigo = legacy.codigo
WHERE to_regclass('public.roles_legacy_20260410') IS NOT NULL;

INSERT INTO public.pizzas (
  id,
  codigo,
  nombre,
  descripcion,
  precio_venta_publico,
  costo_teorico_actual,
  margen_teorico_actual,
  porcentaje_margen_teorico,
  imagen_url,
  activa,
  tiempo_preparacion_minutos,
  created_at,
  updated_at
)
OVERRIDING SYSTEM VALUE
SELECT
  legacy.id,
  COALESCE(
    NULLIF(legacy.codigo, ''),
    lower(regexp_replace(unaccent(legacy.nombre), '[^a-zA-Z0-9]+', '-', 'g'))
  ),
  legacy.nombre,
  legacy.descripcion,
  COALESCE(legacy.precio_venta_publico, 0),
  COALESCE(legacy.costo_teorico_actual, 0),
  COALESCE(legacy.margen_teorico_actual, 0),
  COALESCE(legacy.porcentaje_margen_teorico, 0),
  legacy.imagen_url,
  COALESCE(legacy.activa, true),
  COALESCE(legacy.tiempo_preparacion_minutos, 20),
  COALESCE(legacy.created_at, now()),
  COALESCE(legacy.updated_at, now())
FROM public.pizzas_legacy_20260410 AS legacy
WHERE to_regclass('public.pizzas_legacy_20260410') IS NOT NULL
ORDER BY legacy.id;

SELECT setval(
  pg_get_serial_sequence('public.pizzas', 'id'),
  COALESCE((SELECT MAX(id) FROM public.pizzas), 1),
  true
);

INSERT INTO public.ingredientes (
  id,
  codigo,
  nombre,
  descripcion,
  unidad_medida_id,
  stock_actual,
  stock_minimo,
  costo_unitario_actual,
  activo,
  created_at,
  updated_at
)
OVERRIDING SYSTEM VALUE
SELECT
  legacy.id,
  legacy.codigo,
  legacy.nombre,
  legacy.descripcion,
  COALESCE(map.nuevo_id, (SELECT id FROM public.unidades_medida ORDER BY id LIMIT 1)),
  COALESCE(legacy.stock_actual, 0),
  COALESCE(legacy.stock_minimo, 0),
  COALESCE(legacy.costo_unitario_actual, 0),
  COALESCE(legacy.activo, true),
  COALESCE(legacy.created_at, now()),
  COALESCE(legacy.updated_at, now())
FROM public.ingredientes_legacy_20260410 AS legacy
LEFT JOIN tmp_unidades_map AS map
  ON map.legacy_id = legacy.unidad_medida_id::text
WHERE to_regclass('public.ingredientes_legacy_20260410') IS NOT NULL
ORDER BY legacy.id;

SELECT setval(
  pg_get_serial_sequence('public.ingredientes', 'id'),
  COALESCE((SELECT MAX(id) FROM public.ingredientes), 1),
  true
);

INSERT INTO public.recetas (
  id,
  pizza_id,
  ingrediente_id,
  cantidad_requerida,
  merma_porcentaje,
  created_at
)
OVERRIDING SYSTEM VALUE
SELECT
  legacy.id,
  legacy.pizza_id,
  legacy.ingrediente_id,
  COALESCE(legacy.cantidad_requerida, 0),
  COALESCE(legacy.merma_porcentaje, 0),
  COALESCE(legacy.created_at, now())
FROM public.recetas_legacy_20260410 AS legacy
WHERE to_regclass('public.recetas_legacy_20260410') IS NOT NULL
ORDER BY legacy.id;

SELECT setval(
  pg_get_serial_sequence('public.recetas', 'id'),
  COALESCE((SELECT MAX(id) FROM public.recetas), 1),
  true
);

INSERT INTO public.clientes (
  id,
  nombre,
  telefono,
  email,
  direccion,
  activo,
  created_at,
  updated_at
)
OVERRIDING SYSTEM VALUE
SELECT
  legacy.id,
  legacy.nombre,
  legacy.telefono,
  legacy.email,
  legacy.direccion_principal,
  COALESCE(legacy.activo, true),
  COALESCE(legacy.created_at, now()),
  COALESCE(legacy.created_at, now())
FROM public.clientes_legacy_20260410 AS legacy
WHERE to_regclass('public.clientes_legacy_20260410') IS NOT NULL
ORDER BY legacy.id;

SELECT setval(
  pg_get_serial_sequence('public.clientes', 'id'),
  COALESCE((SELECT MAX(id) FROM public.clientes), 1),
  true
);

DO $$
BEGIN
  IF to_regclass('public.perfiles_legacy_20260410') IS NOT NULL THEN
    BEGIN
      EXECUTE $sql$
        INSERT INTO public.perfiles (usuario_id, nombre, email, activo, created_at, updated_at)
        SELECT
          legacy.usuario_id,
          NULL,
          NULL,
          true,
          COALESCE(legacy.created_at, now()),
          now()
        FROM public.perfiles_legacy_20260410 AS legacy
        WHERE legacy.usuario_id IS NOT NULL
        ON CONFLICT (usuario_id) DO NOTHING
      $sql$;
    EXCEPTION
      WHEN undefined_column THEN
        NULL;
    END;
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.usuario_roles_legacy_20260410') IS NOT NULL THEN
    BEGIN
      EXECUTE $sql$
        INSERT INTO public.usuario_roles (usuario_id, rol_id, created_at)
        SELECT
          legacy.usuario_id,
          COALESCE(map.nuevo_id, admin_role.id),
          COALESCE(legacy.created_at, now())
        FROM public.usuario_roles_legacy_20260410 AS legacy
        LEFT JOIN tmp_roles_map AS map
          ON map.legacy_id = legacy.rol_id::text
        CROSS JOIN LATERAL (
          SELECT id
          FROM public.roles
          WHERE codigo = 'admin'
          LIMIT 1
        ) AS admin_role
        WHERE legacy.usuario_id IS NOT NULL
        ON CONFLICT (usuario_id, rol_id) DO NOTHING
      $sql$;
    EXCEPTION
      WHEN undefined_column THEN
        NULL;
    END;
  END IF;
END;
$$;

INSERT INTO public.pedidos (
  id,
  cliente_id,
  cliente_nombre_snapshot,
  cliente_telefono_snapshot,
  usuario_id,
  subtotal,
  impuesto_total,
  total,
  estado,
  tipo,
  direccion_entrega,
  observaciones,
  created_at,
  updated_at
)
OVERRIDING SYSTEM VALUE
SELECT
  legacy.id,
  legacy.cliente_id,
  COALESCE(legacy.cliente_nombre, cliente.nombre, 'Consumidor final'),
  cliente.telefono,
  legacy.creado_por,
  COALESCE(legacy.subtotal, legacy.total),
  COALESCE(legacy.impuesto_total, 0),
  COALESCE(legacy.total, legacy.subtotal, 0),
  CASE
    WHEN lower(COALESCE(legacy.estado, '')) IN ('completado', 'entregado', 'listo') THEN 'completado'
    WHEN lower(COALESCE(legacy.estado, '')) = 'cancelado' THEN 'cancelado'
    ELSE 'pendiente'
  END,
  CASE
    WHEN lower(COALESCE(legacy.tipo_entrega, 'delivery')) = 'recogida' THEN 'recogida'
    ELSE 'delivery'
  END,
  legacy.direccion_entrega,
  legacy.observaciones,
  COALESCE(legacy.created_at, now()),
  COALESCE(legacy.updated_at, now())
FROM public.pedidos_legacy_20260410 AS legacy
LEFT JOIN public.clientes AS cliente
  ON cliente.id = legacy.cliente_id
WHERE to_regclass('public.pedidos_legacy_20260410') IS NOT NULL
ORDER BY legacy.id;

SELECT setval(
  pg_get_serial_sequence('public.pedidos', 'id'),
  COALESCE((SELECT MAX(id) FROM public.pedidos), 1),
  true
);

INSERT INTO public.pedido_items (
  id,
  pedido_id,
  pizza_id,
  pizza_nombre_snapshot,
  cantidad,
  precio_unitario,
  subtotal,
  costeo_snapshot,
  created_at
)
OVERRIDING SYSTEM VALUE
SELECT
  legacy.id,
  legacy.pedido_id,
  legacy.pizza_id,
  COALESCE(legacy.pizza_nombre_snapshot, pizza.nombre, 'Pizza'),
  COALESCE(legacy.cantidad, 1),
  COALESCE(legacy.precio_unitario_venta, 0),
  COALESCE(legacy.subtotal_linea, 0),
  COALESCE(legacy.costeo_snapshot, '[]'::jsonb),
  COALESCE(legacy.created_at, now())
FROM public.pedido_items_legacy_20260410 AS legacy
LEFT JOIN public.pizzas AS pizza
  ON pizza.id = legacy.pizza_id
WHERE to_regclass('public.pedido_items_legacy_20260410') IS NOT NULL
ORDER BY legacy.id;

SELECT setval(
  pg_get_serial_sequence('public.pedido_items', 'id'),
  COALESCE((SELECT MAX(id) FROM public.pedido_items), 1),
  true
);

INSERT INTO public.inventario_movimientos (
  id,
  ingrediente_id,
  pedido_item_id,
  tipo_movimiento,
  cantidad,
  stock_anterior,
  stock_posterior,
  costo_unitario_snapshot,
  motivo,
  usuario_id,
  created_at
)
OVERRIDING SYSTEM VALUE
SELECT
  legacy.id,
  legacy.ingrediente_id,
  NULL,
  legacy.tipo_movimiento,
  COALESCE(legacy.cantidad, 0),
  COALESCE(legacy.stock_anterior, 0),
  COALESCE(legacy.stock_posterior, 0),
  COALESCE(ingrediente.costo_unitario_actual, 0),
  legacy.motivo,
  legacy.creado_por,
  COALESCE(legacy.created_at, now())
FROM public.inventario_movimientos_legacy_20260410 AS legacy
LEFT JOIN public.ingredientes AS ingrediente
  ON ingrediente.id = legacy.ingrediente_id
WHERE to_regclass('public.inventario_movimientos_legacy_20260410') IS NOT NULL
ORDER BY legacy.id;

SELECT setval(
  pg_get_serial_sequence('public.inventario_movimientos', 'id'),
  COALESCE((SELECT MAX(id) FROM public.inventario_movimientos), 1),
  true
);

INSERT INTO public.auditoria_logs (
  tabla_afectada,
  entidad_id,
  accion,
  datos_antes,
  datos_despues,
  usuario_id,
  fecha
)
SELECT
  COALESCE(legacy.entidad, 'sistema'),
  NULLIF(legacy.entidad_id, '')::bigint,
  CASE
    WHEN upper(COALESCE(legacy.accion, '')) IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS') THEN upper(legacy.accion)
    WHEN lower(COALESCE(legacy.accion, '')) IN ('insertar', 'crear') THEN 'INSERT'
    WHEN lower(COALESCE(legacy.accion, '')) IN ('actualizar', 'editar') THEN 'UPDATE'
    WHEN lower(COALESCE(legacy.accion, '')) IN ('eliminar', 'borrar') THEN 'DELETE'
    WHEN lower(COALESCE(legacy.accion, '')) = 'login' THEN 'LOGIN'
    ELSE 'ACCESS'
  END,
  NULL,
  jsonb_build_object(
    'descripcion', legacy.descripcion,
    'detalle', legacy.detalle
  ),
  COALESCE(NULLIF(legacy.usuario_id, ''), 'sistema'),
  COALESCE(legacy.created_at, now())
FROM public.auditoria_logs_legacy_20260410 AS legacy
WHERE to_regclass('public.auditoria_logs_legacy_20260410') IS NOT NULL;

-- =====================================
-- SECCION: FUNCIONES DE NEGOCIO
-- =====================================

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuario_roles ur
    JOIN public.roles r ON r.id = ur.rol_id
    WHERE ur.usuario_id = auth.uid()::text
      AND r.codigo = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.fn_recalcular_costos_pizza(p_pizza_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_costo numeric(12,2) := 0;
  v_precio numeric(12,2) := 0;
BEGIN
  SELECT
    COALESCE(
      SUM(
        r.cantidad_requerida
        * (1 + (COALESCE(r.merma_porcentaje, 0) / 100))
        * COALESCE(i.costo_unitario_actual, 0)
      ),
      0
    )
  INTO v_costo
  FROM public.recetas r
  JOIN public.ingredientes i ON i.id = r.ingrediente_id
  WHERE r.pizza_id = p_pizza_id;

  SELECT COALESCE(precio_venta_publico, 0)
  INTO v_precio
  FROM public.pizzas
  WHERE id = p_pizza_id;

  UPDATE public.pizzas
  SET
    costo_teorico_actual = round(v_costo, 2),
    margen_teorico_actual = round(v_precio - v_costo, 2),
    porcentaje_margen_teorico = CASE
      WHEN v_precio <= 0 THEN 0
      ELSE round(((v_precio - v_costo) / v_precio) * 100, 2)
    END
  WHERE id = p_pizza_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_recalcular_costos_pizza_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.fn_recalcular_costos_pizza(COALESCE(NEW.pizza_id, OLD.pizza_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_recalcular_costos_por_ingrediente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_pizza_id bigint;
BEGIN
  FOR current_pizza_id IN
    SELECT DISTINCT pizza_id
    FROM public.recetas
    WHERE ingrediente_id = COALESCE(NEW.id, OLD.id)
  LOOP
    PERFORM public.fn_recalcular_costos_pizza(current_pizza_id);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_generar_costeo_snapshot(
  p_pizza_id bigint,
  p_cantidad integer
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'ingrediente_id', i.id,
        'ingrediente_nombre', i.nombre,
        'unidad_medida_id', u.id,
        'unidad_medida_codigo', u.codigo,
        'cantidad_receta', r.cantidad_requerida,
        'cantidad_total', r.cantidad_requerida * p_cantidad,
        'merma_porcentaje', COALESCE(r.merma_porcentaje, 0),
        'costo_unitario_actual', i.costo_unitario_actual,
        'costo_total', round(
          r.cantidad_requerida
          * p_cantidad
          * (1 + (COALESCE(r.merma_porcentaje, 0) / 100))
          * i.costo_unitario_actual,
          4
        )
      )
      ORDER BY i.nombre
    ),
    '[]'::jsonb
  )
  FROM public.recetas r
  JOIN public.ingredientes i ON i.id = r.ingrediente_id
  JOIN public.unidades_medida u ON u.id = i.unidad_medida_id
  WHERE r.pizza_id = p_pizza_id;
$$;

CREATE OR REPLACE FUNCTION public.fn_preparar_pedido_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pizza public.pizzas%ROWTYPE;
BEGIN
  SELECT *
  INTO v_pizza
  FROM public.pizzas
  WHERE id = NEW.pizza_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pizza % no existe', NEW.pizza_id;
  END IF;

  NEW.pizza_nombre_snapshot := COALESCE(NULLIF(NEW.pizza_nombre_snapshot, ''), v_pizza.nombre);
  NEW.precio_unitario := COALESCE(NULLIF(NEW.precio_unitario, 0), v_pizza.precio_venta_publico);
  NEW.subtotal := round(NEW.precio_unitario * NEW.cantidad, 2);
  NEW.costeo_snapshot := COALESCE(
    NEW.costeo_snapshot,
    public.fn_generar_costeo_snapshot(NEW.pizza_id, NEW.cantidad)
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_sincronizar_totales_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id bigint := COALESCE(NEW.pedido_id, OLD.pedido_id);
  v_total numeric(12,2);
  v_subtotal numeric(12,2);
  v_itbis numeric(12,2);
BEGIN
  SELECT COALESCE(SUM(subtotal), 0)
  INTO v_total
  FROM public.pedido_items
  WHERE pedido_id = v_pedido_id;

  v_subtotal := round(v_total / 1.18, 2);
  v_itbis := round(v_total - v_subtotal, 2);

  UPDATE public.pedidos
  SET
    subtotal = v_subtotal,
    impuesto_total = v_itbis,
    total = v_total,
    updated_at = now()
  WHERE id = v_pedido_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_movimiento_inventario_por_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  v_factor numeric(14,3);
  v_stock_anterior numeric(14,3);
  v_stock_posterior numeric(14,3);
  v_tipo text;
  v_motivo text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_factor := 1;
    v_tipo := 'salida_venta';
    v_motivo := format('Descuento automatico por pedido item %s', NEW.id);
  ELSIF TG_OP = 'DELETE' THEN
    v_factor := -1;
    v_tipo := 'reversion_venta';
    v_motivo := format('Reversion por eliminacion del pedido item %s', OLD.id);
  ELSE
    RETURN NEW;
  END IF;

  FOR rec IN
    SELECT
      r.ingrediente_id,
      (
        r.cantidad_requerida
        * COALESCE(CASE WHEN TG_OP = 'DELETE' THEN OLD.cantidad ELSE NEW.cantidad END, 0)
        * (1 + (COALESCE(r.merma_porcentaje, 0) / 100))
      ) AS cantidad_real,
      i.costo_unitario_actual
    FROM public.recetas r
    JOIN public.ingredientes i ON i.id = r.ingrediente_id
    WHERE r.pizza_id = COALESCE(NEW.pizza_id, OLD.pizza_id)
  LOOP
    SELECT stock_actual
    INTO v_stock_anterior
    FROM public.ingredientes
    WHERE id = rec.ingrediente_id
    FOR UPDATE;

    v_stock_posterior := v_stock_anterior - (rec.cantidad_real * v_factor);

    UPDATE public.ingredientes
    SET stock_actual = v_stock_posterior
    WHERE id = rec.ingrediente_id;

    INSERT INTO public.inventario_movimientos (
      ingrediente_id,
      pedido_item_id,
      tipo_movimiento,
      cantidad,
      stock_anterior,
      stock_posterior,
      costo_unitario_snapshot,
      motivo,
      usuario_id
    )
    VALUES (
      rec.ingrediente_id,
      COALESCE(NEW.id, OLD.id),
      v_tipo,
      rec.cantidad_real * v_factor,
      v_stock_anterior,
      v_stock_posterior,
      rec.costo_unitario_actual,
      v_motivo,
      COALESCE(
        (SELECT usuario_id FROM public.pedidos WHERE id = COALESCE(NEW.pedido_id, OLD.pedido_id)),
        'sistema'
      )
    );
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_auditar_cambios()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id text := COALESCE(auth.uid()::text, 'sistema');
  current_row jsonb;
  previous_row jsonb;
  current_entity_id bigint;
BEGIN
  IF TG_OP = 'INSERT' THEN
    current_row := to_jsonb(NEW);
    previous_row := NULL;
    current_entity_id := NULLIF(current_row ->> 'id', '')::bigint;
  ELSIF TG_OP = 'UPDATE' THEN
    current_row := to_jsonb(NEW);
    previous_row := to_jsonb(OLD);
    current_entity_id := NULLIF(current_row ->> 'id', '')::bigint;
  ELSE
    current_row := NULL;
    previous_row := to_jsonb(OLD);
    current_entity_id := NULLIF(previous_row ->> 'id', '')::bigint;
  END IF;

  INSERT INTO public.auditoria_logs (
    tabla_afectada,
    entidad_id,
    accion,
    datos_antes,
    datos_despues,
    usuario_id,
    fecha
  )
  VALUES (
    TG_TABLE_NAME,
    current_entity_id,
    TG_OP,
    previous_row,
    current_row,
    COALESCE(user_id, 'sistema'),
    now()
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN others THEN
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================
-- SECCION: TRIGGERS
-- =====================================

DROP TRIGGER IF EXISTS trg_perfiles_set_updated_at ON public.perfiles;
CREATE TRIGGER trg_perfiles_set_updated_at
BEFORE UPDATE ON public.perfiles
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_clientes_set_updated_at ON public.clientes;
CREATE TRIGGER trg_clientes_set_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_pedidos_set_updated_at ON public.pedidos;
CREATE TRIGGER trg_pedidos_set_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_pizzas_set_updated_at ON public.pizzas;
CREATE TRIGGER trg_pizzas_set_updated_at
BEFORE UPDATE ON public.pizzas
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_ingredientes_set_updated_at ON public.ingredientes;
CREATE TRIGGER trg_ingredientes_set_updated_at
BEFORE UPDATE ON public.ingredientes
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_recetas_recalcular_costos ON public.recetas;
CREATE TRIGGER trg_recetas_recalcular_costos
AFTER INSERT OR UPDATE OR DELETE ON public.recetas
FOR EACH ROW
EXECUTE FUNCTION public.fn_recalcular_costos_pizza_trigger();

DROP TRIGGER IF EXISTS trg_ingredientes_recalcular_costos ON public.ingredientes;
CREATE TRIGGER trg_ingredientes_recalcular_costos
AFTER UPDATE OF costo_unitario_actual ON public.ingredientes
FOR EACH ROW
EXECUTE FUNCTION public.fn_recalcular_costos_por_ingrediente();

DROP TRIGGER IF EXISTS trg_pedido_items_preparar ON public.pedido_items;
CREATE TRIGGER trg_pedido_items_preparar
BEFORE INSERT OR UPDATE ON public.pedido_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_preparar_pedido_item();

DROP TRIGGER IF EXISTS trg_pedido_items_totales ON public.pedido_items;
CREATE TRIGGER trg_pedido_items_totales
AFTER INSERT OR UPDATE OR DELETE ON public.pedido_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_sincronizar_totales_pedido();

DROP TRIGGER IF EXISTS trg_pedido_items_inventario_insert ON public.pedido_items;
CREATE TRIGGER trg_pedido_items_inventario_insert
AFTER INSERT ON public.pedido_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_movimiento_inventario_por_item();

DROP TRIGGER IF EXISTS trg_pedido_items_inventario_delete ON public.pedido_items;
CREATE TRIGGER trg_pedido_items_inventario_delete
AFTER DELETE ON public.pedido_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_movimiento_inventario_por_item();

DO $$
DECLARE
  audited_table text;
BEGIN
  FOREACH audited_table IN ARRAY ARRAY[
    'clientes',
    'pedidos',
    'pedido_items',
    'pizzas',
    'perfiles',
    'inventario_movimientos'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_auditoria ON public.%I', audited_table, audited_table);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_auditoria AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fn_auditar_cambios()',
      audited_table,
      audited_table
    );
  END LOOP;
END;
$$;

-- =====================================
-- SECCION: RLS Y POLITICAS MINIMAS
-- =====================================

ALTER TABLE public.pizzas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_medida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pizzas_public_read ON public.pizzas;
CREATE POLICY pizzas_public_read ON public.pizzas
FOR SELECT
TO anon, authenticated
USING (activa = true OR public.is_admin_user());

DROP POLICY IF EXISTS admin_manage_catalog ON public.pizzas;
CREATE POLICY admin_manage_catalog ON public.pizzas
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS admin_manage_ingredientes ON public.ingredientes;
CREATE POLICY admin_manage_ingredientes ON public.ingredientes
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS admin_manage_unidades_medida ON public.unidades_medida;
CREATE POLICY admin_manage_unidades_medida ON public.unidades_medida
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS admin_manage_recetas ON public.recetas;
CREATE POLICY admin_manage_recetas ON public.recetas
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS admin_manage_clientes ON public.clientes;
CREATE POLICY admin_manage_clientes ON public.clientes
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS checkout_insert_clientes ON public.clientes;
CREATE POLICY checkout_insert_clientes ON public.clientes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS checkout_read_clientes ON public.clientes;
CREATE POLICY checkout_read_clientes ON public.clientes
FOR SELECT
TO anon, authenticated
USING (public.is_admin_user() OR true);

DROP POLICY IF EXISTS admin_manage_pedidos ON public.pedidos;
CREATE POLICY admin_manage_pedidos ON public.pedidos
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS checkout_insert_pedidos ON public.pedidos;
CREATE POLICY checkout_insert_pedidos ON public.pedidos
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS checkout_read_pedidos ON public.pedidos;
CREATE POLICY checkout_read_pedidos ON public.pedidos
FOR SELECT
TO anon, authenticated
USING (public.is_admin_user() OR usuario_id IS NULL);

DROP POLICY IF EXISTS admin_manage_pedido_items ON public.pedido_items;
CREATE POLICY admin_manage_pedido_items ON public.pedido_items
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS checkout_insert_pedido_items ON public.pedido_items;
CREATE POLICY checkout_insert_pedido_items ON public.pedido_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS checkout_read_pedido_items ON public.pedido_items;
CREATE POLICY checkout_read_pedido_items ON public.pedido_items
FOR SELECT
TO anon, authenticated
USING (
  public.is_admin_user()
  OR EXISTS (
    SELECT 1
    FROM public.pedidos p
    WHERE p.id = pedido_items.pedido_id
      AND p.usuario_id IS NULL
  )
);

DROP POLICY IF EXISTS admin_read_inventory_movements ON public.inventario_movimientos;
CREATE POLICY admin_read_inventory_movements ON public.inventario_movimientos
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS admin_manage_audit_logs ON public.auditoria_logs;
CREATE POLICY admin_manage_audit_logs ON public.auditoria_logs
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS admin_manage_perfiles ON public.perfiles;
CREATE POLICY admin_manage_perfiles ON public.perfiles
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS self_read_perfil ON public.perfiles;
CREATE POLICY self_read_perfil ON public.perfiles
FOR SELECT
TO authenticated
USING (usuario_id = auth.uid()::text);

DROP POLICY IF EXISTS admin_manage_roles ON public.roles;
CREATE POLICY admin_manage_roles ON public.roles
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS admin_manage_usuario_roles ON public.usuario_roles;
CREATE POLICY admin_manage_usuario_roles ON public.usuario_roles
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- =====================================
-- SECCION: STORAGE
-- =====================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('pizza-images', 'pizza-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS pizza_images_public_read ON storage.objects;
CREATE POLICY pizza_images_public_read ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'pizza-images');

DROP POLICY IF EXISTS pizza_images_admin_insert ON storage.objects;
CREATE POLICY pizza_images_admin_insert ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pizza-images' AND public.is_admin_user());

DROP POLICY IF EXISTS pizza_images_admin_delete ON storage.objects;
CREATE POLICY pizza_images_admin_delete ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'pizza-images' AND public.is_admin_user());

COMMIT;
