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
    const { donationId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch donation details
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .single();

    if (donationError) throw donationError;

    // Fetch all verified NGOs
    const { data: verifiedNGOs, error: ngosError } = await supabase
      .from('ngo_verifications')
      .select(`
        user_id,
        organization_name,
        organization_type,
        description,
        profiles!inner(
          latitude,
          longitude,
          full_name
        )
      `)
      .eq('status', 'approved');

    if (ngosError) throw ngosError;

    // Use Lovable AI to intelligently match NGOs
    const aiPrompt = `You are an AI assistant for a food donation platform. Given the following donation and NGO information, recommend the top 3 most suitable NGOs for this donation.

Donation Details:
- Type: ${donation.food_type}
- Quantity: ${donation.quantity}
- Estimated Meals: ${donation.estimated_meals || 'Unknown'}
- Description: ${donation.description || 'No description'}
- Expiry: ${donation.expiry_time}
- Location: ${donation.pickup_address}

Available NGOs:
${verifiedNGOs.map((ngo: any, idx: number) => `
${idx + 1}. ${ngo.organization_name}
   Type: ${ngo.organization_type || 'Not specified'}
   Description: ${ngo.description || 'No description'}
   Distance: ${calculateDistance(
     donation.pickup_latitude,
     donation.pickup_longitude,
     ngo.profiles.latitude,
     ngo.profiles.longitude
   ).toFixed(2)} km
`).join('\n')}

Consider:
1. Proximity to donation location
2. Organization type matching food type
3. Organization capacity and needs
4. Urgency based on expiry time

Return ONLY a JSON array with the top 3 NGO matches in this exact format:
[
  {
    "user_id": "ngo_user_id",
    "organization_name": "NGO Name",
    "match_score": 95,
    "reason": "Brief explanation why this is a good match"
  }
]`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a precise AI that returns only valid JSON arrays. No additional text or explanations.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Parse AI response
    let matches;
    try {
      // Try to extract JSON array from response
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matches = JSON.parse(jsonMatch[0]);
      } else {
        matches = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Fallback to distance-based matching
      matches = verifiedNGOs
        .map((ngo: any) => ({
          user_id: ngo.user_id,
          organization_name: ngo.organization_name,
          match_score: 70,
          reason: 'Matched based on proximity',
          distance_km: calculateDistance(
            donation.pickup_latitude,
            donation.pickup_longitude,
            ngo.profiles.latitude,
            ngo.profiles.longitude
          )
        }))
        .sort((a: any, b: any) => a.distance_km - b.distance_km)
        .slice(0, 3);
    }

    console.log('AI Matching result:', matches);

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI NGO matcher:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}