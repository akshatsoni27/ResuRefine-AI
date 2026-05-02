import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface AnalysisResponse {
  score: number;
  summary: string;
  breakdown: {
    impact: number;
    formatting: number;
    keywords: number;
    brevity: number;
  };
  details: {
    strengths: string[];
    weaknesses: string[];
    criticalFixes: string[];
  };
  refinedContent: {
    summary?: string;
    experience?: { company: string; original: string; refined: string; improvements: string[] }[];
    skills?: string[];
  };
}

export const analyzeResume = async (resumeText: string): Promise<AnalysisResponse> => {
  const prompt = `Analyze this resume for ATS compliance and professional quality. 
  Provide a score out of 100 and specific refinement suggestions.
  Format the output as JSON according to the specified schema.
  
  Resume Content:
  ${resumeText}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a senior recruiter at Google. Your goal is to find the best talent by evaluating resumes strictly based on ATS (Applicant Tracking System) criteria, impact, and clarity. Be critical but constructive.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          breakdown: {
            type: Type.OBJECT,
            properties: {
              impact: { type: Type.NUMBER },
              formatting: { type: Type.NUMBER },
              keywords: { type: Type.NUMBER },
              brevity: { type: Type.NUMBER },
            },
            required: ["impact", "formatting", "keywords", "brevity"]
          },
          details: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              criticalFixes: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["strengths", "weaknesses", "criticalFixes"]
          },
          refinedContent: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    company: { type: Type.STRING },
                    original: { type: Type.STRING },
                    refined: { type: Type.STRING },
                    improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["company", "original", "refined", "improvements"]
                }
              },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        required: ["score", "summary", "breakdown", "details", "refinedContent"]
      },
    },
  });

  return JSON.parse(response.text as string);
};

export const generateUpgradedResume = async (resumeText: string): Promise<string> => {
  const prompt = `Rewrite this entire resume to be world-class, optimized for FAANG recruiters (specifically Google). 
  Use strong action verbs, quantify achievements (X by Y by doing Z), and ensure perfect grammar.
  Maintain the original information but significantly improve the phrasing and impact.
  Return the upgraded resume as a Markdown document.
  
  Original Resume Content:
  ${resumeText}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a professional resume writer specializing in high-tech placements. Your writing style is precise, data-driven, and impactful. Use the 'Google-style' bullet point formula: 'Accomplished [X] as measured by [Y], by doing [Z]'.",
    },
  });

  return response.text as string;
};
