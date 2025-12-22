import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, User, FileText, Edit, Trash2, Plus, CreditCard, Hash, Building2, Phone, Calendar, Briefcase, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogEntry {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
  user_name?: string;
}

const actionLabels: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  profile_updated_by_admin: { label: 'Perfil Editado', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30', icon: Edit },
  profile_deleted: { label: 'Perfil Excluído', color: 'bg-destructive/20 text-destructive border-destructive/30', icon: Trash2 },
  user_role_assigned: { label: 'Cargo Atribuído', color: 'bg-green-500/20 text-green-500 border-green-500/30', icon: Plus },
  user_role_changed: { label: 'Cargo Alterado', color: 'bg-warning/20 text-warning border-warning/30', icon: Edit },
  user_role_removed: { label: 'Cargo Removido', color: 'bg-destructive/20 text-destructive border-destructive/30', icon: Trash2 },
  benefit_request_created: { label: 'Solicitação Criada', color: 'bg-green-500/20 text-green-500 border-green-500/30', icon: Plus },
  benefit_request_status_changed: { label: 'Status Alterado', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30', icon: FileText },
  benefit_request_deleted: { label: 'Solicitação Excluída', color: 'bg-destructive/20 text-destructive border-destructive/30', icon: Trash2 },
  credit_limit_updated: { label: 'Limite Alterado', color: 'bg-warning/20 text-warning border-warning/30', icon: CreditCard },
  collaborator_created: { label: 'Colaborador Criado', color: 'bg-green-500/20 text-green-500 border-green-500/30', icon: Plus },
  collaborator_deleted: { label: 'Colaborador Excluído', color: 'bg-destructive/20 text-destructive border-destructive/30', icon: Trash2 },
  document_uploaded: { label: 'Documento Enviado', color: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30', icon: Upload },
  document_deleted: { label: 'Documento Excluído', color: 'bg-destructive/20 text-destructive border-destructive/30', icon: Trash2 },
};

interface LogDetailsSheetProps {
  log: LogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogDetailsSheet({ log, open, onOpenChange }: LogDetailsSheetProps) {
  if (!log) return null;

  const actionInfo = actionLabels[log.action] || { 
    label: log.action, 
    color: 'bg-muted text-muted-foreground border-muted', 
    icon: FileText 
  };
  const IconComponent = actionInfo.icon;
  const details = log.details || {};

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      // Check if it looks like a currency value
      if (value >= 0 && value < 1000000) {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
      return value.toString();
    }
    return String(value);
  };

  const renderDetailItem = (label: string, value: unknown, icon?: React.ReactNode) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="flex items-start gap-3 py-2">
        {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-foreground">{String(value)}</p>
        </div>
      </div>
    );
  };

  const renderChangeItem = (label: string, oldValue: unknown, newValue: unknown) => {
    if (oldValue === undefined && newValue === undefined) return null;
    return (
      <div className="py-2">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 rounded bg-destructive/10 text-destructive line-through">
            {formatValue(oldValue)}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="px-2 py-1 rounded bg-green-500/10 text-green-500">
            {formatValue(newValue)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${actionInfo.color.split(' ')[0]}`}>
              <IconComponent className={`h-5 w-5 ${actionInfo.color.split(' ')[1]}`} />
            </div>
            <div>
              <SheetTitle className="text-lg">{actionInfo.label}</SheetTitle>
              <SheetDescription>
                {format(new Date(log.created_at), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
              </SheetDescription>
            </div>
          </div>
          <Badge variant="outline" className={`w-fit ${actionInfo.color}`}>
            {actionInfo.label}
          </Badge>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Executor da Ação */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Executado por
            </h4>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">{log.user_name || 'Sistema'}</p>
              {log.user_id && (
                <p className="text-xs text-muted-foreground mt-1">ID: {log.user_id}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Informações do Registro */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Identificadores
            </h4>
            <div className="space-y-1 bg-muted/30 rounded-lg p-3">
              {renderDetailItem('ID do Log', log.id)}
              {log.entity_type && renderDetailItem('Tipo de Entidade', log.entity_type)}
              {log.entity_id && renderDetailItem('ID da Entidade', log.entity_id)}
            </div>
          </div>

          <Separator />

          {/* Detalhes da Ação */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalhes da Ação
            </h4>
            <div className="space-y-2 bg-muted/30 rounded-lg p-3">
              {/* Colaborador Info */}
              {details.full_name && renderDetailItem('Nome do Colaborador', details.full_name, <User className="h-4 w-4" />)}
              {details.target_user_id && renderDetailItem('ID do Usuário Afetado', String(details.target_user_id))}
              {details.cpf && renderDetailItem('CPF', details.cpf)}
              {details.email && renderDetailItem('Email', details.email)}
              {details.phone && renderDetailItem('Telefone', details.phone, <Phone className="h-4 w-4" />)}
              {details.birthday && renderDetailItem('Data de Nascimento', details.birthday, <Calendar className="h-4 w-4" />)}
              {details.unit_name && renderDetailItem('Unidade', details.unit_name, <Building2 className="h-4 w-4" />)}
              {details.departamento && renderDetailItem('Departamento', details.departamento, <Briefcase className="h-4 w-4" />)}
              {details.position && renderDetailItem('Cargo', details.position)}
              {details.gender && renderDetailItem('Gênero', details.gender)}
              
              {/* Benefit Request Info */}
              {details.protocol && renderDetailItem('Protocolo', details.protocol)}
              {details.benefit_type && renderDetailItem('Tipo de Benefício', details.benefit_type)}
              {details.requested_value && renderDetailItem('Valor Solicitado', `R$ ${Number(details.requested_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
              
              {/* Role Info */}
              {details.role && renderDetailItem('Cargo/Função', details.role)}
              
              {/* Changes */}
              {details.old_status !== undefined && details.new_status !== undefined && 
                renderChangeItem('Status', details.old_status, details.new_status)}
              
              {details.old_role !== undefined && details.new_role !== undefined && 
                renderChangeItem('Cargo', details.old_role, details.new_role)}
              
              {details.old_credit_limit !== undefined && details.new_credit_limit !== undefined && 
                renderChangeItem('Limite de Crédito', details.old_credit_limit, details.new_credit_limit)}

              {/* If no structured details, show raw JSON */}
              {Object.keys(details).length === 0 && (
                <p className="text-sm text-muted-foreground italic">Nenhum detalhe adicional registrado</p>
              )}
            </div>
          </div>

          {/* Raw Data (collapsed by default) */}
          {Object.keys(details).length > 0 && (
            <>
              <Separator />
              <details className="group">
                <summary className="text-sm font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Ver dados brutos (JSON)
                </summary>
                <pre className="mt-3 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
