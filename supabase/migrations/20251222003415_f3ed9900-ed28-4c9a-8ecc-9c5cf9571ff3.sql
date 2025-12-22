-- Add installment tracking fields to benefit_requests
ALTER TABLE public.benefit_requests 
ADD COLUMN total_installments integer DEFAULT 1,
ADD COLUMN paid_installments integer DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.benefit_requests.total_installments IS 'Número total de parcelas do benefício';
COMMENT ON COLUMN public.benefit_requests.paid_installments IS 'Número de parcelas já pagas';