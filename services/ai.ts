import { GoogleGenAI, Type } from "@google/genai";
import { Bookmark } from "../types";

// 初始化 AI 客户端（密钥由环境提供）
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AISuggestion {
  category: string;
  notes: string;
}

export const aiService = {
  /**
   * 根据 URL 和标题建议分类和备注
   * @param url 网址
   * @param title 标题
   * @param existingCategories 现有分类列表（用于学习用户习惯）
   */
  async suggestCategory(url: string, title: string, existingCategories: string[]): Promise<AISuggestion | null> {
    try {
      const prompt = `
        你是一个专业的书签管理助手。
        任务：根据提供的 URL 和标题，预测它最适合的分类，并简要描述这个网站。
        
        用户现有的分类标准（优先从中选择以保持一致性）: ${existingCategories.join(", ")}
        
        待处理数据:
        URL: ${url}
        标题: ${title}
        
        要求:
        1. 如果 URL 匹配“服务器”、“学习”、“教育”、“芯片官网”等特征，请准确归类。
        2. 如果现有分类中没有合适的，请创造一个简洁的（2-4个字）新分类。
        3. 备注请简述该站点的核心价值或用途。
        4. 请直接返回 JSON 格式数据。
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "建议的分类名称" },
              notes: { type: Type.STRING, description: "自动生成的网页描述" }
            },
            required: ["category", "notes"]
          },
          thinkingConfig: { thinkingBudget: 0 } // 简单任务禁用思考以降低延迟
        }
      });

      const text = response.text;
      if (text) {
        return JSON.parse(text) as AISuggestion;
      }
      return null;
    } catch (error) {
      console.error("AI 识别失败:", error);
      return null;
    }
  }
};