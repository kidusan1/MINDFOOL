// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

const isProd = import.meta.env.PROD;

// 1. 优先使用环境变量，如果不存在则使用本地代理
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL 
  || (isProd
    ? `${window.location.origin}/supabase`
    : 'https://qcbpsqvoyxifwtkszlrm.supabase.co'); // Fallback for local dev if no env var

// 2. 直接把 Anon Key 粘在这里（这样就不怕 Vercel 变量丢失了）
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY 
  || 'sb_publishable_o-rqO4pavdQa3vB4mmYDtQ_GGmpHJ2r'; 

// 调试日志：输出当前使用的数据库地址
console.log('当前使用的数据库地址:', supabaseUrl);
console.log('当前环境:', isProd ? '生产环境' : '开发环境');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);