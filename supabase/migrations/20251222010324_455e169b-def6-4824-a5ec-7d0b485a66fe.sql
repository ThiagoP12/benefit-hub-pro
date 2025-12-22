-- Create table for collaborator documents
CREATE TABLE public.collaborator_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  expiration_date DATE,
  notes TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.collaborator_documents ENABLE ROW LEVEL SECURITY;

-- Admin can do all
CREATE POLICY "Admin can do all on collaborator_documents" 
ON public.collaborator_documents 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Gestor can view all documents
CREATE POLICY "Gestor can view collaborator_documents" 
ON public.collaborator_documents 
FOR SELECT 
USING (has_role(auth.uid(), 'gestor'::app_role));

-- Agente DP can view all documents
CREATE POLICY "Agente DP can view collaborator_documents" 
ON public.collaborator_documents 
FOR SELECT 
USING (has_role(auth.uid(), 'agente_dp'::app_role));

-- User can view own documents
CREATE POLICY "User can view own documents" 
ON public.collaborator_documents 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = collaborator_documents.profile_id 
  AND p.user_id = auth.uid()
));

-- Create updated_at trigger
CREATE TRIGGER update_collaborator_documents_updated_at
BEFORE UPDATE ON public.collaborator_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for collaborator documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('collaborator-documents', 'collaborator-documents', false);

-- Storage policies for collaborator-documents bucket
CREATE POLICY "Admin can upload collaborator documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'collaborator-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can update collaborator documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'collaborator-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can delete collaborator documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'collaborator-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users can view collaborator documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'collaborator-documents' 
  AND auth.uid() IS NOT NULL
);