-- Add log entries for document management actions
-- This is just to enable the action labels in the Auditoria page

-- No schema changes needed, but let's add a trigger for document changes
CREATE OR REPLACE FUNCTION public.log_document_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM create_system_log(
      'document_deleted',
      'collaborator_document',
      OLD.id,
      jsonb_build_object(
        'profile_id', OLD.profile_id,
        'document_type', OLD.document_type,
        'document_name', OLD.document_name
      ),
      auth.uid()
    );
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_document_changes_trigger
AFTER DELETE ON public.collaborator_documents
FOR EACH ROW
EXECUTE FUNCTION public.log_document_changes();