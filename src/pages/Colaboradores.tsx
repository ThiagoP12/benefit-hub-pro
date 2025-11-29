import { MainLayout } from '@/components/layout/MainLayout';
import { mockUsers, mockUnits } from '@/data/mockData';
import { roleLabels } from '@/types/benefits';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Phone, Building2 } from 'lucide-react';
import { useState } from 'react';

export default function Colaboradores() {
  const [search, setSearch] = useState('');

  const filteredUsers = mockUsers.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.cpf.includes(search)
  );

  const getUnit = (unitId: number) => mockUnits.find((u) => u.id === unitId);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Colaboradores</h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie os colaboradores cadastrados
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Colaborador
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const unit = getUnit(user.unitId);
            return (
              <div
                key={user.id}
                className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200 animate-fade-in"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">CPF: {user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{unit?.name}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {roleLabels[user.role]}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Ver Perfil
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
