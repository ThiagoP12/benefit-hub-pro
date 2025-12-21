import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Bell, Shield, Database, Timer, Car, Pill, Wrench, Cylinder, BookOpen, Glasses, HelpCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BenefitType } from '@/types/benefits';
import { cn } from '@/lib/utils';

interface SlaConfig {
  benefit_type: BenefitType;
  green_hours: number;
  yellow_hours: number;
}

const benefitTypeIcons: Record<BenefitType, React.ElementType> = {
  autoescola: Car,
  farmacia: Pill,
  oficina: Wrench,
  vale_gas: Cylinder,
  papelaria: BookOpen,
  otica: Glasses,
  outros: HelpCircle,
};

const benefitTypeLabelsLocal: Record<BenefitType, string> = {
  autoescola: 'Autoescola',
  farmacia: 'Farmácia',
  oficina: 'Oficina',
  vale_gas: 'Vale Gás',
  papelaria: 'Papelaria',
  otica: 'Ótica',
  outros: 'Outros',
};

const defaultSlaConfigs: SlaConfig[] = [
  { benefit_type: 'autoescola', green_hours: 2, yellow_hours: 6 },
  { benefit_type: 'farmacia', green_hours: 2, yellow_hours: 6 },
  { benefit_type: 'oficina', green_hours: 2, yellow_hours: 6 },
  { benefit_type: 'vale_gas', green_hours: 2, yellow_hours: 6 },
  { benefit_type: 'papelaria', green_hours: 2, yellow_hours: 6 },
  { benefit_type: 'otica', green_hours: 2, yellow_hours: 6 },
  { benefit_type: 'outros', green_hours: 2, yellow_hours: 6 },
];

export default function Configuracoes() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [slaConfigs, setSlaConfigs] = useState<SlaConfig[]>(defaultSlaConfigs);
  const [savingSla, setSavingSla] = useState(false);
  const [loadingSla, setLoadingSla] = useState(true);

  // Load SLA configs from Supabase
  useEffect(() => {
    const fetchSlaConfigs = async () => {
      if (!isAdmin) {
        setLoadingSla(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('sla_configs')
          .select('benefit_type, green_hours, yellow_hours');

        if (error) {
          console.error('Error fetching SLA configs:', error);
          toast.error('Erro ao carregar configurações de SLA');
        } else if (data && data.length > 0) {
          const configs = data.map(item => ({
            benefit_type: item.benefit_type as BenefitType,
            green_hours: item.green_hours,
            yellow_hours: item.yellow_hours,
          }));
          setSlaConfigs(configs);
        }
      } catch (err) {
        console.error('Error in fetchSlaConfigs:', err);
      } finally {
        setLoadingSla(false);
      }
    };

    fetchSlaConfigs();
  }, [isAdmin]);

  const handleSlaChange = (benefitType: BenefitType, field: 'green_hours' | 'yellow_hours', value: number) => {
    setSlaConfigs(prev => prev.map(config => 
      config.benefit_type === benefitType 
        ? { ...config, [field]: value }
        : config
    ));
  };

  const handleSaveSla = async () => {
    setSavingSla(true);
    try {
      // Update each SLA config in the database
      for (const config of slaConfigs) {
        const { error } = await supabase
          .from('sla_configs')
          .update({
            green_hours: config.green_hours,
            yellow_hours: config.yellow_hours,
          })
          .eq('benefit_type', config.benefit_type);

        if (error) {
          throw error;
        }
      }
      toast.success('Configurações de SLA salvas com sucesso!');
    } catch (err) {
      console.error('Error saving SLA configs:', err);
      toast.error('Erro ao salvar configurações de SLA');
    } finally {
      setSavingSla(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>

        <Tabs defaultValue="empresa" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="empresa" className="gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="sla" className="gap-2">
                <Timer className="h-4 w-4" />
                SLA
              </TabsTrigger>
            )}
            <TabsTrigger value="seguranca" className="gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="integracao" className="gap-2">
              <Database className="h-4 w-4" />
              Integração
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Dados da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input id="company-name" placeholder="Sua Empresa LTDA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail de Contato</Label>
                  <Input id="email" type="email" placeholder="contato@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(00) 0000-0000" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button>Salvar Alterações</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notificacoes" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Preferências de Notificação</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Novas Solicitações</p>
                    <p className="text-sm text-muted-foreground">Receber notificação quando uma nova solicitação for criada</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Atualizações de Status</p>
                    <p className="text-sm text-muted-foreground">Receber notificação quando o status for alterado</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Relatórios Semanais</p>
                    <p className="text-sm text-muted-foreground">Receber relatório semanal por e-mail</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="sla" className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Configuração de SLA</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Defina os limites de tempo para cada status de SLA por tipo de convênio
                    </p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 mb-6 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-success" />
                    <span className="text-sm text-muted-foreground">Verde: Dentro do prazo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-warning" />
                    <span className="text-sm text-muted-foreground">Amarelo: Atenção</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <span className="text-sm text-muted-foreground">Vermelho: Atrasado</span>
                  </div>
                </div>

                {loadingSla ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {slaConfigs.map((config) => {
                      const Icon = benefitTypeIcons[config.benefit_type];
                      return (
                        <div 
                          key={config.benefit_type}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <span className="font-medium">{benefitTypeLabelsLocal[config.benefit_type]}</span>
                          </div>

                          <div className="flex items-center gap-6 flex-1">
                            {/* Green threshold */}
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-success shrink-0" />
                              <Label className="text-sm text-muted-foreground whitespace-nowrap">Até</Label>
                              <Input
                                type="number"
                                min={1}
                                max={48}
                                value={config.green_hours}
                                onChange={(e) => handleSlaChange(config.benefit_type, 'green_hours', Number(e.target.value))}
                                className="w-20 h-9"
                              />
                              <span className="text-sm text-muted-foreground">horas</span>
                            </div>

                            {/* Yellow threshold */}
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-warning shrink-0" />
                              <Label className="text-sm text-muted-foreground whitespace-nowrap">Até</Label>
                              <Input
                                type="number"
                                min={1}
                                max={72}
                                value={config.yellow_hours}
                                onChange={(e) => handleSlaChange(config.benefit_type, 'yellow_hours', Number(e.target.value))}
                                className="w-20 h-9"
                              />
                              <span className="text-sm text-muted-foreground">horas</span>
                            </div>

                            {/* Red indicator */}
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-destructive shrink-0" />
                              <span className="text-sm text-muted-foreground">Acima de {config.yellow_hours}h</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveSla} disabled={savingSla || loadingSla}>
                    {savingSla ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Configurações de SLA'
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="seguranca" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Segurança da Conta</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <Button>Alterar Senha</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integracao" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">APIs e Integrações</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>URL da API WhatsApp</Label>
                  <Input placeholder="https://api.z-api.io/instances/..." />
                </div>
                <div className="space-y-2">
                  <Label>Token de Acesso</Label>
                  <Input type="password" placeholder="••••••••••••••••" />
                </div>
                <Button>Salvar Configurações</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}