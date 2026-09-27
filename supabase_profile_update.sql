-- ============================================================
-- ATUALIZAÇÃO DE PERFIL - PeakON
-- Executa este script no Supabase SQL Editor
-- ============================================================

-- Adicionar coluna name à tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name text;

-- Adicionar coluna avatar_url à tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;

-- ============================================================
-- STORAGE: bucket para avatares
-- Cria o bucket "avatars" (tamanho máximo 2MB por ficheiro)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Permitir leitura pública dos avatares
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Avatars are publicly readable' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Avatars are publicly readable"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Permitir upload pelo próprio utilizador autenticado
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload their own avatar"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

-- Permitir substituição do avatar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can update their own avatar"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;

-- Permitir apagar avatar antigo
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can delete their own avatar"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;
