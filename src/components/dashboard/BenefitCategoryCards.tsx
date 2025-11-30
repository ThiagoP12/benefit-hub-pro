import { Car, Pill, Wrench, Fuel, Pencil, Glasses, ClipboardList } from 'lucide-react';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';
import { cn } from '@/lib/utils';

interface BenefitCategoryCardsProps {
  data: { type: BenefitType; count: number }[];
}

const benefitConfig: Record<BenefitType, { icon: React.ElementType; colorClass: string; bgClass: string }> = {
  autoescola: { icon: Car, colorClass: 'text-benefit-autoescola', bgClass: 'bg-benefit-autoescola/15' },
  farmacia: { icon: Pill, colorClass: 'text-benefit-farmacia', bgClass: 'bg-benefit-farmacia/15' },
  oficina: { icon: Wrench, colorClass: 'text-benefit-oficina', bgClass: 'bg-benefit-oficina/15' },
  vale_gas: { icon: Fuel, colorClass: 'text-benefit-vale-gas', bgClass: 'bg-benefit-vale-gas/15' },
  papelaria: { icon: Pencil, colorClass: 'text-benefit-papelaria', bgClass: 'bg-benefit-papelaria/15' },
  otica: { icon: Glasses, colorClass: 'text-benefit-otica', bgClass: 'bg-benefit-otica/15' },
  outros: { icon: ClipboardList, colorClass: 'text-benefit-outros', bgClass: 'bg-benefit-outros/15' },
};

export function BenefitCategoryCards({ data }: BenefitCategoryCardsProps) {
  const total = data.reduce((acc, item) => acc + item.count, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Solicitações por Categoria</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {data.map((item) => {
          const config = benefitConfig[item.type];
          const Icon = config.icon;
          const percentage = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;

          return (
            <div
              key={item.type}
              className={cn(
                'rounded-lg p-4 transition-all hover:scale-105 cursor-pointer',
                config.bgClass,
                'border border-transparent hover:border-border'
              )}
            >
              <div className={cn('flex items-center justify-center mb-2', config.colorClass)}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold text-foreground text-center">{item.count}</p>
              <p className="text-xs text-muted-foreground text-center truncate">
                {benefitTypeLabels[item.type].replace(/^[^\s]+\s/, '')}
              </p>
              <p className={cn('text-xs font-medium text-center mt-1', config.colorClass)}>
                {percentage}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
