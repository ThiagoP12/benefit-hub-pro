import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Calendar, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, differenceInDays, isPast, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UploadDocumentDialog } from './UploadDocumentDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  profile_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_name: string;
  expiration_date: string | null;
  notes: string | null;
  created_at: string;
}

interface DocumentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
}

const DOCUMENT_TYPES: Record<string, { label: string; color: string }> = {
  contrato: { label: 'Contrato', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  atestado: { label: 'Atestado Médico', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  aditivo: { label: 'Aditivo Contratual', color: 'bg-purple-500/20 text-purple-500 border-purple-500/30' },
  certidao: { label: 'Certidão', color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  comprovante: { label: 'Comprovante', color: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30' },
  declaracao: { label: 'Declaração', color: 'bg-pink-500/20 text-pink-500 border-pink-500/30' },
  outro: { label: 'Outro', color: 'bg-muted text-muted-foreground border-muted' },
};

export function DocumentsSheet({ open, onOpenChange, profileId, profileName }: DocumentsSheetProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (open && profileId) {
      fetchDocuments();
    }
  }, [open, profileId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collaborator_documents')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os documentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    setDeleting(doc.id);
    try {
      // Delete file from storage
      const filePath = doc.file_url.split('/').slice(-2).join('/');
      await supabase.storage.from('collaborator-documents').remove([filePath]);

      // Delete record from database
      const { error } = await supabase
        .from('collaborator_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast({
        title: 'Documento excluído',
        description: 'O documento foi removido com sucesso.',
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o documento.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const getExpirationStatus = (expirationDate: string | null) => {
    if (!expirationDate) return null;

    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiration = differenceInDays(expDate, today);

    if (isPast(expDate)) {
      return {
        label: 'Vencido',
        color: 'bg-destructive/20 text-destructive border-destructive/30',
        icon: XCircle,
        daysText: `Vencido há ${Math.abs(daysUntilExpiration)} dias`,
      };
    } else if (daysUntilExpiration <= 30) {
      return {
        label: 'Vence em breve',
        color: 'bg-warning/20 text-warning border-warning/30',
        icon: AlertTriangle,
        daysText: `Vence em ${daysUntilExpiration} dias`,
      };
    } else {
      return {
        label: 'Válido',
        color: 'bg-green-500/20 text-green-500 border-green-500/30',
        icon: CheckCircle2,
        daysText: `Válido por ${daysUntilExpiration} dias`,
      };
    }
  };

  const getDocumentTypeInfo = (type: string) => {
    return DOCUMENT_TYPES[type] || DOCUMENT_TYPES.outro;
  };

  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, '_blank');
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos
            </SheetTitle>
            <SheetDescription>
              Documentos de {profileName}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4">
            <Button onClick={() => setUploadOpen(true)} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Enviar Documento
            </Button>
          </div>

          <Separator className="my-4" />

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento cadastrado</p>
                <p className="text-sm mt-1">Clique em "Enviar Documento" para adicionar</p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {documents.map((doc) => {
                  const typeInfo = getDocumentTypeInfo(doc.document_type);
                  const expirationStatus = getExpirationStatus(doc.expiration_date);

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant="outline" className={typeInfo.color}>
                              {typeInfo.label}
                            </Badge>
                            {expirationStatus && (
                              <Badge variant="outline" className={expirationStatus.color}>
                                <expirationStatus.icon className="h-3 w-3 mr-1" />
                                {expirationStatus.label}
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="font-medium text-foreground truncate">
                            {doc.document_name}
                          </h4>
                          
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {doc.file_name}
                          </p>

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {doc.expiration_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Vence: {format(new Date(doc.expiration_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>

                          {expirationStatus && (
                            <p className={`text-xs mt-1 ${expirationStatus.color.split(' ')[1]}`}>
                              {expirationStatus.daysText}
                            </p>
                          )}

                          {doc.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {doc.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                disabled={deleting === doc.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir "{doc.document_name}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(doc)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <UploadDocumentDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        profileId={profileId}
        onSuccess={fetchDocuments}
      />
    </>
  );
}
