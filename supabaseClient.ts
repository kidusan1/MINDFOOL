// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

// 1. 获取当前是否在线上运行
const isProd = import.meta.env.PROD;

// 2. 这里的逻辑：如果在线上，走 /supabase 代理；如果在电脑本地，直接连原来的地址
const supabaseUrl = isProd 
  ? `${window.location.origin}/supabase` 
  : 'https://qcbpsqvoyxifwtkszlrm.supabase.co'; // ←这里请填入你真实的 Supabase URL

// 3. 直接把 Anon Key 粘在这里（这样就不怕 Vercel 变量丢失了）
const supabaseAnonKey = 'sb_publishable_o-rqO4pavdQa3vB4mmYDtQ_GGmpHJ2r'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);