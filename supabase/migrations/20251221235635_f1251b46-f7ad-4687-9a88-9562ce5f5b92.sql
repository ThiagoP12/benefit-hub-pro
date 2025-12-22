-- Tabela de convênios (parcerias)
CREATE TABLE public.partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'autoescola', 'farmacia', 'otica', 'oficina', 'papelaria', 'gas', 'outros'
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de limites de crédito por colaborador
CREATE TABLE public.credit_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partnership_id UUID REFERENCES public.partnerships(id) ON DELETE CASCADE,
  benefit_type TEXT, -- NULL = limite geral, ou tipo específico
  limit_amount NUMERIC NOT NULL DEFAULT 0,
  period_type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly', 'once'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, partnership_id, benefit_type)
);

-- Tabela de histórico de uso de convênios
CREATE TABLE public.partnership_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partnership_id UUID NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
  benefit_request_id UUID REFERENCES public.benefit_requests(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_usage ENABLE ROW LEVEL SECURITY;

-- Policies para partnerships (admin full access, gestores podem ver)
CREATE POLICY "Admin can do all on partnerships" ON public.partnerships
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestor can view partnerships" ON public.partnerships
  FOR SELECT USING (has_role(auth.uid(), 'gestor'));

CREATE POLICY "Agente DP can view partnerships" ON public.partnerships
  FOR SELECT USING (has_role(auth.uid(), 'agente_dp'));

CREATE POLICY "Colaborador can view active partnerships" ON public.partnerships
  FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- Policies para credit_limits
CREATE POLICY "Admin can do all on credit_limits" ON public.credit_limits
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestor can view credit_limits" ON public.credit_limits
  FOR SELECT USING (has_role(auth.uid(), 'gestor'));

CREATE POLICY "User can view own credit_limits" ON public.credit_limits
  FOR SELECT USING (user_id = auth.uid());

-- Policies para partnership_usage
CREATE POLICY "Admin can do all on partnership_usage" ON public.partnership_usage
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestor can view all usage" ON public.partnership_usage
  FOR SELECT USING (has_role(auth.uid(), 'gestor'));

CREATE POLICY "User can view own usage" ON public.partnership_usage
  FOR SELECT USING (user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_partnerships_updated_at
  BEFORE UPDATE ON public.partnerships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_limits_updated_at
  BEFORE UPDATE ON public.credit_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();