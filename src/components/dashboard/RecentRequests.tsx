import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { benefitTypeLabels } from '@/types/benefits';
import { StatusBadge } from '@/components/ui/status-badge';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { BenefitStatus, BenefitType } from '@/types/benefits';

interface RecentRequest {
  id: string;
  protocol: string;
  benefit_type: BenefitType;
  status: BenefitStatus;
  created_at: string;
  user_id: string;
  full_name?: string;
}

export function RecentRequests() {
  const [requests, setRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentRequests = async () => {
      try {
        // Fetch benefit requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('benefit_requests')
          .select('id, protocol, benefit_type, status, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(5);

        if (requestsError) {
          console.error('Error fetching recent requests:', requestsError);
          setLoading(false);
          return;
        }

        if (!requestsData || requestsData.length === 0) {
          setRequests([]);
          setLoading(false);
          return;
        }

        // Fetch profiles separately
        const userIds = [...new Set(requestsData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.full_name]) || []);

        // Merge data
        const mergedData = requestsData.map(req => ({
          ...req,
          full_name: profilesMap.get(req.user_id) || 'Usuário'
        }));

        setRequests(mergedData);
      } catch (err) {
        console.error('Error in fetchRecentRequests:', err);
      }
      setLoading(false);
    };

    fetchRecentRequests();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="p-6 border-b border-border">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Solicitações Recentes</h3>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          Nenhuma solicitação recente encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card animate-slide-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Solicitações Recentes</h3>
        <Link 
          to="/solicitacoes" 
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Ver todas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {request.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{request.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {request.protocol} • {benefitTypeLabels[request.benefit_type]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                {new Date(request.created_at).toLocaleDateString('pt-BR')}
              </span>
              <StatusBadge status={request.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
