import { createClient } from '@supabase/supabase-js';

// 这里的逻辑是：如果是在 Vercel 线上环境，就走中转路径 /supabase
// 如果是在你电脑本地开发，依然走原有的环境变量
const supabaseUrl = import.meta.env.PROD 
  ? `${window.location.origin}/supabase` 
  : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);