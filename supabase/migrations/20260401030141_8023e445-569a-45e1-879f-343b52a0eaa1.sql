
-- Fix the unidad_medida check constraint to allow more units
ALTER TABLE public.ingredientes DROP CONSTRAINT IF EXISTS ingredientes_unidad_medida_check;
ALTER TABLE public.ingredientes ADD CONSTRAINT ingredientes_unidad_medida_check 
  CHECK (unidad_medida IN ('g', 'ml', 'u', 'unidad', 'oz', 'kg', 'lt', 'lb', 'pc', 'taza', 'cda', 'cdta'));

-- Create storage bucket for pizza images
INSERT INTO storage.buckets (id, name, public) VALUES ('pizza-images', 'pizza-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view pizza images
CREATE POLICY "Public can view pizza images" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'pizza-images');

-- Allow admins to upload pizza images
CREATE POLICY "Admins can upload pizza images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'pizza-images' AND is_admin_user());

-- Allow admins to delete pizza images
CREATE POLICY "Admins can delete pizza images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'pizza-images' AND is_admin_user());
