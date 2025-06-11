import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { CV } from '../entities/cv.entity';
import {
  AiOptimizerInput,
  AiOptimizerOutput,
  EducationSuggestion,
  ExperienceSuggestion,
  SuggestionWithReason,
} from '../interfaces/ai-optimizer.interface';

@Injectable()
export class CvOptimizerService {
  private readonly logger = new Logger(CvOptimizerService.name);
  private readonly openaiApiKey: string;
  private readonly openaiApiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  async optimizeCv(input: AiOptimizerInput): Promise<AiOptimizerOutput> {
    try {
      this.logger.log(
        `Optimizing CV ${input.cv.id} for job: ${input.jobTitle || 'No title provided'}`,
      );

      const optimizedCv = this.cloneCV(input.cv);

      const suggestions = await this.generateSuggestions(
        optimizedCv,
        input.jobTitle,
        input.jobDescription,
      );

      this.applySuggestions(optimizedCv, suggestions);

      return {
        optimizedCv,
        suggestions,
      };
    } catch (error: any) {
      this.logger.error(`Error optimizing CV: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateSuggestions(
    cv: CV,
    jobTitle?: string,
    jobDescription?: string,
  ): Promise<AiOptimizerOutput['suggestions']> {
    try {
      const prompt = this.buildPrompt(cv, jobTitle, jobDescription);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert career advisor and resume writer with deep knowledge of industry-specific keywords and ATS optimization. You help candidates tailor their CVs to specific job descriptions by providing detailed, actionable suggestions with clear explanations. You MUST respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = response.data.choices[0].message.content;

      try {
        const suggestions = JSON.parse(content);
        return suggestions;
      } catch (parseError) {
        this.logger.error(
          `Failed to parse JSON response: ${content.substring(0, 100)}...`,
          parseError,
        );

        // fallback if response isn't valid JSON
        return this.createFallbackSuggestions(cv, jobTitle, jobDescription);
      }
    } catch (error: any) {
      this.logger.error(`Error calling OpenAI: ${error.message}`, error.stack);
      throw new Error('Failed to get AI suggestions');
    }
  }

  private buildPrompt(
    cv: CV,
    jobTitle?: string,
    jobDescription?: string,
  ): string {
    return `
You must respond with ONLY valid JSON and nothing else. No explanations, no markdown formatting, just the raw JSON object.

I want to optimize this CV for the job title "${jobTitle}" with the following description:
---
${jobDescription}
---

Here is the CV in JSON format:
${JSON.stringify(cv, null, 2)}

Analyze the CV and job description carefully. For each suggestion, provide a specific reason why the change would improve the CV for this particular job.

Return optimized suggestions in the following JSON format with no additional text:

{
  "summary": {
    "suggestion": "Updated professional summary text that highlights relevant experience and skills for the job...",
    "reason": "Explanation of why this summary is more effective for this specific job..."
  },
  "skills": {
    "suggestions": ["Skill1", "Skill2", "Skill3"],
    "reason": "Explanation of why these skills are important for the job and how they match the requirements..."
  },
  "experience": [
    {
      "index": 0,
      "field": "description",
      "suggestion": "Improved experience description that highlights relevant achievements...",
      "reason": "Explanation of why this description is more effective for this job..."
    }
  ],
  "education": [
    {
      "index": 0,
      "field": "description",
      "suggestion": "Improved education description that highlights relevant coursework...",
      "reason": "Explanation of why this description is more relevant for this job..."
    }
  ]
}

Important guidelines:
1. Make suggestions that are specific to the job description and CV content
2. Focus on highlighting transferable skills and relevant experience
3. Use industry-specific keywords from the job description
4. Keep suggestions professional and truthful - don't fabricate experience
5. For each suggestion, explain WHY it would make the CV more effective for this specific job
6. Ensure all suggestions are ATS-friendly (Applicant Tracking System)
`.trim();
  }

  private createFallbackSuggestions(
    cv: CV,
    jobTitle?: string,
    jobDescription?: string,
  ): AiOptimizerOutput['suggestions'] {
    const title = jobTitle || 'the position';
    
    // Extract some basic keywords from job description if available
    const keywords = jobDescription 
      ? this.extractBasicKeywords(jobDescription)
      : ['communication', 'teamwork', 'problem-solving'];

    // Create a fallback summary with reason
    const summary: SuggestionWithReason = {
      suggestion: `Experienced professional with a strong background in ${
        cv.skills?.join(', ') || 'relevant skills'
      }, seeking to leverage expertise as ${title}.`,
      reason: `This summary directly highlights your relevant skills and clearly states your career objective for the ${title} position.`,
    };

    // Create skills suggestion with reason
    const skills = {
      suggestions: cv.skills || [],
      reason: `These skills are relevant to the ${title} position and demonstrate your technical capabilities.`,
    };

    // Create experience suggestions with reasons
    const experience: ExperienceSuggestion[] = (cv.experience || []).map((exp, index) => ({
      index,
      field: 'description',
      suggestion: `${exp.description} Demonstrated expertise in ${keywords.slice(0, 3).join(', ')}, contributing to successful project outcomes.`,
      reason: `This description emphasizes your achievements and the specific skills that are relevant to the ${title} position.`,
    }));

    // Create education suggestions with reasons
    const education: EducationSuggestion[] = (cv.education || []).map((edu, index) => ({
      index,
      field: 'description',
      suggestion: edu.description
        ? `${edu.description} Coursework included ${keywords.slice(0, 2).join(' and ')}, providing relevant knowledge for the ${title} position.`
        : `Relevant coursework included ${keywords.slice(0, 3).join(', ')}, providing a strong foundation for ${title}.`,
      reason: `This connects your educational background to the specific requirements of the ${title} position.`,
    }));

    return {
      summary,
      skills,
      experience,
      education,
    };
  }

  private extractBasicKeywords(text: string): string[] {
    const commonKeywords = [
      'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js',
      'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD',
      'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD',
      'communication', 'teamwork', 'leadership', 'problem-solving',
    ];

    return commonKeywords
      .filter(keyword => text.toLowerCase().includes(keyword.toLowerCase()))
      .slice(0, 5);
  }

  private applySuggestions(
    cv: CV,
    suggestions: AiOptimizerOutput['suggestions'],
  ): void {
    // Apply summary suggestion if available
    if (suggestions.summary) {
      cv.summary = suggestions.summary.suggestion;
    }

    // Apply skills suggestions if available
    if (suggestions.skills && suggestions.skills.suggestions.length > 0) {
      cv.skills = [...suggestions.skills.suggestions];
    }

    // We don't automatically apply experience and education suggestions
    // as these would typically be reviewed by the user first
  }

  private cloneCV(cv: CV): CV {
    return JSON.parse(JSON.stringify(cv)) as CV;
  }
}
