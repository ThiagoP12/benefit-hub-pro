import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockBenefitRequests } from '@/data/mockData';
import { benefitTypeLabels, BenefitStatus, BenefitType } from '@/types/benefits';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NewBenefitDialog } from '@/components/benefits/NewBenefitDialog';
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

export default function Solicitacoes() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredRequests = mockBenefitRequests.filter((request) => {
    const matchesSearch = 
      request.protocol.toLowerCase().includes(search.toLowerCase()) ||
      request.user?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.benefitType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

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
            <NewBenefitDialog />
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
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="analise">Em Análise</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="negado">Negado</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de Benefício" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="autoescola">Autoescola</SelectItem>
              <SelectItem value="farmacia">Farmácia</SelectItem>
              <SelectItem value="oficina">Oficina</SelectItem>
              <SelectItem value="vale_gas">Vale Gás</SelectItem>
              <SelectItem value="papelaria">Papelaria</SelectItem>
              <SelectItem value="otica">Ótica</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
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
              {filteredRequests.map((request) => (
                <TableRow key={request.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-sm">{request.protocol}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {request.user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium">{request.user?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{benefitTypeLabels[request.benefitType]}</TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.createdAt.toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          Alterar Status
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          Histórico
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Mostrando {filteredRequests.length} de {mockBenefitRequests.length} solicitações</span>
        </div>
      </div>
    </MainLayout>
  );
}
