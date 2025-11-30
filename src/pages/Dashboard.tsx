import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { BenefitsChart } from '@/components/dashboard/BenefitsChart';
import { BenefitTypeChart } from '@/components/dashboard/BenefitTypeChart';
import { BenefitCategoryCards } from '@/components/dashboard/BenefitCategoryCards';
import { RecentRequests } from '@/components/dashboard/RecentRequests';
import { DashboardFiltersComponent, DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BenefitType } from '@/types/benefits';
import { benefitTypes } from '@/data/mockData';

interface DashboardStats {
  total: number;
  abertos: number;
  emAnalise: number;
  aprovados: number;
  concluidos: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ total: 0, abertos: 0, emAnalise: 0, aprovados: 0, concluidos: 0 });
  const [benefitTypeData, setBenefitTypeData] = useState<{ type: BenefitType; count: number }[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({
    unitId: null,
    benefitType: null,
    status: null,
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      // First get benefit requests without the join that's causing issues
      let query = supabase
        .from('benefit_requests')
        .select('status, benefit_type, user_id');

      if (filters.benefitType) {
        query = query.eq('benefit_type', filters.benefitType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching dashboard data:', error);
        return;
      }

      let filteredData = data || [];

      // If filtering by unit, we need to filter by user profiles
      if (filters.unitId && filteredData.length > 0) {
        const userIds = [...new Set(filteredData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('unit_id', filters.unitId)
          .in('user_id', userIds);
        
        const validUserIds = new Set(profilesData?.map(p => p.user_id) || []);
        filteredData = filteredData.filter(r => validUserIds.has(r.user_id));
      }

      const total = filteredData.length;
      const abertos = filteredData.filter(r => r.status === 'aberta').length;
      const emAnalise = filteredData.filter(r => r.status === 'em_analise').length;
      const aprovados = filteredData.filter(r => r.status === 'aprovada').length;
      const concluidos = filteredData.filter(r => r.status === 'concluida').length;

      setStats({ total, abertos, emAnalise, aprovados, concluidos });

      // Calculate benefit type counts
      const typeData = benefitTypes.map(type => ({
        type,
        count: filteredData.filter(r => r.benefit_type === type).length,
      }));
      setBenefitTypeData(typeData);
    } catch (err) {
      console.error('Error in fetchDashboardData:', err);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard - Revalle Gestão do DP</h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhamento em tempo real das solicitações e análises do DP
          </p>
        </div>

        {/* Filters */}
        <DashboardFiltersComponent filters={filters} onFiltersChange={setFilters} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total de Solicitações"
            value={stats.total}
            icon={FileText}
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

        {/* Benefit Category Cards */}
        <BenefitCategoryCards data={benefitTypeData} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BenefitsChart />
          <BenefitTypeChart data={benefitTypeData} />
        </div>

        {/* Recent Requests */}
        <RecentRequests />
      </div>
    </MainLayout>
  );
}
