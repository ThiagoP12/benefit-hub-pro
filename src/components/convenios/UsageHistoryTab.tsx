import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Partnership, PartnershipUsage } from '@/types/partnerships';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UsageHistoryTabProps {
  partnerships: Partnership[];
}

export function UsageHistoryTab({ partnerships }: UsageHistoryTabProps) {
  const [usage, setUsage] = useState<PartnershipUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [partnershipFilter, setPartnershipFilter] = useState('all');

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    const { data, error } = await supabase
      .from('partnership_usage')
      .select('*')
      .order('usage_date', { ascending: false });

    if (error) {
      console.error('Error fetching usage:', error);
    } else {
      // Fetch related data
      const userIds = [...new Set((data || []).map(u => u.user_id))];
      const partnershipIds = [...new Set((data || []).map(u => u.partnership_id))];

      const [profilesRes, partnershipsRes] = await Promise.all([
        userIds.length ? supabase.from('profiles').select('user_id, full_name').in('user_id', userIds) : { data: [] },
        partnershipIds.length ? supabase.from('partnerships').select('id, name').in('id', partnershipIds) : { data: [] },
      ]);

      const profilesMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      const partnershipsMap = new Map((partnershipsRes.data || []).map(p => [p.id, p]));

      const usageWithRelations = (data || []).map(item => ({
        ...item,
        profiles: profilesMap.get(item.user_id),
        partnerships: partnershipsMap.get(item.partnership_id),
      }));

      setUsage(usageWithRelations as PartnershipUsage[]);
    }
    setLoading(false);
  };

  const filteredUsage = usage.filter(u => {
    const matchesSearch = 
      u.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.partnerships?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesPartnership = partnershipFilter === 'all' || u.partnership_id === partnershipFilter;
    return matchesSearch && matchesPartnership;
  });

  const totalAmount = filteredUsage.reduce((sum, u) => sum + Number(u.amount), 0);

  const handleExport = () => {
    if (filteredUsage.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = ['Data', 'Colaborador', 'Convênio', 'Valor', 'Observações'];
    const rows = filteredUsage.map(u => [
      format(new Date(u.usage_date), 'dd/MM/yyyy'),
      u.profiles?.full_name || 'N/A',
      u.partnerships?.name || 'N/A',
      formatCurrency(u.amount),
      u.notes || '',
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_convenios_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exportação realizada!');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por colaborador ou convênio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={partnershipFilter} onValueChange={setPartnershipFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Convênio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {partnerships.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-semibold">{formatCurrency(totalAmount)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      ) : filteredUsage.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum registro de uso encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsage.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {format(new Date(item.usage_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.profiles?.full_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {item.partnerships?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{formatCurrency(item.amount)}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {item.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
