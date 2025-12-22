import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewPartnershipDialog } from '@/components/convenios/NewPartnershipDialog';
import { EditPartnershipDialog } from '@/components/convenios/EditPartnershipDialog';
import { CreditLimitsTab } from '@/components/convenios/CreditLimitsTab';
import { UsageHistoryTab } from '@/components/convenios/UsageHistoryTab';
import { 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  MoreVertical,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Partnership, partnershipTypeLabels } from '@/types/partnerships';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Convenios() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editPartnership, setEditPartnership] = useState<Partnership | null>(null);
  const [deletePartnership, setDeletePartnership] = useState<Partnership | null>(null);

  useEffect(() => {
    fetchPartnerships();
  }, []);

  const fetchPartnerships = async () => {
    const { data, error } = await supabase
      .from('partnerships')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching partnerships:', error);
      toast.error('Erro ao carregar convênios');
    } else {
      setPartnerships(data || []);
    }
    setLoading(false);
  };

  const handleToggleActive = async (partnership: Partnership) => {
    const { error } = await supabase
      .from('partnerships')
      .update({ is_active: !partnership.is_active })
      .eq('id', partnership.id);

    if (error) {
      toast.error('Erro ao atualizar convênio');
    } else {
      toast.success(partnership.is_active ? 'Convênio desativado' : 'Convênio ativado');
      fetchPartnerships();
    }
  };

  const handleDelete = async () => {
    if (!deletePartnership) return;

    const { error } = await supabase
      .from('partnerships')
      .delete()
      .eq('id', deletePartnership.id);

    if (error) {
      toast.error('Erro ao excluir convênio');
    } else {
      toast.success('Convênio excluído com sucesso');
      fetchPartnerships();
    }
    setDeletePartnership(null);
  };

  const filteredPartnerships = partnerships.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    partnershipTypeLabels[p.type]?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = partnerships.filter(p => p.is_active).length;
  const inactiveCount = partnerships.filter(p => !p.is_active).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Convênios</h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie parcerias com estabelecimentos
            </p>
          </div>
          <NewPartnershipDialog onSuccess={fetchPartnerships} />
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Convênios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerships.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{inactiveCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="partnerships" className="space-y-4">
          <TabsList>
            <TabsTrigger value="partnerships">Parcerias</TabsTrigger>
            <TabsTrigger value="limits">Limites de Crédito</TabsTrigger>
            <TabsTrigger value="history">Histórico de Uso</TabsTrigger>
          </TabsList>

          <TabsContent value="partnerships" className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar convênios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Partnerships Grid */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPartnerships.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum convênio encontrado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPartnerships.map((partnership) => (
                  <Card key={partnership.id} className={!partnership.is_active ? 'opacity-60' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {partnership.name}
                          </h3>
                          <Badge variant="secondary" className="mt-1">
                            {partnershipTypeLabels[partnership.type] || partnership.type}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditPartnership(partnership)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(partnership)}>
                              {partnership.is_active ? (
                                <>
                                  <ToggleLeft className="h-4 w-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletePartnership(partnership)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        {partnership.contact_name && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0" />
                            <span className="truncate">{partnership.contact_name}</span>
                          </div>
                        )}
                        {partnership.contact_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span>{partnership.contact_phone}</span>
                          </div>
                        )}
                        {partnership.contact_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{partnership.contact_email}</span>
                          </div>
                        )}
                        {(partnership.city || partnership.state) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {[partnership.city, partnership.state].filter(Boolean).join(' - ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border">
                        <Badge variant={partnership.is_active ? 'default' : 'secondary'}>
                          {partnership.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="limits">
            <CreditLimitsTab partnerships={partnerships} />
          </TabsContent>

          <TabsContent value="history">
            <UsageHistoryTab partnerships={partnerships} />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        {editPartnership && (
          <EditPartnershipDialog
            partnership={editPartnership}
            open={!!editPartnership}
            onOpenChange={(open) => !open && setEditPartnership(null)}
            onSuccess={() => {
              fetchPartnerships();
              setEditPartnership(null);
            }}
          />
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletePartnership} onOpenChange={(open) => !open && setDeletePartnership(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Convênio</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o convênio "{deletePartnership?.name}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
