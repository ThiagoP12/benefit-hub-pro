import { Unit, User, BenefitRequest, BenefitType, BenefitStatus } from '@/types/benefits';

export const mockUnits: Unit[] = [
  { id: 1, name: 'Matriz São Paulo', region: 'Sudeste', createdAt: new Date('2023-01-01') },
  { id: 2, name: 'Filial Rio de Janeiro', region: 'Sudeste', createdAt: new Date('2023-02-15') },
  { id: 3, name: 'Filial Belo Horizonte', region: 'Sudeste', createdAt: new Date('2023-03-20') },
  { id: 4, name: 'Filial Curitiba', region: 'Sul', createdAt: new Date('2023-04-10') },
  { id: 5, name: 'Filial Salvador', region: 'Nordeste', createdAt: new Date('2023-05-05') },
];

export const mockUsers: User[] = [
  { id: 1, name: 'Ana Silva', cpf: '12345678901', phone: '11999001234', unitId: 1, role: 'admin', createdAt: new Date('2023-01-15') },
  { id: 2, name: 'Carlos Santos', cpf: '23456789012', phone: '11999002345', unitId: 1, role: 'dp', createdAt: new Date('2023-02-20') },
  { id: 3, name: 'Maria Oliveira', cpf: '34567890123', phone: '21999003456', unitId: 2, role: 'financeiro', createdAt: new Date('2023-03-25') },
  { id: 4, name: 'João Pereira', cpf: '45678901234', phone: '31999004567', unitId: 3, role: 'colaborador', createdAt: new Date('2023-04-30') },
  { id: 5, name: 'Fernanda Costa', cpf: '56789012345', phone: '41999005678', unitId: 4, role: 'colaborador', createdAt: new Date('2023-05-10') },
  { id: 6, name: 'Ricardo Lima', cpf: '67890123456', phone: '71999006789', unitId: 5, role: 'colaborador', createdAt: new Date('2023-06-15') },
  { id: 7, name: 'Patricia Mendes', cpf: '78901234567', phone: '11999007890', unitId: 1, role: 'colaborador', createdAt: new Date('2023-07-20') },
  { id: 8, name: 'Lucas Almeida', cpf: '89012345678', phone: '21999008901', unitId: 2, role: 'colaborador', createdAt: new Date('2023-08-25') },
];

const benefitTypes: BenefitType[] = ['vr', 'va', 'transporte', 'vale_gas', 'ajuda_custo'];
const statuses: BenefitStatus[] = ['aberto', 'analise', 'aprovado', 'negado', 'concluido'];

export const mockBenefitRequests: BenefitRequest[] = Array.from({ length: 35 }, (_, i) => {
  const userId = Math.floor(Math.random() * 6) + 3;
  const benefitType = benefitTypes[Math.floor(Math.random() * benefitTypes.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const createdDate = new Date(2024, Math.floor(Math.random() * 11), Math.floor(Math.random() * 28) + 1);
  
  return {
    id: i + 1,
    protocol: `BEN-${createdDate.getFullYear()}${String(createdDate.getMonth() + 1).padStart(2, '0')}${String(createdDate.getDate()).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`,
    userId,
    user: mockUsers.find(u => u.id === userId),
    benefitType,
    status,
    details: `Solicitação de ${benefitType} para o mês de ${createdDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
    attachments: [],
    resolverId: status !== 'aberto' ? Math.floor(Math.random() * 2) + 1 : undefined,
    createdAt: createdDate,
    updatedAt: new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000),
  };
}).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

export const getDashboardStats = () => {
  const total = mockBenefitRequests.length;
  const abertos = mockBenefitRequests.filter(r => r.status === 'aberto').length;
  const emAnalise = mockBenefitRequests.filter(r => r.status === 'analise').length;
  const aprovados = mockBenefitRequests.filter(r => r.status === 'aprovado').length;
  const concluidos = mockBenefitRequests.filter(r => r.status === 'concluido').length;

  return { total, abertos, emAnalise, aprovados, concluidos };
};

export const getMonthlyData = () => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months.map((month, index) => ({
    month,
    solicitacoes: mockBenefitRequests.filter(r => r.createdAt.getMonth() === index).length,
    aprovadas: mockBenefitRequests.filter(r => r.createdAt.getMonth() === index && r.status === 'aprovado').length,
  }));
};

export const getBenefitTypeData = () => {
  return benefitTypes.map(type => ({
    type,
    count: mockBenefitRequests.filter(r => r.benefitType === type).length,
  }));
};

export const getUnitData = () => {
  return mockUnits.map(unit => ({
    unit: unit.name.replace('Filial ', '').replace('Matriz ', ''),
    count: mockBenefitRequests.filter(r => {
      const user = mockUsers.find(u => u.id === r.userId);
      return user?.unitId === unit.id;
    }).length,
  }));
};
