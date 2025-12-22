import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting credit limit check...");

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get all collaborators with their credit limits
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name, credit_limit")
      .not("credit_limit", "is", null)
      .gt("credit_limit", 0);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles with credit limits`);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No profiles with credit limits found", notificationsCreated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get benefit requests for the current month
    const { data: monthlyRequests, error: requestsError } = await supabase
      .from("benefit_requests")
      .select("user_id, approved_value, status")
      .in("status", ["aprovada", "concluida"])
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString());

    if (requestsError) {
      console.error("Error fetching requests:", requestsError);
      throw requestsError;
    }

    // Calculate usage per user
    const usageByUser = new Map<string, number>();
    for (const request of monthlyRequests || []) {
      const current = usageByUser.get(request.user_id) || 0;
      usageByUser.set(request.user_id, current + (request.approved_value || 0));
    }

    // Get admin users to notify
    const { data: adminRoles, error: adminError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admins:", adminError);
      throw adminError;
    }

    const adminUserIds = adminRoles?.map(r => r.user_id) || [];
    console.log(`Found ${adminUserIds.length} admin users`);

    let notificationsCreated = 0;
    const thresholds = [
      { percent: 100, type: "credit_limit_exceeded", title: "Limite de Crédito Excedido", emoji: "🚫" },
      { percent: 90, type: "credit_limit_critical", title: "Limite de Crédito Crítico", emoji: "🔴" },
      { percent: 80, type: "credit_limit_warning", title: "Limite de Crédito em Alerta", emoji: "⚠️" },
    ];

    for (const profile of profiles) {
      const usage = usageByUser.get(profile.user_id) || 0;
      const limit = profile.credit_limit || 0;
      
      if (limit <= 0) continue;

      const percentUsed = (usage / limit) * 100;

      // Find the highest threshold reached
      const thresholdReached = thresholds.find(t => percentUsed >= t.percent);
      
      if (thresholdReached) {
        console.log(`${profile.full_name}: ${percentUsed.toFixed(1)}% used (${usage}/${limit}) - ${thresholdReached.title}`);

        // Check if notification already exists for this user this month
        const notificationKey = `credit_${profile.user_id}_${now.getFullYear()}_${now.getMonth()}_${thresholdReached.percent}`;
        
        const { data: existingNotification } = await supabase
          .from("notifications")
          .select("id")
          .eq("entity_id", profile.user_id)
          .eq("type", thresholdReached.type)
          .gte("created_at", startOfMonth.toISOString())
          .limit(1);

        if (existingNotification && existingNotification.length > 0) {
          console.log(`Notification already exists for ${profile.full_name} at ${thresholdReached.percent}%`);
          continue;
        }

        // Notify the collaborator
        const { error: userNotifError } = await supabase
          .from("notifications")
          .insert({
            user_id: profile.user_id,
            title: thresholdReached.title,
            message: `${thresholdReached.emoji} Você utilizou ${percentUsed.toFixed(0)}% do seu limite mensal (R$ ${usage.toFixed(2)} de R$ ${limit.toFixed(2)})`,
            type: thresholdReached.type,
            entity_type: "credit_limit",
            entity_id: profile.user_id,
          });

        if (!userNotifError) {
          notificationsCreated++;
        } else {
          console.error("Error creating user notification:", userNotifError);
        }

        // Notify all admins
        for (const adminId of adminUserIds) {
          const { error: adminNotifError } = await supabase
            .from("notifications")
            .insert({
              user_id: adminId,
              title: thresholdReached.title,
              message: `${thresholdReached.emoji} ${profile.full_name} atingiu ${percentUsed.toFixed(0)}% do limite (R$ ${usage.toFixed(2)} de R$ ${limit.toFixed(2)})`,
              type: thresholdReached.type,
              entity_type: "credit_limit",
              entity_id: profile.user_id,
            });

          if (!adminNotifError) {
            notificationsCreated++;
          } else {
            console.error("Error creating admin notification:", adminNotifError);
          }
        }
      }
    }

    console.log(`Credit limit check completed. Created ${notificationsCreated} notifications.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Credit limit check completed",
        notificationsCreated,
        profilesChecked: profiles.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in check-credit-limits:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
