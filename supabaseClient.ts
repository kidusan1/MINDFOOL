// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

// 获取当前环境是否为生产环境
const isProd = import.meta.env.PROD;

// ！！！注意这里：如果是在线上，直接用相对路径 /supabase
const supabaseUrl = isProd 
  ? '/supabase' 
  : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
