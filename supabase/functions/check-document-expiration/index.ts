import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { differenceInDays, isPast, format, addDays } from 'https://esm.sh/date-fns@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpiringDocument {
  id: string;
  profile_id: string;
  document_name: string;
  document_type: string;
  expiration_date: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  contrato: 'Contrato',
  atestado: 'Atestado Médico',
  aditivo: 'Aditivo Contratual',
  certidao: 'Certidão',
  comprovante: 'Comprovante',
  declaracao: 'Declaração',
  outro: 'Outro',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting document expiration check...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch documents expiring in the next 30 days or already expired (up to 7 days ago)
    const thirtyDaysFromNow = addDays(new Date(), 30);
    const sevenDaysAgo = addDays(new Date(), -7);
    
    const { data: documents, error: docsError } = await supabase
      .from('collaborator_documents')
      .select('id, profile_id, document_name, document_type, expiration_date')
      .not('expiration_date', 'is', null)
      .gte('expiration_date', format(sevenDaysAgo, 'yyyy-MM-dd'))
      .lte('expiration_date', format(thirtyDaysFromNow, 'yyyy-MM-dd'));

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      throw docsError;
    }

    console.log(`Found ${documents?.length || 0} documents to check`);

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expiring documents found', notificationsCreated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique profile IDs
    const profileIds = [...new Set(documents.map(d => d.profile_id))];
    
    // Fetch profiles to get user_ids
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, full_name')
      .in('id', profileIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    const profileMap = new Map<string, Profile>(profiles?.map(p => [p.id, p]) || []);

    // Fetch admin user IDs to notify them
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError) {
      console.error('Error fetching admin roles:', rolesError);
      throw rolesError;
    }

    const adminUserIds = adminRoles?.map(r => r.user_id) || [];
    console.log(`Found ${adminUserIds.length} admins to notify`);

    // Check existing notifications to avoid duplicates (last 24 hours)
    const yesterday = addDays(new Date(), -1);
    const { data: existingNotifications } = await supabase
      .from('notifications')
      .select('entity_id')
      .eq('type', 'document_expiring')
      .gte('created_at', yesterday.toISOString());

    const existingDocIds = new Set(existingNotifications?.map(n => n.entity_id) || []);

    // Create notifications for each expiring document
    const notifications: any[] = [];
    
    for (const doc of documents) {
      // Skip if already notified recently
      if (existingDocIds.has(doc.id)) {
        console.log(`Skipping doc ${doc.id} - already notified recently`);
        continue;
      }

      const profile = profileMap.get(doc.profile_id);
      if (!profile) continue;

      const expDate = new Date(doc.expiration_date);
      const today = new Date();
      const daysUntil = differenceInDays(expDate, today);
      const isExpired = isPast(expDate);

      let title: string;
      let message: string;
      let notificationType: string;

      if (isExpired) {
        title = '⚠️ Documento Vencido';
        message = `O documento "${doc.document_name}" (${DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}) do colaborador ${profile.full_name} está vencido há ${Math.abs(daysUntil)} dias.`;
        notificationType = 'document_expired';
      } else if (daysUntil <= 7) {
        title = '🚨 Documento Vencendo';
        message = `O documento "${doc.document_name}" (${DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}) do colaborador ${profile.full_name} vence em ${daysUntil} dia${daysUntil === 1 ? '' : 's'}.`;
        notificationType = 'document_expiring_critical';
      } else {
        title = '📄 Documento Próximo do Vencimento';
        message = `O documento "${doc.document_name}" (${DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}) do colaborador ${profile.full_name} vence em ${daysUntil} dias.`;
        notificationType = 'document_expiring';
      }

      // Notify all admins
      for (const adminUserId of adminUserIds) {
        notifications.push({
          user_id: adminUserId,
          title,
          message,
          type: notificationType,
          entity_type: 'collaborator_document',
          entity_id: doc.id,
        });
      }
    }

    console.log(`Creating ${notifications.length} notifications`);

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }
    }

    console.log('Document expiration check completed successfully');

    return new Response(
      JSON.stringify({ 
        message: 'Document expiration check completed',
        documentsChecked: documents.length,
        notificationsCreated: notifications.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in check-document-expiration:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
