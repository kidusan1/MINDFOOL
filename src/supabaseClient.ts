import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qcbpsqvoyxifwtkszlrm.supabase.co';
const supabaseAnonKey = 'sb_publishable_o-rqO4pavdQa3vB4mmYDtQ_GGmpHJ2r'; // 请在这里粘贴你 Supabase 后台 API Settings 里的那个 Anon Public Key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
