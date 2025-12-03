import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { benefitTypeLabels, statusLabels, BenefitStatus, BenefitType } from '@/types/benefits';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NewBenefitDialog } from '@/components/benefits/NewBenefitDialog';
import { BenefitDetailsDialog } from '@/components/benefits/BenefitDetailsDialog';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, Download, Eye, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface BenefitRequest {
  id: string;
  protocol: string;
  benefit_type: BenefitType;
  status: BenefitStatus;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    phone: string | null;
  } | null;
}

export default function Solicitacoes() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [whatsappFilter, setWhatsappFilter] = useState('');
  const [requests, setRequests] = useState<BenefitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    // Buscar todas as solicitações
    const { data: requestsData, error: requestsError } = await supabase
      .from('benefit_requests')
      .select('id, protocol, benefit_type, status, created_at, user_id')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      setLoading(false);
      return;
    }

    // Buscar profiles para obter nomes e telefones
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone');

    // Combinar dados
    const requestsWithProfiles = requestsData.map((request) => {
      const profile = profilesData?.find((p) => p.user_id === request.user_id);
      return {
        ...request,
        profiles: profile ? { full_name: profile.full_name, phone: profile.phone } : null,
      };
    });

    setRequests(requestsWithProfiles as unknown as BenefitRequest[]);
    setLoading(false);
  };

  const filteredRequests = requests.filter((request) => {
    // Filtro de busca geral (protocolo)
    const matchesSearch = 
      request.protocol.toLowerCase().includes(search.toLowerCase());
    
    // Filtro de status
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    // Filtro de tipo
    const matchesType = typeFilter === 'all' || request.benefit_type === typeFilter;
    
    // Filtro de nome do colaborador
    const matchesName = !nameFilter || 
      request.profiles?.full_name?.toLowerCase().includes(nameFilter.toLowerCase());
    
    // Filtro de WhatsApp
    const matchesWhatsapp = !whatsappFilter || 
      request.profiles?.phone?.includes(whatsappFilter);
    
    // Filtro de data inicial
    const requestDate = new Date(request.created_at);
    const matchesStartDate = !startDate || requestDate >= new Date(startDate);
    
    // Filtro de data final
    const matchesEndDate = !endDate || requestDate <= new Date(endDate + 'T23:59:59');
    
    return matchesSearch && matchesStatus && matchesType && matchesName && 
           matchesWhatsapp && matchesStartDate && matchesEndDate;
  });

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const handleViewDetails = async (requestId: string, index: number) => {
    // Buscar a solicitação
    const { data: requestData, error: requestError } = await supabase
      .from('benefit_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) {
      console.error('Error fetching request details:', requestError);
      return;
    }

    // Se o status for "aberta", atualizar para "em_analise"
    if (requestData.status === 'aberta') {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from('benefit_requests')
        .update({
          status: 'em_analise',
          reviewed_by: userData?.user?.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating status:', updateError);
        toast.error('Erro ao atualizar status');
      } else {
        // Atualizar o status local
        requestData.status = 'em_analise';
        // Atualizar a lista
        setRequests(prev => prev.map(r => 
          r.id === requestId ? { ...r, status: 'em_analise' } : r
        ));
        toast.info('Status alterado para "Em Andamento"');
      }
    }

    // Buscar o perfil do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        full_name,
        cpf,
        phone,
        unit_id,
        units (
          name
        )
      `)
      .eq('user_id', requestData.user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Combinar os dados
    const combinedData = {
      ...requestData,
      profiles: profileData,
    };

    setSelectedRequest(combinedData);
    setCurrentIndex(index);
    setDetailsOpen(true);
  };

  const handleNavigate = async (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < filteredRequests.length) {
      const request = filteredRequests[newIndex];
      await handleViewDetails(request.id, newIndex);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setNameFilter('');
    setWhatsappFilter('');
    setCurrentPage(1);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Solicitações de Benefícios</h1>
            <p className="mt-1 text-muted-foreground">
              Cadastre e gerencie solicitações de benefícios dos colaboradores
            </p>
          </div>
          <div className="flex gap-3">
            <NewBenefitDialog onSuccess={fetchRequests} />
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          {/* Primeira linha de filtros */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {(Object.keys(statusLabels) as BenefitStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Benefício" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {(Object.keys(benefitTypeLabels) as BenefitType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {benefitTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Segunda linha de filtros */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data Inicial</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 w-[160px]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data Final</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 w-[160px]"
                />
              </div>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[180px]">
              <Label className="text-xs text-muted-foreground">Nome do Colaborador</Label>
              <Input
                placeholder="Filtrar por nome..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 min-w-[160px]">
              <Label className="text-xs text-muted-foreground">WhatsApp</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={whatsappFilter}
                onChange={(e) => setWhatsappFilter(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Protocolo</TableHead>
                <TableHead className="font-semibold">Colaborador</TableHead>
                <TableHead className="font-semibold">WhatsApp</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma solicitação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request, idx) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + idx;
                  return (
                    <TableRow key={request.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-sm">{request.protocol}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {request.profiles?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                          </div>
                          <span className="font-medium">{request.profiles?.full_name || 'Usuário'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {request.profiles?.phone || '-'}
                      </TableCell>
                      <TableCell>{benefitTypeLabels[request.benefit_type]}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleViewDetails(request.id, globalIndex)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredRequests.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {/* Dialog de Detalhes */}
      {selectedRequest && (
        <BenefitDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          request={selectedRequest}
          onSuccess={fetchRequests}
          currentIndex={currentIndex}
          totalItems={filteredRequests.length}
          onNavigate={handleNavigate}
        />
      )}
    </MainLayout>
  );
}
