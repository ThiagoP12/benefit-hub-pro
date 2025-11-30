import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus } from 'lucide-react';
import { mockUsers } from '@/data/mockData';
import { benefitTypeLabels, BenefitType } from '@/types/benefits';
import { toast } from 'sonner';

const formSchema = z.object({
  userId: z.string().min(1, 'Selecione um colaborador'),
  benefitType: z.string().min(1, 'Selecione o tipo de benefício'),
  details: z.string().min(10, 'Descreva os detalhes (mínimo 10 caracteres)'),
});

export function NewBenefitDialog() {
  const [open, setOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      benefitType: '',
      details: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const user = mockUsers.find(u => u.id === parseInt(values.userId));
    const protocol = `BEN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    
    toast.success(`Benefício criado com sucesso!`, {
      description: `Protocolo: ${protocol} - ${user?.name}`,
    });
    
    setOpen(false);
    form.reset();
  };

  const colaboradores = mockUsers.filter(u => u.role === 'colaborador');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Solicitação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Solicitação de Benefício</DialogTitle>
          <DialogDescription>
            Cadastre uma nova solicitação de benefício para um colaborador
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colaborador</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o colaborador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colaboradores.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} - {user.cpf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="benefitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Benefício</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(benefitTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os detalhes da solicitação..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Criar Solicitação</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
