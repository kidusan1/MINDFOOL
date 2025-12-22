// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

const isProd = import.meta.env.PROD;

// 规范化 API 请求：生产环境下，所有请求都严格走代理路径
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL 
  || (isProd
    ? `${window.location.origin}/supabase`  // 生产环境：强制使用代理路径
    : `${window.location.origin}/supabase`); // 开发环境：也使用代理路径（通过 vite dev server 或本地代理）

// 2. 直接把 Anon Key 粘在这里（这样就不怕 Vercel 变量丢失了）
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY 
  || 'sb_publishable_o-rqO4pavdQa3vB4mmYDtQ_GGmpHJ2r'; 

// 调试日志：输出当前使用的数据库地址
console.log('当前使用的数据库地址:', supabaseUrl);
console.log('当前环境:', isProd ? '生产环境' : '开发环境');
console.log('是否使用代理路径:', supabaseUrl.includes('/supabase'));

export const supabase = createClient(supabaseUrl, supabaseAnonKey);