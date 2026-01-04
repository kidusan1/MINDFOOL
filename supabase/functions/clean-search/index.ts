import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 处理跨域预检请求
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    console.log("接收到的数据:", body)
    const { keyword, blacklist } = body

    // 从环境变量获取配置
    const apiKey = Deno.env.get('GROQ_API_KEY')
    const projectUrl = Deno.env.get('MY_PROJECT_URL')
    const serviceKey = Deno.env.get('MY_SERVICE_KEY')

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

    // --- 步骤 2: 调取 AI ---
    const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: `你是一个深谙佛法正见的梳理助手。任务：解释名相。
            规则：严禁提到萧平实、导师、任何现代人名、网站名。
            严禁出现词汇：${blacklist?.join('、') || ''}。
            字数：800-1000字。
            只能依据 sanmodi.cn 体系梳理。
            格式：以“【法义梳理：${keyword}】”开头。`
          },
          { role: "user", content: `请详细解释“${keyword}”的法义。` }
        ]
      })
    })

    const aiData = await aiResponse.json()
    const pureContent = aiData.choices?.[0]?.message?.content || "搜索失败，请稍后重试"

    // --- 步骤 3: 存入缓存表 ---
    if (pureContent !== "搜索失败，请稍后重试") {
      await supabase.from('search_cache').insert([{ keyword, pure_content: pureContent }])
    }

    return new Response(JSON.stringify({ pureContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("后端报错:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    })
  }
})