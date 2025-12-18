import { GoogleGenAI, Type } from "@google/genai";
import { Bookmark } from "../types";

export interface AISuggestion {
  category: string;
  notes: string;
}

export interface BatchSuggestion {
  id: string;
  category: string;
}

export const aiService = {
  /**
   * 根据 URL 和标题建议分类 and 备注
   */
  async suggestCategory(url: string, title: string, existingCategories: string[]): Promise<AISuggestion | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        你是一个专业的书签管理助手。
        任务：根据提供的 URL 和标题，预测它最适合的分类文件夹名称，并简要描述这个网站。
        
        用户现有的文件夹列表（优先从中选择）: ${existingCategories.join(", ")}
        
        待处理数据:
        URL: ${url}
        标题: ${title}
        
        要求:
        1. 分类名称应简洁（2-4个字），如“开发工具”、“影音娱乐”、“论文文献”。
        2. 备注简述该站点的核心价值。
        3. 请直接返回 JSON 格式。
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "建议的分类文件夹名称" },
              notes: { type: Type.STRING, description: "自动生成的网页描述" }
            },
            required: ["category", "notes"]
          }
        }
      });

      const text = response.text;
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error("AI 识别失败:", error);
      return null;
    }
  },

  /**
   * 批量整理功能：对一批书签进行聚类建议
   */
  async batchSuggest(bookmarks: {id: string, url: string, title: string}[], existingCategories: string[]): Promise<BatchSuggestion[]> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        任务：对以下书签进行智能归档建议。
        现有文件夹列表: ${existingCategories.join(", ")}
        
        待整理书签列表:
        ${JSON.stringify(bookmarks)}
        
        要求：
        1. 为每个书签分配一个最合适的文件夹分类。
        2. 如果现有分类不合适，可以建议新分类。
        3. 返回 JSON 数组，包含 id 和 category。
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["id", "category"]
            }
          }
        }
      });

      const text = response.text;
      return text ? JSON.parse(text) : [];
    } catch (error) {
      console.error("批量 AI 整理失败:", error);
      return [];
    }
  }
};