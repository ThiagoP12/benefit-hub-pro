export type BenefitType = 'autoescola' | 'farmacia' | 'oficina' | 'vale_gas' | 'papelaria' | 'otica' | 'outros';

export type BenefitStatus = 'aberto' | 'analise' | 'aprovado' | 'negado' | 'concluido';

export type UserRole = 'colaborador' | 'dp' | 'financeiro' | 'admin';

export interface Unit {
  id: number;
  name: string;
  region: string;
  createdAt: Date;
}

export interface User {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  unitId: number;
  unit?: Unit;
  role: UserRole;
  createdAt: Date;
}

export interface BenefitRequest {
  id: number;
  protocol: string;
  userId: number;
  user?: User;
  benefitType: BenefitType;
  status: BenefitStatus;
  details: string;
  attachments: string[];
  resolverId?: number;
  resolver?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Log {
  id: number;
  requestId: number;
  action: string;
  userId: number;
  user?: User;
  createdAt: Date;
}

export const benefitTypeLabels: Record<BenefitType, string> = {
  autoescola: 'Autoescola',
  farmacia: 'Farmácia',
  oficina: 'Oficina',
  vale_gas: 'Vale Gás',
  papelaria: 'Papelaria',
  otica: 'Ótica',
  outros: 'Outros',
};

export const statusLabels: Record<BenefitStatus, string> = {
  aberto: 'Aberto',
  analise: 'Em Análise',
  aprovado: 'Aprovado',
  negado: 'Negado',
  concluido: 'Concluído',
};

export const roleLabels: Record<UserRole, string> = {
  colaborador: 'Colaborador',
  dp: 'Depart. Pessoal',
  financeiro: 'Financeiro',
  admin: 'Administrador',
};
