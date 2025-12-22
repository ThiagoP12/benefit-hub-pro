-- Add credit_limit column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN credit_limit numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.credit_limit IS 'Limite de crédito total do colaborador para benefícios';