CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  app_user_id uuid;
BEGIN
  INSERT INTO public.users (email, display_name, status, supabase_auth_id, created_at, updated_at)
  VALUES (
    NEW.email,
    NULLIF(
      trim(
        COALESCE(
          NEW.raw_user_meta_data ->> 'display_name',
          NEW.raw_user_meta_data ->> 'name',
          split_part(COALESCE(NEW.email, ''), '@', 1)
        )
      ),
      ''
    ),
    'ACTIVE'::public."UserStatus",
    NEW.id::text,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
    SET supabase_auth_id = EXCLUDED.supabase_auth_id,
        display_name = COALESCE(public.users.display_name, EXCLUDED.display_name),
        status = 'ACTIVE'::public."UserStatus",
        updated_at = NOW()
  RETURNING id INTO app_user_id;

  INSERT INTO public.profiles (user_id, first_name, last_name, created_at, updated_at)
  VALUES (
    app_user_id,
    NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_id)
  SELECT app_user_id, role.id
  FROM public.roles role
  WHERE role.slug = 'client'
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
