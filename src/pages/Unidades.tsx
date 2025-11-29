import { MainLayout } from '@/components/layout/MainLayout';
import { mockUnits, mockUsers, mockBenefitRequests } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Users, FileText, MapPin } from 'lucide-react';

export default function Unidades() {
  const getUnitStats = (unitId: number) => {
    const users = mockUsers.filter((u) => u.unitId === unitId);
    const requests = mockBenefitRequests.filter((r) => {
      const user = mockUsers.find((u) => u.id === r.userId);
      return user?.unitId === unitId;
    });
    return { userCount: users.length, requestCount: requests.length };
  };

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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Unidade
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockUnits.map((unit, index) => {
            const stats = getUnitStats(unit.id);
            return (
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
                        <span>{unit.region}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-medium">Colaboradores</span>
                      </div>
                      <p className="mt-1 text-2xl font-bold text-foreground">{stats.userCount}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs font-medium">Solicitações</span>
                      </div>
                      <p className="mt-1 text-2xl font-bold text-foreground">{stats.requestCount}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <Button variant="outline" className="w-full">
                      Gerenciar Unidade
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
