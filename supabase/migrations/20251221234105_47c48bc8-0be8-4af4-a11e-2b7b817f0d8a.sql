-- Create sla_configs table for storing SLA configuration per benefit type
CREATE TABLE public.sla_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  benefit_type TEXT NOT NULL UNIQUE,
  green_hours INTEGER NOT NULL DEFAULT 2,
  yellow_hours INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sla_configs ENABLE ROW LEVEL SECURITY;

-- Only admins can view SLA configs
CREATE POLICY "Admin can view sla_configs"
ON public.sla_configs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert SLA configs
CREATE POLICY "Admin can insert sla_configs"
ON public.sla_configs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can update SLA configs
CREATE POLICY "Admin can update sla_configs"
ON public.sla_configs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete SLA configs
CREATE POLICY "Admin can delete sla_configs"
ON public.sla_configs
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sla_configs_updated_at
BEFORE UPDATE ON public.sla_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default SLA configurations
INSERT INTO public.sla_configs (benefit_type, green_hours, yellow_hours) VALUES
('autoescola', 2, 6),
('farmacia', 2, 6),
('oficina', 2, 6),
('vale_gas', 2, 6),
('papelaria', 2, 6),
('otica', 2, 6),
('outros', 2, 6);