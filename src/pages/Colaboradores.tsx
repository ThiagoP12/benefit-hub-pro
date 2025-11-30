import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { roleLabels, UserRole } from '@/types/benefits';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Phone, Building2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  cpf: string | null;
  units: {
    name: string;
  } | null;
  user_roles: {
    role: UserRole;
  }[];
}

export default function Colaboradores() {
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email, cpf, units(name), user_roles(role)')
      .order('full_name');

    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      setProfiles(data as unknown as Profile[]);
    }
    setLoading(false);
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (profile.cpf && profile.cpf.includes(search)) ||
    profile.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleLabel = (profile: Profile) => {
    const role = profile.user_roles?.[0]?.role || 'colaborador';
    return roleLabels[role] || 'Colaborador';
  };

  const getRoleVariant = (profile: Profile) => {
    const role = profile.user_roles?.[0]?.role;
    return role === 'admin' ? 'default' : 'secondary';
  };

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
              placeholder="Buscar por nome, CPF ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))
          ) : filteredProfiles.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhum colaborador encontrado
            </div>
          ) : (
            filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all duration-200 animate-fade-in"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-semibold">
                    {profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{profile.full_name}</h3>
                    {profile.cpf && (
                      <p className="text-sm text-muted-foreground">
                        CPF: {profile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  {profile.units && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{profile.units.name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <Badge variant={getRoleVariant(profile)}>
                    {getRoleLabel(profile)}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Ver Perfil
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
