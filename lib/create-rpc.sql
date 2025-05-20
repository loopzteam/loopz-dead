-- Create helper function to test if a column exists in a table
CREATE OR REPLACE FUNCTION public.test_column_exists(table_name text, column_name text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = test_column_exists.table_name
      AND column_name = test_column_exists.column_name
  ) INTO column_exists;
  
  RETURN json_build_object('exists', column_exists);
END;
$$;