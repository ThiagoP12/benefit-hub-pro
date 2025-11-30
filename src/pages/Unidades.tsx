import { MainLayout } from '@/components/layout/MainLayout';
import { Building2, Users, FileText, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { NewUnidadeDialog } from '@/components/unidades/NewUnidadeDialog';
import { ManageUnidadeDialog } from '@/components/unidades/ManageUnidadeDialog';

interface Unit {
  id: string;
  name: string;
  code: string;
}

const DEFAULT_UNITS: Unit[] = [
  { id: 'default-1', name: 'Revalle Juazeiro', code: '04690106000115' },
  { id: 'default-2', name: 'Revalle Bonfim', code: '04690106000387' },
  { id: 'default-3', name: 'Revalle Petrolina', code: '07717961000160' },
  { id: 'default-4', name: 'Revalle Ribeira do Pombal', code: '28098474000137' },
  { id: 'default-5', name: 'Revalle Paulo Afonso', code: '28098474000218' },
  { id: 'default-6', name: 'Revalle Alagoinhas', code: '54677520000162' },
  { id: 'default-7', name: 'Revalle Serrinha', code: '54677520000243' },
];

export default function Unidades() {
  const { data: units, isLoading, refetch } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Unidades</h1>
              <p className="mt-1 text-muted-foreground">
                Gerencie as unidades da empresa
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Unidades</h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie as unidades da empresa
            </p>
          </div>
          <NewUnidadeDialog onSuccess={() => refetch()} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(units && units.length > 0 ? units : DEFAULT_UNITS).map((unit, index) => (
            <div
              key={unit.id}
              className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">{unit.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{unit.code}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-medium">Colaboradores</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-foreground">-</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="text-xs font-medium">Solicitações</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-foreground">-</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <ManageUnidadeDialog unit={unit} onSuccess={() => refetch()} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
