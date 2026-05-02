export interface ResumeData {
  text: string;
  name?: string;
}

export interface AnalysisBreakdown {
  impact: number;
  formatting: number;
  keywords: number;
  brevity: number;
}

export interface RefinedExperience {
  company: string;
  original: string;
  refined: string;
  improvements: string[];
}
