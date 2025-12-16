import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  default: 'bg-card border-border',
  primary: 'bg-primary/10 border-primary/20',
  success: 'bg-success/10 border-success/20',
  warning: 'bg-warning/10 border-warning/20',
  info: 'bg-info/10 border-info/20',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  info: 'bg-info text-info-foreground',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-xl border p-4 sm:p-5 lg:p-6 transition-all duration-200 hover:shadow-md hover:border-primary/30 animate-fade-in',
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              'mt-1 text-xs sm:text-sm font-semibold truncate',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
              <span className="hidden sm:inline"> vs mês anterior</span>
            </p>
          )}
        </div>
        <div className={cn('rounded-lg sm:rounded-xl p-2 sm:p-3 shrink-0', iconStyles[variant])}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 shrink-0" />
        </div>
      </div>
    </div>
  );
}
