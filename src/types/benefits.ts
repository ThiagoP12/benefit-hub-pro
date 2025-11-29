export type BenefitType = 'vr' | 'va' | 'transporte' | 'vale_gas' | 'ajuda_custo';

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
  vr: 'Vale Refeição',
  va: 'Vale Alimentação',
  transporte: 'Vale Transporte',
  vale_gas: 'Vale Gás',
  ajuda_custo: 'Ajuda de Custo',
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
