export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      auditoria_logs: {
        Row: {
          accion: string;
          datos_antes: Json | null;
          datos_despues: Json | null;
          entidad_id: number | null;
          fecha: string;
          id: number;
          tabla_afectada: string;
          usuario_id: string;
        };
        Insert: {
          accion: string;
          datos_antes?: Json | null;
          datos_despues?: Json | null;
          entidad_id?: number | null;
          fecha?: string;
          id?: number;
          tabla_afectada: string;
          usuario_id?: string;
        };
        Update: {
          accion?: string;
          datos_antes?: Json | null;
          datos_despues?: Json | null;
          entidad_id?: number | null;
          fecha?: string;
          id?: number;
          tabla_afectada?: string;
          usuario_id?: string;
        };
      };
      clientes: {
        Row: {
          activo: boolean;
          created_at: string;
          direccion: string | null;
          email: string | null;
          id: number;
          nombre: string;
          telefono: string | null;
          updated_at: string;
        };
        Insert: {
          activo?: boolean;
          created_at?: string;
          direccion?: string | null;
          email?: string | null;
          id?: number;
          nombre: string;
          telefono?: string | null;
          updated_at?: string;
        };
        Update: {
          activo?: boolean;
          created_at?: string;
          direccion?: string | null;
          email?: string | null;
          id?: number;
          nombre?: string;
          telefono?: string | null;
          updated_at?: string;
        };
      };
      ingredientes: {
        Row: {
          activo: boolean;
          codigo: string | null;
          costo_unitario_actual: number;
          created_at: string;
          descripcion: string | null;
          id: number;
          nombre: string;
          stock_actual: number;
          stock_minimo: number;
          unidad_medida_id: number;
          updated_at: string;
        };
        Insert: {
          activo?: boolean;
          codigo?: string | null;
          costo_unitario_actual?: number;
          created_at?: string;
          descripcion?: string | null;
          id?: number;
          nombre: string;
          stock_actual?: number;
          stock_minimo?: number;
          unidad_medida_id: number;
          updated_at?: string;
        };
        Update: {
          activo?: boolean;
          codigo?: string | null;
          costo_unitario_actual?: number;
          created_at?: string;
          descripcion?: string | null;
          id?: number;
          nombre?: string;
          stock_actual?: number;
          stock_minimo?: number;
          unidad_medida_id?: number;
          updated_at?: string;
        };
      };
      inventario_movimientos: {
        Row: {
          cantidad: number;
          costo_unitario_snapshot: number;
          created_at: string;
          id: number;
          ingrediente_id: number;
          motivo: string | null;
          pedido_item_id: number | null;
          stock_anterior: number;
          stock_posterior: number;
          tipo_movimiento: string;
          usuario_id: string | null;
        };
        Insert: {
          cantidad: number;
          costo_unitario_snapshot?: number;
          created_at?: string;
          id?: number;
          ingrediente_id: number;
          motivo?: string | null;
          pedido_item_id?: number | null;
          stock_anterior: number;
          stock_posterior: number;
          tipo_movimiento: string;
          usuario_id?: string | null;
        };
        Update: {
          cantidad?: number;
          costo_unitario_snapshot?: number;
          created_at?: string;
          id?: number;
          ingrediente_id?: number;
          motivo?: string | null;
          pedido_item_id?: number | null;
          stock_anterior?: number;
          stock_posterior?: number;
          tipo_movimiento?: string;
          usuario_id?: string | null;
        };
      };
      pedido_items: {
        Row: {
          cantidad: number;
          costeo_snapshot: Json;
          created_at: string;
          id: number;
          pedido_id: number;
          pizza_id: number;
          pizza_nombre_snapshot: string;
          precio_unitario: number;
          subtotal: number;
        };
        Insert: {
          cantidad: number;
          costeo_snapshot: Json;
          created_at?: string;
          id?: number;
          pedido_id: number;
          pizza_id: number;
          pizza_nombre_snapshot: string;
          precio_unitario?: number;
          subtotal?: number;
        };
        Update: {
          cantidad?: number;
          costeo_snapshot?: Json;
          created_at?: string;
          id?: number;
          pedido_id?: number;
          pizza_id?: number;
          pizza_nombre_snapshot?: string;
          precio_unitario?: number;
          subtotal?: number;
        };
      };
      pedidos: {
        Row: {
          cliente_id: number | null;
          cliente_nombre_snapshot: string;
          cliente_telefono_snapshot: string | null;
          created_at: string;
          direccion_entrega: string | null;
          estado: string;
          id: number;
          impuesto_total: number;
          observaciones: string | null;
          subtotal: number;
          tipo: string;
          total: number;
          updated_at: string;
          usuario_id: string | null;
        };
        Insert: {
          cliente_id?: number | null;
          cliente_nombre_snapshot: string;
          cliente_telefono_snapshot?: string | null;
          created_at?: string;
          direccion_entrega?: string | null;
          estado?: string;
          id?: number;
          impuesto_total?: number;
          observaciones?: string | null;
          subtotal?: number;
          tipo: string;
          total?: number;
          updated_at?: string;
          usuario_id?: string | null;
        };
        Update: {
          cliente_id?: number | null;
          cliente_nombre_snapshot?: string;
          cliente_telefono_snapshot?: string | null;
          created_at?: string;
          direccion_entrega?: string | null;
          estado?: string;
          id?: number;
          impuesto_total?: number;
          observaciones?: string | null;
          subtotal?: number;
          tipo?: string;
          total?: number;
          updated_at?: string;
          usuario_id?: string | null;
        };
      };
      perfiles: {
        Row: {
          activo: boolean;
          created_at: string;
          email: string | null;
          id: number;
          nombre: string | null;
          updated_at: string;
          usuario_id: string;
        };
        Insert: {
          activo?: boolean;
          created_at?: string;
          email?: string | null;
          id?: number;
          nombre?: string | null;
          updated_at?: string;
          usuario_id: string;
        };
        Update: {
          activo?: boolean;
          created_at?: string;
          email?: string | null;
          id?: number;
          nombre?: string | null;
          updated_at?: string;
          usuario_id?: string;
        };
      };
      pizzas: {
        Row: {
          activa: boolean;
          codigo: string | null;
          costo_teorico_actual: number;
          created_at: string;
          descripcion: string | null;
          id: number;
          imagen_url: string | null;
          margen_teorico_actual: number;
          nombre: string;
          porcentaje_margen_teorico: number;
          precio_venta_publico: number;
          tiempo_preparacion_minutos: number;
          updated_at: string;
        };
        Insert: {
          activa?: boolean;
          codigo?: string | null;
          costo_teorico_actual?: number;
          created_at?: string;
          descripcion?: string | null;
          id?: number;
          imagen_url?: string | null;
          margen_teorico_actual?: number;
          nombre: string;
          porcentaje_margen_teorico?: number;
          precio_venta_publico?: number;
          tiempo_preparacion_minutos?: number;
          updated_at?: string;
        };
        Update: {
          activa?: boolean;
          codigo?: string | null;
          costo_teorico_actual?: number;
          created_at?: string;
          descripcion?: string | null;
          id?: number;
          imagen_url?: string | null;
          margen_teorico_actual?: number;
          nombre?: string;
          porcentaje_margen_teorico?: number;
          precio_venta_publico?: number;
          tiempo_preparacion_minutos?: number;
          updated_at?: string;
        };
      };
      recetas: {
        Row: {
          cantidad_requerida: number;
          created_at: string;
          id: number;
          ingrediente_id: number;
          merma_porcentaje: number;
          pizza_id: number;
        };
        Insert: {
          cantidad_requerida: number;
          created_at?: string;
          id?: number;
          ingrediente_id: number;
          merma_porcentaje?: number;
          pizza_id: number;
        };
        Update: {
          cantidad_requerida?: number;
          created_at?: string;
          id?: number;
          ingrediente_id?: number;
          merma_porcentaje?: number;
          pizza_id?: number;
        };
      };
      roles: {
        Row: {
          codigo: string;
          created_at: string;
          descripcion: string | null;
          id: number;
          nombre: string;
        };
        Insert: {
          codigo: string;
          created_at?: string;
          descripcion?: string | null;
          id?: number;
          nombre: string;
        };
        Update: {
          codigo?: string;
          created_at?: string;
          descripcion?: string | null;
          id?: number;
          nombre?: string;
        };
      };
      unidades_medida: {
        Row: {
          activa: boolean;
          categoria: string;
          codigo: string;
          created_at: string;
          id: number;
          nombre: string;
        };
        Insert: {
          activa?: boolean;
          categoria: string;
          codigo: string;
          created_at?: string;
          id?: number;
          nombre: string;
        };
        Update: {
          activa?: boolean;
          categoria?: string;
          codigo?: string;
          created_at?: string;
          id?: number;
          nombre?: string;
        };
      };
      usuario_roles: {
        Row: {
          created_at: string;
          id: number;
          rol_id: number;
          usuario_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          rol_id: number;
          usuario_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          rol_id?: number;
          usuario_id?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin_user: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> =
  PublicSchema['Enums'][T];
