import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

export function ImportCSVDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDownloadExample = () => {
    const csvContent = `nome_completo,cpf,aniversario,unidade,cargo
João da Silva,12345678901,15/03,Revalle Juazeiro,Vendedor
Maria Santos,98765432109,22/07,Revalle Bonfim,Gerente
Pedro Oliveira,11122233344,01/10,07717961000160,Assistente Administrativo`;

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
      const expectedHeaders = ['nome_completo', 'cpf', 'aniversario', 'unidade', 'cargo'];
      
      const hasValidHeaders = expectedHeaders.every(h => headers.includes(h));
      if (!hasValidHeaders) {
        toast.error('Cabeçalhos do CSV inválidos. Use o arquivo de exemplo como referência.');
        return;
      }

      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          nome_completo: values[0],
          cpf: values[1],
          aniversario: values[2],
          unidade: values[3],
          cargo: values[4],
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
              <li>nome_completo</li>
              <li>cpf (apenas números)</li>
              <li>aniversario (formato DD/MM, ex: 01/10)</li>
              <li>unidade (nome da unidade)</li>
              <li>cargo (texto livre)</li>
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
