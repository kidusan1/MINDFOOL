// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

// 1. 优先使用环境变量，如果不存在则使用本地代理
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL 
  || `${window.location.origin}/supabase`;

// 2. 直接把 Anon Key 粘在这里（这样就不怕 Vercel 变量丢失了）
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY 
  || 'sb_publishable_o-rqO4pavdQa3vB4mmYDtQ_GGmpHJ2r'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);