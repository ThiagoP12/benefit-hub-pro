import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';

const BENEFIT_COLORS: Record<BenefitType, string> = {
  autoescola: 'hsl(var(--benefit-autoescola))',
  farmacia: 'hsl(var(--benefit-farmacia))',
  oficina: 'hsl(var(--benefit-oficina))',
  vale_gas: 'hsl(var(--benefit-vale-gas))',
  papelaria: 'hsl(var(--benefit-papelaria))',
  otica: 'hsl(var(--benefit-otica))',
  outros: 'hsl(var(--benefit-outros))',
};

interface BenefitTypeChartProps {
  data?: { type: BenefitType; count: number }[];
}

export function BenefitTypeChart({ data: rawData }: BenefitTypeChartProps) {
  if (!rawData || rawData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-lg font-semibold text-foreground mb-6">Por Tipo de Benefício</h3>
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível
        </div>
      </div>
    );
  }

  const data = rawData.map(item => ({
    type: item.type,
    name: benefitTypeLabels[item.type],
    value: item.count,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <h3 className="text-lg font-semibold text-foreground mb-6">Por Tipo de Benefício</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BENEFIT_COLORS[entry.type]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
