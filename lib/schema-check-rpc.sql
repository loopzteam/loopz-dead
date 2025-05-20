-- Function to get table columns
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS SETOF information_schema.columns
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = get_table_columns.table_name;
$$;