import { createClient } from '@supabase/supabase-js';

// ⚠️ REPLACE THESE WITH YOUR ACTUAL URL AND KEY!
const supabaseUrl = 'https://ofpbybygnxlwojbwwrmv.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_eu51WYa5qIiSJQRMoQ_AWw_HXVobafU'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);