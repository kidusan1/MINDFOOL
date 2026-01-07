import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. 先从请求中获取数据
    const body = await req.json()
    console.log("接收到的数据:", body)
    const { keyword, blacklist } = body

    // 2. 先定义变量，再进行配置检查 (解决你刚才的报错)
    const apiKey = Deno.env.get('GROQ_API_KEY')
    const projectUrl = Deno.env.get('MY_PROJECT_URL')
    const serviceKey = Deno.env.get('MY_SERVICE_KEY')

    console.log("环境变量状态:", {
      hasApiKey: !!apiKey,
      hasUrl: !!projectUrl,
      hasKey: !!serviceKey
    });

    if (!apiKey || !projectUrl || !serviceKey) {
      throw new Error("服务器环境变量配置缺失")
    }

    const supabase = createClient(projectUrl, serviceKey)

    // --- 步骤 1: 检查缓存 ---
    const { data: cached } = await supabase
      .from('search_cache')
      .select('pure_content')
      .eq('keyword', keyword)
      .single()

    if (cached) {
      console.log(`命中缓存: ${keyword}`)
      return new Response(JSON.stringify({ pureContent: cached.pure_content, isCached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

 // --- 步骤 2: 调取 AI (增强版) ---
 console.log(`正在为关键词 [${keyword}] 请求 AI...`);
    
 try {
   const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
     method: "POST",
     headers: {
       "Authorization": `Bearer ${apiKey}`,
       "Content-Type": "application/json"
     },
     body: JSON.stringify({
       model: "llama3-70b-8192", // 换成更稳定的 Llama3 模型测试
       messages: [
         {
           role: "system",
           content: `你是一个深谙佛法正见的梳理助手。任务：详细解释名相。
           规则：严禁提到现代人名或特定组织名。
           严禁出现：${blacklist?.join('、') || '无'}。
           输出要求：800字以上，逻辑严密，符合佛法正见。
           格式：以“【法义梳理：${keyword}】”开头。`
         },
         { role: "user", content: `请详细解释“${keyword}”的法义。` }
       ],
       temperature: 0.7
     })
   });

   const aiData = await aiResponse.json();
   
   // 如果 AI 返回了错误信息（如 API Key 限制或模型错词）
   if (aiData.error) {
     console.error("AI 接口报错详情:", aiData.error);
     throw new Error(`AI 引擎报错: ${aiData.error.message}`);
   }

   var pureContent = aiData.choices?.[0]?.message?.content;
   
   if (!pureContent) {
     console.log("AI 返回原始数据:", JSON.stringify(aiData));
     pureContent = "AI 响应解析为空，请稍后重试";
   }

 } catch (aiErr) {
   console.error("AI 链路执行异常:", aiErr.message);
   throw aiErr;
 }
 
    // --- 步骤 3: 存入数据库 ---
    if (pureContent !== "未查询到有效信息") {
      const { error: insertError } = await supabase
        .from('search_cache')
        .insert([{ 
          keyword: keyword, 
          pure_content: pureContent 
        }])
      
      if (insertError) console.error("数据库写入报错:", insertError.message)
      else console.log("成功存入数据库缓存");
    }

    return new Response(JSON.stringify({ pureContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("后端捕获错误:", error.message)
    return new Response(JSON.stringify({ error: error.message, pureContent: "搜索失败，请重试" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200 // 返回 200 确保前端能接收到 error 信息
    })
  }
})