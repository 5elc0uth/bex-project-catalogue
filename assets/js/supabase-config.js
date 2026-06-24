const BEX_SUPABASE_URL = "https://xyculdhijrrykawlntaf.supabase.co";
const BEX_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UqMmV9NXf95ZoonBWlsHZQ_OIi-_Lea";

window.bexSupabase = window.supabase.createClient(
  BEX_SUPABASE_URL,
  BEX_SUPABASE_PUBLISHABLE_KEY
);