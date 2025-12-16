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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { BenefitRequest, benefitTypeLabels } from '@/types/benefits';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, AlertCircle, Clock, History } from 'lucide-react';
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
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header fixo */}
        <div className="px-6 pt-6 pb-4">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-left flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico de Solicitações
            </SheetTitle>
            {colaborador && (
              <p className="text-sm text-muted-foreground font-normal">
                {colaborador.full_name}
              </p>
            )}
          </SheetHeader>
          
          {!loading && requests.length > 0 && (
            <div className="mt-4">
              <Badge variant="secondary" className="text-xs">
                {requests.length} {requests.length === 1 ? 'solicitação' : 'solicitações'}
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* Conteúdo scrollável */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))
            ) : requests.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                  <Clock className="h-8 w-8 opacity-50" />
                </div>
                <p className="font-medium">Nenhuma solicitação</p>
                <p className="text-sm mt-1">Este colaborador ainda não possui solicitações</p>
              </div>
            ) : (
              requests.map((request, index) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-3 transition-colors hover:border-border/80 hover:bg-accent/30"
                >
                  {/* Topo: Protocolo e Data */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {request.protocol}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(request.created_at)}
                    </span>
                  </div>

                  {/* Tipo de Benefício */}
                  <div className="text-sm font-medium text-foreground">
                    {benefitTypeLabels[request.benefit_type]}
                  </div>

                  {/* Status e Valor */}
                  <div className="flex items-center justify-between pt-1">
                    <StatusBadge status={request.status} />
                    
                    {request.approved_value && (
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        R$ {request.approved_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>

                  {/* Área de Decisão Condicional */}
                  {request.status === 'concluida' && request.pdf_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                      onClick={() => window.open(request.pdf_url!, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Visualizar PDF
                    </Button>
                  )}

                  {request.status === 'recusada' && request.rejection_reason && (
                    <div className="flex items-start gap-2.5 rounded-md bg-destructive/10 border border-destructive/20 p-3 mt-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="text-sm min-w-0">
                        <span className="font-medium text-destructive">Motivo:</span>
                        <p className="text-destructive/80 mt-0.5 break-words">{request.rejection_reason}</p>
                      </div>
                    </div>
                  )}

                  {request.status === 'aprovada' && !request.pdf_url && (
                    <div className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-3 mt-2">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm text-amber-700 dark:text-amber-300">Aprovado - Aguardando PDF</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
