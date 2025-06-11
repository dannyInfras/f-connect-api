import { CV } from '../entities/cv.entity';

export interface AiOptimizerInput {
  cv: CV;
  jobTitle?: string;
  jobDescription: string;
}

export interface SuggestionWithReason {
  suggestion: string;
  reason: string;
}

export interface ExperienceSuggestion {
  index: number;
  field: string;
  suggestion: string;
  reason: string;
}

export interface EducationSuggestion {
  index: number;
  field: string;
  suggestion: string;
  reason: string;
}

export interface AiOptimizerOutput {
  optimizedCv: CV;
  suggestions: {
    summary?: SuggestionWithReason;
    skills?: {
      suggestions: string[];
      reason: string;
    };
    experience?: ExperienceSuggestion[];
    education?: EducationSuggestion[];
  };
}
