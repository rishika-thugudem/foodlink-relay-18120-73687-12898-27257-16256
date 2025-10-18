import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, taskId, action } = await req.json(); // action: 'pickup' or 'delivery'
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch task details
    const { data: task, error: taskError } = await supabase
      .from('volunteer_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    let isValid = false;
    let updateFields: any = {};

    if (action === 'pickup') {
      isValid = task.pickup_verification_code === code;
      if (isValid) {
        updateFields = {
          pickup_verified: true,
          picked_up_at: new Date().toISOString(),
          status: 'in_progress'
        };
      }
    } else if (action === 'delivery') {
      isValid = task.delivery_verification_code === code;
      if (isValid) {
        updateFields = {
          delivery_verified: true,
          delivered_at: new Date().toISOString(),
          status: 'completed'
        };
      }
    }

    if (isValid) {
      // Update task status
      const { error: updateError } = await supabase
        .from('volunteer_tasks')
        .update(updateFields)
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Update donation status if delivery is complete
      if (action === 'delivery') {
        const { error: donationError } = await supabase
          .from('donations')
          .update({ status: 'delivered' })
          .eq('id', task.donation_id);

        if (donationError) throw donationError;

        // Update volunteer stats
        const { error: statsError } = await supabase
          .from('profiles')
          .update({ 
            total_deliveries: supabase.rpc('increment', { row_id: task.volunteer_id })
          })
          .eq('id', task.volunteer_id);

        if (statsError) console.error('Stats update error:', statsError);
      }

      // Create notifications
      if (action === 'pickup') {
        await supabase.from('notifications').insert([
          {
            user_id: task.donor_id,
            title: 'Food Picked Up',
            message: 'Your donation has been picked up by the volunteer',
            type: 'pickup_confirmed'
          },
          {
            user_id: task.ngo_id,
            title: 'Food On The Way',
            message: 'The donation is on its way to your location',
            type: 'in_transit'
          }
        ]);
      } else {
        await supabase.from('notifications').insert([
          {
            user_id: task.donor_id,
            title: 'Delivery Complete',
            message: 'Your donation has been delivered successfully!',
            type: 'delivery_confirmed'
          },
          {
            user_id: task.ngo_id,
            title: 'Food Received',
            message: 'Donation has been delivered to your location',
            type: 'delivery_confirmed'
          },
          {
            user_id: task.volunteer_id,
            title: 'Task Completed!',
            message: 'Great job! Your delivery has been verified',
            type: 'task_completed'
          }
        ]);
      }
    }

    return new Response(
      JSON.stringify({ 
        valid: isValid,
        message: isValid 
          ? `${action === 'pickup' ? 'Pickup' : 'Delivery'} verified successfully!`
          : 'Invalid verification code'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error verifying QR code:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});