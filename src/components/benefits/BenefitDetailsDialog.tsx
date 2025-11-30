import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileUp, Send, CheckCircle, XCircle } from "lucide-react";
import { benefitTypeLabels, type BenefitStatus } from "@/types/benefits";

interface BenefitDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: {
    id: string;
    protocol: string;
    benefit_type: string;
    status: BenefitStatus;
    details: string | null;
    created_at: string;
    pdf_url: string | null;
    pdf_file_name: string | null;
    rejection_reason: string | null;
    closing_message: string | null;
    profiles: {
      full_name: string;
      cpf: string | null;
      units: {
        name: string;
      } | null;
    } | null;
  };
  onSuccess?: () => void;
}

export function BenefitDetailsDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
}: BenefitDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BenefitStatus>(request.status);
  const [rejectionReason, setRejectionReason] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState(request.pdf_url);

  const handleApprove = () => {
    setStatus("aprovada");
    toast.success("Status alterado para Aprovado. Faça o upload do PDF.");
  };

  const handleReject = () => {
    setStatus("recusada");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Por favor, selecione um arquivo PDF");
      return;
    }

    setPdfFile(file);

    // Upload imediato
    setLoading(true);
    try {
      const fileName = `${request.protocol}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("benefit-pdfs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("benefit-pdfs")
        .getPublicUrl(fileName);

      setPdfUrl(urlData.publicUrl);
      toast.success("PDF enviado com sucesso");
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar PDF: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      // Validações
      if (status === "aprovada" && !pdfUrl) {
        toast.error("É necessário fazer o upload do PDF antes de enviar");
        return;
      }

      if (status === "recusada" && !rejectionReason.trim()) {
        toast.error("Por favor, informe o motivo da rejeição");
        return;
      }

      if (!closingMessage.trim()) {
        toast.error("Por favor, insira uma mensagem para o colaborador");
        return;
      }

      // Obter o usuário atual
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      // Determinar status final
      const finalStatus: BenefitStatus = 
        status === "aprovada" ? "concluida" : "recusada";

      // Atualizar solicitação no banco
      const { error: updateError } = await supabase
        .from("benefit_requests")
        .update({
          status: finalStatus,
          pdf_url: pdfUrl,
          pdf_file_name: pdfFile?.name || request.pdf_file_name,
          rejection_reason: status === "recusada" ? rejectionReason : null,
          closing_message: closingMessage,
          closed_by: userData.user.id,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Registrar log
      await supabase.from("logs").insert({
        entity_type: "benefit_request",
        entity_id: request.id,
        action: finalStatus === "concluida" ? "approved" : "rejected",
        user_id: userData.user.id,
        details: {
          protocol: request.protocol,
          status: finalStatus,
          message: closingMessage,
        },
      });

      // Enviar mensagem WhatsApp
      const whatsappMessage = `
📦 *Sistema de Benefícios — Encerramento de Protocolo*

🔹 *Protocolo:* ${request.protocol}
${pdfUrl ? `🧾 *Nota Fiscal:* ${pdfUrl}` : ""}
👤 *Colaborador:* ${request.profiles?.full_name || "N/A"}
🏭 *Unidade:* ${request.profiles?.units?.name || "N/A"}
📅 *Data do Encerramento:* ${format(new Date(), "dd/MM/yyyy · HH:mm", { locale: ptBR })}

🗒️ *Mensagem ao Colaborador:*
${closingMessage}

⚙️ *Status do Protocolo:* ${finalStatus === "concluida" ? "✅ Liberado" : "❌ Rejeitado"}
${status === "recusada" && rejectionReason ? `\n❗ *Motivo:* ${rejectionReason}` : ""}
      `.trim();

      // TODO: Implementar envio real via WhatsApp
      console.log("Mensagem WhatsApp:", whatsappMessage);

      toast.success("Solicitação atualizada com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao enviar:", error);
      toast.error("Erro ao processar solicitação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isPending = request.status === "aberta" || request.status === "em_analise";
  const isApproved = status === "aprovada";
  const isRejected = status === "recusada";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Solicitação</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Protocolo */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-muted-foreground">Protocolo</Label>
              <p className="font-semibold">{request.protocol}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Data de Abertura</Label>
              <p className="font-semibold">
                {format(new Date(request.created_at), "dd/MM/yyyy · HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Colaborador</Label>
              <p className="font-semibold">{request.profiles?.full_name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">CPF</Label>
              <p className="font-semibold">{request.profiles?.cpf || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Unidade</Label>
              <p className="font-semibold">{request.profiles?.units?.name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tipo de Benefício</Label>
              <p className="font-semibold">{benefitTypeLabels[request.benefit_type as keyof typeof benefitTypeLabels]}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Descrição</Label>
              <p className="font-semibold">{request.details || "Sem descrição"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status Atual</Label>
              <StatusBadge status={status} />
            </div>
          </div>

          {/* Ações de Aprovação/Rejeição */}
          {isPending && (
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                className="flex-1"
                variant="default"
                disabled={loading || isApproved}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
              <Button
                onClick={handleReject}
                className="flex-1"
                variant="destructive"
                disabled={loading || isRejected}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          )}

          {/* Motivo da Rejeição */}
          {isRejected && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={3}
              />
            </div>
          )}

          {/* Upload de PDF */}
          {isApproved && (
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">Upload de PDF (Obrigatório)</Label>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => document.getElementById("pdf-upload")?.click()}
                  variant="outline"
                  disabled={loading}
                  className="w-full"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  {pdfFile ? pdfFile.name : pdfUrl ? "Substituir PDF" : "Selecionar PDF"}
                </Button>
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Ver PDF atual
                </a>
              )}
            </div>
          )}

          {/* Mensagem para o Colaborador */}
          {(isApproved || isRejected) && (
            <div className="space-y-2">
              <Label htmlFor="closing-message">Mensagem ao Colaborador *</Label>
              <Textarea
                id="closing-message"
                value={closingMessage}
                onChange={(e) => setClosingMessage(e.target.value)}
                placeholder={
                  isApproved
                    ? "Seu benefício foi aprovado. Segue o comprovante para conferência."
                    : "Sua solicitação foi analisada e não pôde ser aprovada."
                }
                rows={4}
              />
            </div>
          )}

          {/* Botão Enviar */}
          {(isApproved || isRejected) && (
            <Button
              onClick={handleSend}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Enviando..." : "Enviar e Finalizar"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
