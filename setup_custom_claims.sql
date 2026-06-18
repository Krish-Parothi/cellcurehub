-- 1. Create the Custom Access Token Hook function
-- This function runs every time Supabase mints a new JWT.
-- It fetches the user's role and details from public.users and injects them into the JWT claims.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
  DECLARE
    claims jsonb;
    user_role text;
    user_shop_id uuid;
    user_full_name text;
    user_phone text;
  BEGIN
    -- Fetch the user profile from the public.users table
    SELECT role, shop_id, full_name, phone 
    INTO user_role, user_shop_id, user_full_name, user_phone
    FROM public.users
    WHERE id = (event->>'user_id')::uuid;

    claims := event->'claims';

    IF user_role IS NOT NULL THEN
      -- Inject the claims into app_metadata so the client can read them synchronously
      claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role));
      
      IF user_shop_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{app_metadata, shop_id}', to_jsonb(user_shop_id));
      END IF;

      IF user_full_name IS NOT NULL THEN
        claims := jsonb_set(claims, '{app_metadata, full_name}', to_jsonb(user_full_name));
      END IF;

      IF user_phone IS NOT NULL THEN
        claims := jsonb_set(claims, '{app_metadata, phone}', to_jsonb(user_phone));
      END IF;
      
      -- Update the 'claims' object in the original event
      event := jsonb_set(event, '{claims}', claims);
    END IF;

    -- Return the modified event
    RETURN event;
  END;
$$;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- INSTRUCTIONS:
-- 1. Run this SQL in your Supabase SQL Editor.
-- 2. Go to Authentication > Hooks in the Supabase Dashboard.
-- 3. Enable the "Custom access token (JWT)" hook.
-- 4. Select the `custom_access_token_hook` function from the `public` schema.
