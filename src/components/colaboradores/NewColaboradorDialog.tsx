import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCnpj } from '@/lib/utils';

interface Unit {
  id: string;
  name: string;
  code: string;
}

export function NewColaboradorDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    birthday: '',
    unit_id: '',
    role: '',
  });

  useEffect(() => {
    if (open) {
      fetchUnits();
    }
  }, [open]);

  const fetchUnits = async () => {
    const { data, error } = await supabase.from('units').select('*').order('name');
    if (error) {
      console.error('Erro ao buscar unidades:', error);
      toast.error('Erro ao carregar unidades');
    } else if (data && data.length > 0) {
      console.log('Unidades carregadas do banco:', data);
      setUnits(data as Unit[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create profile for new collaborator
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          user_id: crypto.randomUUID(),
          full_name: formData.full_name,
          email: `${formData.cpf}@temp.com`, // Email temporário baseado no CPF
          cpf: formData.cpf,
          birthday: formData.birthday,
          unit_id: formData.unit_id,
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      toast.success('Colaborador cadastrado com sucesso!');
      
      setOpen(false);
      setFormData({
        full_name: '',
        cpf: '',
        birthday: '',
        unit_id: '',
        role: '',
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao cadastrar colaborador:', error);
      toast.error(error.message || 'Erro ao cadastrar colaborador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Colaborador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Digite o nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              required
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
              placeholder="000.000.000-00"
              maxLength={11}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthday">Data de Aniversário *</Label>
            <Input
              id="birthday"
              required
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              placeholder="01/10"
              maxLength={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unidade *</Label>
            <Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })}>
              <SelectTrigger id="unit">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent className="z-50">
                {units.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">Carregando unidades...</div>
                ) : (
                  units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} - {formatCnpj(unit.code)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Cargo *</Label>
            <Input
              id="role"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Ex: Vendedor, Gerente, Assistente"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
