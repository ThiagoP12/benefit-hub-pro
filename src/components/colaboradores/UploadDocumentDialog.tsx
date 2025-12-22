import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Upload, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  onSuccess: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'atestado', label: 'Atestado Médico' },
  { value: 'aditivo', label: 'Aditivo Contratual' },
  { value: 'certidao', label: 'Certidão' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'declaracao', label: 'Declaração' },
  { value: 'outro', label: 'Outro' },
];

export function UploadDocumentDialog({
  open,
  onOpenChange,
  profileId,
  onSuccess,
}: UploadDocumentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setDocumentType('');
    setDocumentName('');
    setExpirationDate(undefined);
    setNotes('');
    setFile(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Max 10MB
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 10MB.',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      
      // Auto-fill document name if empty
      if (!documentName) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
        setDocumentName(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !documentType || !documentName) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('collaborator-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('collaborator-documents')
        .getPublicUrl(fileName);

      // Insert document record
      const { error: insertError } = await supabase
        .from('collaborator_documents')
        .insert({
          profile_id: profileId,
          document_type: documentType,
          document_name: documentName,
          file_url: urlData.publicUrl,
          file_name: file.name,
          expiration_date: expirationDate ? format(expirationDate, 'yyyy-MM-dd') : null,
          notes: notes || null,
          uploaded_by: session.user.id,
        });

      if (insertError) throw insertError;

      // Log the action
      await supabase.rpc('create_system_log', {
        p_action: 'document_uploaded',
        p_entity_type: 'collaborator_document',
        p_entity_id: profileId,
        p_details: {
          document_type: documentType,
          document_name: documentName,
          file_name: file.name,
          has_expiration: !!expirationDate,
        },
      });

      toast({
        title: 'Documento enviado',
        description: 'O documento foi adicionado com sucesso.',
      });

      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o documento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enviar Documento
          </DialogTitle>
          <DialogDescription>
            Adicione um novo documento ao cadastro do colaborador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo *</Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="cursor-pointer"
              />
            </div>
            {file && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, JPG ou PNG (máx. 10MB)
            </p>
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Documento *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Documento *</Label>
            <Input
              id="name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Ex: Contrato de Trabalho 2024"
            />
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label>Data de Vencimento (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate 
                    ? format(expirationDate, "dd/MM/yyyy", { locale: ptBR }) 
                    : "Selecione uma data"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Documentos com vencimento receberão alertas automáticos
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre o documento..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
