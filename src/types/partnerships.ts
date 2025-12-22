export interface Partnership {
  id: string;
  name: string;
  type: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditLimit {
  id: string;
  user_id: string;
  partnership_id: string | null;
  benefit_type: string | null;
  limit_amount: number;
  period_type: 'monthly' | 'yearly' | 'once';
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    cpf: string | null;
  };
  partnerships?: {
    name: string;
  };
}

export interface PartnershipUsage {
  id: string;
  user_id: string;
  partnership_id: string;
  benefit_request_id: string | null;
  amount: number;
  usage_date: string;
  notes: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  };
  partnerships?: {
    name: string;
  };
}

export const partnershipTypeLabels: Record<string, string> = {
  autoescola: 'Autoescola',
  farmacia: 'Farmácia',
  otica: 'Ótica',
  oficina: 'Oficina',
  papelaria: 'Papelaria',
  gas: 'Gás',
  outros: 'Outros',
};

export const periodTypeLabels: Record<string, string> = {
  monthly: 'Mensal',
  yearly: 'Anual',
  once: 'Único',
};
