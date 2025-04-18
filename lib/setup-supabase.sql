-- Create a Postgres function that allows executing arbitrary SQL
-- This is required for the init-db.js script to work
-- SECURITY NOTE: This function should only be called with the service role key

CREATE OR REPLACE FUNCTION public.pg_query(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Only allow authenticated access
ALTER FUNCTION public.pg_query SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION public.pg_query FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pg_query TO authenticated; 