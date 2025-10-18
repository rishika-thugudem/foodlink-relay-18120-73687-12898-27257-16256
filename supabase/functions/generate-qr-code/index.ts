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
    const { donationId, type } = await req.json(); // type: 'donation' or 'task'
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate verification code
    const verificationCode = crypto.randomUUID().substring(0, 8).toUpperCase();
    
    if (type === 'donation') {
      // Update donation with QR code
      const { error } = await supabase
        .from('donations')
        .update({ qr_code: verificationCode })
        .eq('id', donationId);

      if (error) throw error;
    } else if (type === 'task') {
      // Update volunteer task with verification codes
      const { error } = await supabase
        .from('volunteer_tasks')
        .update({
          pickup_verification_code: verificationCode,
          delivery_verification_code: crypto.randomUUID().substring(0, 8).toUpperCase()
        })
        .eq('id', donationId);

      if (error) throw error;
    }

    // Generate QR code URL (using a QR code API)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(verificationCode)}`;

    return new Response(
      JSON.stringify({ 
        verificationCode,
        qrCodeUrl 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating QR code:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});