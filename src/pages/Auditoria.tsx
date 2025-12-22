import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { LogDetailsSheet } from '@/components/auditoria/LogDetailsSheet';
import { Search, Clock, User, FileText, Edit, Trash2, Plus, CreditCard, CalendarIcon, X, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
};

const actionOptions = Object.entries(actionLabels).map(([key, value]) => ({
  value: key,
  label: value.label,
}));

export default function Auditoria() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [actionFilter, setActionFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Details Sheet
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (logsError) throw logsError;

      const userIds = [...new Set(logsData?.map(log => log.user_id).filter(Boolean))];

      let userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        if (profiles) {
          userMap = profiles.reduce((acc, p) => {
            acc[p.user_id] = p.full_name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const enrichedLogs = logsData?.map(log => ({
        ...log,
        details: log.details as Record<string, unknown> | null,
        user_name: log.user_id ? userMap[log.user_id] || 'Sistema' : 'Sistema'
      })) || [];

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Text search
      const query = searchQuery.toLowerCase();
      const actionLabel = actionLabels[log.action]?.label || log.action;
      const userName = log.user_name || '';
      const details = JSON.stringify(log.details || {}).toLowerCase();
      
      const matchesSearch = 
        actionLabel.toLowerCase().includes(query) ||
        userName.toLowerCase().includes(query) ||
        details.includes(query);
      
      if (!matchesSearch) return false;

      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;

      // Date filters
      const logDate = new Date(log.created_at);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (logDate < start) return false;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }

      return true;
    });
  }, [logs, searchQuery, actionFilter, startDate, endDate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, actionFilter, startDate, endDate]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const getActionInfo = (action: string) => {
    return actionLabels[action] || { 
      label: action, 
      color: 'bg-muted text-muted-foreground border-muted', 
      icon: FileText 
    };
  };

  const formatDetails = (log: LogEntry) => {
    const details = log.details;
    if (!details) return null;

    const parts: string[] = [];

    if (details.full_name) parts.push(`Colaborador: ${details.full_name}`);
    if (details.target_user_id) parts.push(`ID: ${String(details.target_user_id).slice(0, 8)}...`);
    if (details.protocol) parts.push(`Protocolo: ${details.protocol}`);
    if (details.benefit_type) parts.push(`Tipo: ${details.benefit_type}`);
    if (details.old_status && details.new_status) {
      parts.push(`${details.old_status} → ${details.new_status}`);
    }
    if (details.role) parts.push(`Cargo: ${details.role}`);
    if (details.old_role && details.new_role) {
      parts.push(`${details.old_role} → ${details.new_role}`);
    }
    if (details.old_credit_limit !== undefined && details.new_credit_limit !== undefined) {
      parts.push(`R$ ${Number(details.old_credit_limit).toFixed(2)} → R$ ${Number(details.new_credit_limit).toFixed(2)}`);
    }

    return parts.length > 0 ? parts.join(' | ') : null;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate(undefined);
    setEndDate(undefined);
    setActionFilter('all');
  };

  const hasActiveFilters = searchQuery || startDate || endDate || actionFilter !== 'all';

  const handleLogClick = (log: LogEntry) => {
    setSelectedLog(log);
    setSheetOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Log de Auditoria</h1>
            <p className="text-muted-foreground">Histórico de todas as ações no sistema</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Filtros</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Action Type Filter */}
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  {actionOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Start Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* End Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Atividade</CardTitle>
            <CardDescription>
              {filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''} encontrado{filteredLogs.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum registro encontrado
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {paginatedLogs.map((log) => {
                    const actionInfo = getActionInfo(log.action);
                    const IconComponent = actionInfo.icon;
                    const detailsText = formatDetails(log);

                    return (
                      <div
                        key={log.id}
                        onClick={() => handleLogClick(log)}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className={`p-2 rounded-lg ${actionInfo.color.split(' ')[0]}`}>
                          <IconComponent className={`h-4 w-4 ${actionInfo.color.split(' ')[1]}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={actionInfo.color}>
                              {actionInfo.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          
                          {detailsText && (
                            <p className="text-sm text-foreground mt-1 truncate">{detailsText}</p>
                          )}
                          
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>Por: {log.user_name}</span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground hidden sm:block">
                          Clique para detalhes
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <PaginationControls
                  currentPage={currentPage}
                  totalItems={filteredLogs.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(items) => {
                    setItemsPerPage(items);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Sheet */}
      <LogDetailsSheet 
        log={selectedLog} 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
      />
    </MainLayout>
  );
}
