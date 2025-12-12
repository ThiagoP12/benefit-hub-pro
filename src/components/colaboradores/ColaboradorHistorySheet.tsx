import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { supabase } from '@/integrations/supabase/client';
import { BenefitRequest, benefitTypeLabels } from '@/types/benefits';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ColaboradorHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador: {
    user_id: string;
    full_name: string;
  } | null;
}

export function ColaboradorHistorySheet({
  open,
  onOpenChange,
  colaborador,
}: ColaboradorHistorySheetProps) {
  const [requests, setRequests] = useState<BenefitRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && colaborador) {
      fetchRequests();
    }
  }, [open, colaborador]);

  const fetchRequests = async () => {
    if (!colaborador) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('benefit_requests')
      .select('*')
      .eq('user_id', colaborador.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-left">
            Histórico de Solicitações
          </SheetTitle>
          {colaborador && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{colaborador.full_name}</span>
              <Badge variant="secondary">
                Total: {requests.length}
              </Badge>
            </div>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-border bg-card p-4 space-y-3"
              >
                {/* Topo: Protocolo e Data */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    #{request.protocol}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(request.created_at)}
                  </span>
                </div>

                {/* Meio: Tipo de Benefício e Descrição */}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">
                    {benefitTypeLabels[request.benefit_type]}
                  </div>
                  {request.details && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {request.details}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <StatusBadge status={request.status} />
                  
                  {request.approved_value && (
                    <span className="text-sm font-medium text-success">
                      R$ {request.approved_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>

                {/* Área de Decisão Condicional */}
                {request.status === 'concluida' && request.pdf_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-success/50 text-success hover:bg-success/10"
                    onClick={() => window.open(request.pdf_url!, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Visualizar PDF
                  </Button>
                )}

                {request.status === 'recusada' && request.rejection_reason && (
                  <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium text-destructive">Motivo da Reprovação:</span>
                      <p className="text-destructive/80 mt-1">{request.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {request.status === 'aprovada' && !request.pdf_url && (
                  <div className="flex items-center gap-2 rounded-md bg-warning/10 border border-warning/30 p-3">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="text-sm text-warning">Aprovado - Aguardando PDF</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
