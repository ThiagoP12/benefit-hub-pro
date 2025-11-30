import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

export function ImportCSVDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDownloadExample = () => {
    const csvContent = `nome_completo,cpf,data_aniversario,telefone,sexo,cargo,codigo_unidade
João Silva,123.456.789-00,01/10/1990,(11) 98765-4321,masculino,Analista,0001
Maria Santos,987.654.321-00,15/05/1985,(11) 91234-5678,feminino,Gerente,0002`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'exemplo_colaboradores.csv';
    link.click();
    toast.success('Arquivo de exemplo baixado com sucesso!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('Arquivo CSV vazio ou inválido');
        return;
      }

      // Parse CSV (simple implementation)
      const headers = lines[0].split(',').map(h => h.trim());
      const expectedHeaders = ['nome_completo', 'cpf', 'data_aniversario', 'telefone', 'sexo', 'cargo', 'codigo_unidade'];
      
      const hasValidHeaders = expectedHeaders.every(h => headers.includes(h));
      if (!hasValidHeaders) {
        toast.error('Cabeçalhos do CSV inválidos. Use o arquivo de exemplo como referência.');
        return;
      }

      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          nome_completo: values[headers.indexOf('nome_completo')],
          cpf: values[headers.indexOf('cpf')],
          data_aniversario: values[headers.indexOf('data_aniversario')],
          telefone: values[headers.indexOf('telefone')],
          sexo: values[headers.indexOf('sexo')],
          cargo: values[headers.indexOf('cargo')],
          codigo_unidade: values[headers.indexOf('codigo_unidade')],
        };
      });

      toast.success(`${data.length} colaboradores serão importados.`);
      console.log('Dados para importar:', data);
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao processar arquivo CSV');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Colaboradores via CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Formato do arquivo CSV:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>nome_completo</strong>: Nome completo do colaborador</li>
              <li><strong>cpf</strong>: CPF do colaborador (com ou sem formatação)</li>
              <li><strong>data_aniversario</strong>: Data no formato DD/MM/YYYY</li>
              <li><strong>telefone</strong>: Telefone com DDD (ex: (11) 98765-4321)</li>
              <li><strong>sexo</strong>: masculino ou feminino</li>
              <li><strong>cargo</strong>: Cargo do colaborador</li>
              <li><strong>codigo_unidade</strong>: Código da unidade (ex: 0001)</li>
            </ul>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleDownloadExample}
          >
            <Download className="h-4 w-4" />
            Baixar Arquivo de Exemplo
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            <Button className="w-full gap-2" disabled={loading}>
              <Upload className="h-4 w-4" />
              {loading ? 'Processando...' : 'Selecionar Arquivo CSV'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Arraste um arquivo CSV ou clique para selecionar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
