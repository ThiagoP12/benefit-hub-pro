import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Partnership, CreditLimit, periodTypeLabels } from '@/types/partnerships';
import { benefitTypeLabels } from '@/types/benefits';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

interface CreditLimitsTabProps {
  partnerships: Partnership[];
}

interface Profile {
  user_id: string;
  full_name: string;
  cpf: string | null;
}

export function CreditLimitsTab({ partnerships }: CreditLimitsTabProps) {
  const [limits, setLimits] = useState<CreditLimit[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    partnership_id: '',
    benefit_type: '',
    limit_amount: '',
    period_type: 'monthly',
  });

  useEffect(() => {
    fetchLimits();
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, cpf')
      .order('full_name');
    if (data) setProfiles(data);
  };

  const fetchLimits = async () => {
    const { data, error } = await supabase
      .from('credit_limits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching limits:', error);
    } else {
      // Fetch related data
      const userIds = [...new Set((data || []).map(l => l.user_id))];
      const partnershipIds = [...new Set((data || []).map(l => l.partnership_id).filter(Boolean))];

      const [profilesRes, partnershipsRes] = await Promise.all([
        userIds.length ? supabase.from('profiles').select('user_id, full_name, cpf').in('user_id', userIds) : { data: [] },
        partnershipIds.length ? supabase.from('partnerships').select('id, name').in('id', partnershipIds) : { data: [] },
      ]);

      const profilesMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      const partnershipsMap = new Map((partnershipsRes.data || []).map(p => [p.id, p]));

      const limitsWithRelations = (data || []).map(limit => ({
        ...limit,
        profiles: profilesMap.get(limit.user_id),
        partnerships: limit.partnership_id ? partnershipsMap.get(limit.partnership_id) : null,
      }));

      setLimits(limitsWithRelations as CreditLimit[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id || !formData.limit_amount) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const { error } = await supabase.from('credit_limits').insert({
      user_id: formData.user_id,
      partnership_id: formData.partnership_id || null,
      benefit_type: formData.benefit_type || null,
      limit_amount: parseFloat(formData.limit_amount),
      period_type: formData.period_type,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('Já existe um limite para esta combinação');
      } else {
        toast.error('Erro ao criar limite');
      }
    } else {
      toast.success('Limite criado com sucesso!');
      setFormData({
        user_id: '',
        partnership_id: '',
        benefit_type: '',
        limit_amount: '',
        period_type: 'monthly',
      });
      setDialogOpen(false);
      fetchLimits();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('credit_limits').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir limite');
    } else {
      toast.success('Limite excluído');
      fetchLimits();
    }
  };

  const filteredLimits = limits.filter(l => 
    l.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.partnerships?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por colaborador ou convênio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Limite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Limite de Crédito</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Colaborador *</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Convênio (opcional)</Label>
                <Select
                  value={formData.partnership_id}
                  onValueChange={(value) => setFormData({ ...formData, partnership_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os convênios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os convênios</SelectItem>
                    {partnerships.filter(p => p.is_active).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Benefício (opcional)</Label>
                <Select
                  value={formData.benefit_type}
                  onValueChange={(value) => setFormData({ ...formData, benefit_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    {Object.entries(benefitTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor Limite *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.limit_amount}
                    onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select
                    value={formData.period_type}
                    onValueChange={(value) => setFormData({ ...formData, period_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(periodTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      ) : filteredLimits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum limite configurado</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Limite</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLimits.map((limit) => (
                <TableRow key={limit.id}>
                  <TableCell className="font-medium">
                    {limit.profiles?.full_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {limit.partnerships?.name || 'Todos'}
                  </TableCell>
                  <TableCell>
                    {limit.benefit_type ? benefitTypeLabels[limit.benefit_type as keyof typeof benefitTypeLabels] : 'Todos'}
                  </TableCell>
                  <TableCell>{formatCurrency(limit.limit_amount)}</TableCell>
                  <TableCell>{periodTypeLabels[limit.period_type]}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(limit.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
