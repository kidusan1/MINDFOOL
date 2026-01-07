const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// 1. 定义你要抓取的词条列表（你可以不断往这里加词）
const keywords = ["五蕴", "八识", "自性清净心"]; 

async function fetchAndClean() {
  const dictionary = [];

  for (const keyword of keywords) {
    console.log(`正在抓取: ${keyword}...`);
    try {
      // 模拟在三摩地站点搜索
      const searchUrl = `https://www.google.com/search?q=site:sanmodi.cn+${encodeURIComponent(keyword)}`;
      const response = await axios.get(searchUrl);
      const $ = cheerio.load(response.data);
      
      // 这里只是简单示例，真实抓取通常需要解析具体的文章链接
      // 实际操作中，你可以直接把已知文章的 URL 喂给它
      const content = "从网页解析到的原始长文本..."; 

      // 2. 将原始文本保存，待后续批量交给 AI 洗稿
      dictionary.push({
        term: keyword,
        rawContent: content
      });
    } catch (e) {
      console.error(`${keyword} 抓取失败`);
    }
  }

  // 3. 导出为本地文件
  fs.writeFileSync('raw_dictionary.json', JSON.stringify(dictionary, null, 2));
  console.log('原始词典已生成：raw_dictionary.json');
}

fetchAndClean();