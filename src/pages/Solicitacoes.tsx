import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { benefitTypeLabels, statusLabels, BenefitStatus, BenefitType } from '@/types/benefits';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NewBenefitDialog } from '@/components/benefits/NewBenefitDialog';
import { BenefitDetailsDialog } from '@/components/benefits/BenefitDetailsDialog';
import { PaginationControls } from '@/components/ui/pagination-controls';
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
import { Search, Filter, Download, Eye, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface BenefitRequest {
  id: string;
  protocol: string;
  benefit_type: BenefitType;
  status: BenefitStatus;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

export default function Solicitacoes() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [requests, setRequests] = useState<BenefitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

    // Buscar profiles para obter nomes
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name');

    // Combinar dados
    const requestsWithProfiles = requestsData.map((request) => {
      const profile = profilesData?.find((p) => p.user_id === request.user_id);
      return {
        ...request,
        profiles: profile ? { full_name: profile.full_name } : null,
      };
    });

    setRequests(requestsWithProfiles as unknown as BenefitRequest[]);
    setLoading(false);
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.protocol.toLowerCase().includes(search.toLowerCase()) ||
      request.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.benefit_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
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

  const handleViewDetails = async (requestId: string) => {
    const { data, error } = await supabase
      .from('benefit_requests')
      .select(`
        *,
        profiles (
          full_name,
          cpf,
          units (
            name
          )
        )
      `)
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Error fetching request details:', error);
      return;
    }

    setSelectedRequest(data);
    setDetailsOpen(true);
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
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por protocolo ou colaborador..."
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

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Protocolo</TableHead>
                <TableHead className="font-semibold">Colaborador</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma solicitação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request) => (
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
                    <TableCell>{benefitTypeLabels[request.benefit_type]}</TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="gap-2"
                            onClick={() => handleViewDetails(request.id)}
                          >
                            <Eye className="h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
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
        />
      )}
    </MainLayout>
  );
}
