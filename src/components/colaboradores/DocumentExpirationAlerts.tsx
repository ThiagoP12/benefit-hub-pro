import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, XCircle, Calendar, User, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, isPast, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpiringDocument {
  id: string;
  document_name: string;
  document_type: string;
  expiration_date: string;
  file_url: string;
  profile: {
    id: string;
    full_name: string;
  };
}

interface DocumentExpirationAlertsProps {
  onViewDocument?: (profileId: string, profileName: string) => void;
}

const DOCUMENT_TYPES: Record<string, string> = {
  contrato: 'Contrato',
  atestado: 'Atestado Médico',
  aditivo: 'Aditivo Contratual',
  certidao: 'Certidão',
  comprovante: 'Comprovante',
  declaracao: 'Declaração',
  outro: 'Outro',
};

export function DocumentExpirationAlerts({ onViewDocument }: DocumentExpirationAlertsProps) {
  const [documents, setDocuments] = useState<ExpiringDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringDocuments();
  }, []);

  const fetchExpiringDocuments = async () => {
    try {
      // Fetch documents expiring in the next 60 days or already expired
      const sixtyDaysFromNow = addDays(new Date(), 60);
      
      const { data, error } = await supabase
        .from('collaborator_documents')
        .select(`
          id,
          document_name,
          document_type,
          expiration_date,
          file_url,
          profile_id
        `)
        .not('expiration_date', 'is', null)
        .lte('expiration_date', format(sixtyDaysFromNow, 'yyyy-MM-dd'))
        .order('expiration_date', { ascending: true });

      if (error) throw error;

      // Fetch profile names
      if (data && data.length > 0) {
        const profileIds = [...new Set(data.map(d => d.profile_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', profileIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const enrichedDocs = data.map(doc => ({
          ...doc,
          profile: profileMap.get(doc.profile_id) || { id: doc.profile_id, full_name: 'Desconhecido' },
        }));

        setDocuments(enrichedDocs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching expiring documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExpirationInfo = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntil = differenceInDays(expDate, today);

    if (isPast(expDate)) {
      return {
        status: 'expired',
        label: 'Vencido',
        color: 'bg-destructive/20 text-destructive border-destructive/30',
        icon: XCircle,
        text: `Vencido há ${Math.abs(daysUntil)} dias`,
      };
    } else if (daysUntil <= 7) {
      return {
        status: 'critical',
        label: 'Crítico',
        color: 'bg-destructive/20 text-destructive border-destructive/30',
        icon: AlertTriangle,
        text: `Vence em ${daysUntil} dias`,
      };
    } else if (daysUntil <= 30) {
      return {
        status: 'warning',
        label: 'Atenção',
        color: 'bg-warning/20 text-warning border-warning/30',
        icon: AlertTriangle,
        text: `Vence em ${daysUntil} dias`,
      };
    } else {
      return {
        status: 'info',
        label: 'Próximo',
        color: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
        icon: Calendar,
        text: `Vence em ${daysUntil} dias`,
      };
    }
  };

  const expiredCount = documents.filter(d => isPast(new Date(d.expiration_date))).length;
  const warningCount = documents.filter(d => {
    const days = differenceInDays(new Date(d.expiration_date), new Date());
    return days >= 0 && days <= 30;
  }).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alertas de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            Alertas de Documentos
          </CardTitle>
          <CardDescription>
            Documentos com vencimento próximo ou vencidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum documento com vencimento próximo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas de Documentos
            </CardTitle>
            <CardDescription>
              Documentos com vencimento próximo ou vencidos
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {expiredCount > 0 && (
              <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                {expiredCount} vencido{expiredCount > 1 ? 's' : ''}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                {warningCount} próximo{warningCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {documents.map((doc) => {
              const expInfo = getExpirationInfo(doc.expiration_date);
              const IconComponent = expInfo.icon;

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => onViewDocument?.(doc.profile.id, doc.profile.full_name)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${expInfo.color.split(' ')[0]}`}>
                      <IconComponent className={`h-4 w-4 ${expInfo.color.split(' ')[1]}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm">{doc.document_name}</h4>
                        <Badge variant="outline" className={expInfo.color}>
                          {expInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {DOCUMENT_TYPES[doc.document_type] || doc.document_type}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {doc.profile.full_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(doc.expiration_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${expInfo.color.split(' ')[1]}`}>
                        {expInfo.text}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
