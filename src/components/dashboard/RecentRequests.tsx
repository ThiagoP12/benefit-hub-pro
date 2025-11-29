import { Link } from 'react-router-dom';
import { mockBenefitRequests } from '@/data/mockData';
import { benefitTypeLabels, statusLabels } from '@/types/benefits';
import { StatusBadge } from '@/components/ui/status-badge';
import { ArrowRight } from 'lucide-react';

export function RecentRequests() {
  const recentRequests = mockBenefitRequests.slice(0, 5);

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
        {recentRequests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {request.user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{request.user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {request.protocol} • {benefitTypeLabels[request.benefitType]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">
                {request.createdAt.toLocaleDateString('pt-BR')}
              </span>
              <StatusBadge status={request.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
