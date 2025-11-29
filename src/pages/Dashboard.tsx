import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { BenefitsChart } from '@/components/dashboard/BenefitsChart';
import { BenefitTypeChart } from '@/components/dashboard/BenefitTypeChart';
import { RecentRequests } from '@/components/dashboard/RecentRequests';
import { getDashboardStats } from '@/data/mockData';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const stats = getDashboardStats();

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Visão geral das solicitações de benefícios
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total de Solicitações"
            value={stats.total}
            icon={FileText}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Em Aberto"
            value={stats.abertos}
            icon={AlertCircle}
            variant="info"
          />
          <StatCard
            title="Em Análise"
            value={stats.emAnalise}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Aprovadas"
            value={stats.aprovados}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Concluídas"
            value={stats.concluidos}
            icon={XCircle}
            variant="default"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BenefitsChart />
          <BenefitTypeChart />
        </div>

        {/* Recent Requests */}
        <RecentRequests />
      </div>
    </MainLayout>
  );
}
