import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { benefitTypeLabels, statusLabels, BenefitType, BenefitStatus } from '@/types/benefits';
import { cn } from '@/lib/utils';

export interface DashboardFilters {
  unitId: string | null;
  benefitType: BenefitType | null;
  status: BenefitStatus | null;
  startDate: Date | null;
  endDate: Date | null;
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

interface Unit {
  id: string;
  name: string;
  code: string;
}

export function DashboardFiltersComponent({ filters, onFiltersChange }: DashboardFiltersProps) {
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase.from('units').select('*').order('name');
      if (data) setUnits(data);
    };
    fetchUnits();
  }, []);

  const clearFilters = () => {
    onFiltersChange({
      unitId: null,
      benefitType: null,
      status: null,
      startDate: null,
      endDate: null,
    });
  };

  const hasActiveFilters = filters.unitId || filters.benefitType || filters.status || filters.startDate || filters.endDate;

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        {/* Unit Filter */}
        <Select
          value={filters.unitId || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, unitId: value === 'all' ? null : value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as unidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Benefit Type Filter */}
        <Select
          value={filters.benefitType || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, benefitType: value === 'all' ? null : (value as BenefitType) })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de benefício" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {(Object.keys(benefitTypeLabels) as BenefitType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {benefitTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? null : (value as BenefitStatus) })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as situações</SelectItem>
            {(Object.keys(statusLabels) as BenefitStatus[]).map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[200px] justify-start text-left font-normal',
                !filters.startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.startDate ? (
                format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR })
              ) : (
                'Data inicial'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.startDate || undefined}
              onSelect={(date) => onFiltersChange({ ...filters, startDate: date || null })}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[200px] justify-start text-left font-normal',
                !filters.endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.endDate ? (
                format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR })
              ) : (
                'Data final'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.endDate || undefined}
              onSelect={(date) => onFiltersChange({ ...filters, endDate: date || null })}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="mr-1 h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
