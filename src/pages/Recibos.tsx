import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockPaymentReceipts } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Search, Download, Eye, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Recibos() {
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');

  const filteredReceipts = mockPaymentReceipts.filter((receipt) => {
    const matchesSearch = 
      receipt.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      receipt.month.toLowerCase().includes(search.toLowerCase());
    const matchesYear = yearFilter === 'all' || receipt.year.toString() === yearFilter;
    return matchesSearch && matchesYear;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recibos de Pagamento</h1>
            <p className="mt-1 text-muted-foreground">
              Visualize e faça download dos recibos de pagamento
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Recibos</p>
                <p className="text-2xl font-bold text-foreground">{mockPaymentReceipts.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <Download className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Último Mês</p>
                <p className="text-2xl font-bold text-foreground">Janeiro/2024</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <Eye className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Colaboradores</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(mockPaymentReceipts.map(r => r.userId)).size}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por colaborador ou mês..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Anos</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Colaborador</TableHead>
                <TableHead className="font-semibold">Período</TableHead>
                <TableHead className="font-semibold">Salário Bruto</TableHead>
                <TableHead className="font-semibold">Descontos</TableHead>
                <TableHead className="font-semibold">Salário Líquido</TableHead>
                <TableHead className="font-semibold">Emissão</TableHead>
                <TableHead className="font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {receipt.user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium">{receipt.user?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {receipt.month}/{receipt.year}
                  </TableCell>
                  <TableCell className="text-success font-semibold">
                    {formatCurrency(receipt.grossSalary)}
                  </TableCell>
                  <TableCell className="text-destructive">
                    {formatCurrency(receipt.deductions)}
                  </TableCell>
                  <TableCell className="font-bold text-foreground">
                    {formatCurrency(receipt.netSalary)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {receipt.createdAt.toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Ver
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Baixar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Mostrando {filteredReceipts.length} de {mockPaymentReceipts.length} recibos</span>
        </div>
      </div>
    </MainLayout>
  );
}
