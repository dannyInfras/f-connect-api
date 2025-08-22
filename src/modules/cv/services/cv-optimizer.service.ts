import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { UserService } from '../../user/services/user.service';
import { CV } from '../entities/cv.entity';
import { CvOptimizationHistory } from '../entities/cv-optimization-history.entity';
import {
  AiOptimizerInput,
  AiOptimizerOutput,
  EducationSuggestion,
  ExperienceSuggestion,
  SuggestionWithReason,
} from '../interfaces/ai-optimizer.interface';
import { CvOptimizationHistoryRepository } from '../repositories/cv-optimization-history.repository';

@Injectable()
export class CvOptimizerService {
  private readonly logger = new Logger(CvOptimizerService.name);
  private readonly openaiApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly historyRepository: CvOptimizationHistoryRepository,
    private readonly userService: UserService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  async optimizeCv(input: AiOptimizerInput): Promise<AiOptimizerOutput> {
    try {
      const hasPoints = await this.userService.checkAiPoints(input.userId);
      if (!hasPoints) {
        throw new BadRequestException(
          'You have reached your AI usage limit. Please upgrade your plan or purchase more points.',
        );
      }

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

      await this.userService.deductAiPoints(input.userId);

      const result = {
        optimizedCv,
        suggestions,
      };

      await this.historyRepository.create({
        cvId: input.cv.id,
        userId: input.userId,
        jobTitle: input.jobTitle,
        jobDescription: input.jobDescription,
        suggestions,
        optimizedCv,
        isApplied: false,
      });

      return result;
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
      const prompt = this.buildEnhancedPrompt(cv, jobTitle, jobDescription);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo-16k',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 4000,
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

  private getSystemPrompt(): string {
    return `You are a world-class career consultant and CV optimization expert with extensive experience across ALL industries and job functions including:

INDUSTRIES: Technology, Healthcare, Finance, Education, Manufacturing, Retail, Hospitality, Construction, Legal, Marketing, Sales, Human Resources, Consulting, Non-profit, Government, Creative Arts, Media, Real Estate, Transportation, Energy, Agriculture, and more.

JOB LEVELS: Entry-level, Mid-level, Senior, Executive, C-suite, Specialist, Manager, Director, VP, Freelancer, Contractor, Intern.

EXPERTISE AREAS:
- Industry-specific terminology and keywords for ALL sectors
- ATS (Applicant Tracking System) optimization techniques
- Skills translation across different industries
- Achievement quantification and impact measurement
- Professional branding and positioning
- Market trends and employer expectations across all fields

Your task is to analyze CVs and job descriptions to provide tailored, actionable suggestions that will significantly improve the candidate's chances of success. You MUST respond with ONLY valid JSON format - no additional text, explanations, or formatting.`;
  }

  private buildEnhancedPrompt(
    cv: CV,
    jobTitle?: string,
    jobDescription?: string,
  ): string {
    const industry = this.detectIndustry(jobTitle, jobDescription);
    const jobLevel = this.detectJobLevel(jobTitle, jobDescription);

    return `
RESPOND WITH VALID JSON ONLY - NO OTHER TEXT OR FORMATTING

OPTIMIZATION REQUEST:
Position: "${jobTitle || 'Not specified'}"
Industry: ${industry}
Job Level: ${jobLevel}

JOB DESCRIPTION:
---
${jobDescription || 'No job description provided'}
---

CURRENT CV:
${JSON.stringify(cv, null, 2)}

ANALYSIS INSTRUCTIONS:
1. Industry Context: Consider industry-specific requirements, terminology, and expectations
2. Job Level Alignment: Ensure suggestions match the seniority and responsibility level
3. Keyword Optimization: Extract and incorporate relevant keywords from the job description
4. Skills Gap Analysis: Identify missing skills and suggest how to highlight transferable ones
5. Achievement Quantification: Suggest ways to add metrics and impact statements
6. ATS Optimization: Ensure all suggestions improve ATS compatibility

RESPONSE FORMAT (JSON ONLY):
{
  "summary": {
    "suggestion": "Industry-specific professional summary that incorporates key job requirements and showcases relevant value proposition...",
    "reason": "Detailed explanation of why this summary is optimized for this specific role and industry, including how it addresses key job requirements..."
  },
  "skills": {
    "suggestions": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
    "reason": "Explanation of how these skills directly align with job requirements, industry standards, and ATS optimization for this specific position..."
  },
  "experience": [
    {
      "index": 0,
      "field": "description", 
      "suggestion": "Enhanced description with industry-specific achievements, quantified results, and relevant keywords that demonstrate impact and value...",
      "reason": "Specific explanation of how this revision better aligns with the job requirements, uses industry terminology, and showcases transferable skills..."
    }
  ],
  "education": [
    {
      "index": 0,
      "field": "description",
      "suggestion": "Enhanced education description highlighting relevant coursework, projects, or certifications that align with job requirements...",
      "reason": "Explanation of how this educational background supports the job requirements and adds value to the candidacy..."
    }
  ]
}

OPTIMIZATION PRINCIPLES:
- Use industry-specific language and terminology
- Incorporate keywords naturally from the job description
- Focus on achievements and quantifiable results
- Highlight transferable skills when changing industries
- Ensure professional tone appropriate for the industry and level
- Keep all content truthful and based on existing CV information
- Make suggestions specific to both the job and industry context
- Optimize for ATS while maintaining human readability

IMPORTANT: Return ONLY the JSON object with no additional text, markdown, or formatting.
`.trim();
  }

  private detectIndustry(jobTitle?: string, jobDescription?: string): string {
    const text = `${jobTitle || ''} ${jobDescription || ''}`.toLowerCase();

    const industryKeywords = {
      'Technology/Software': [
        'software',
        'developer',
        'programming',
        'tech',
        'it',
        'digital',
        'app',
        'web',
        'mobile',
        'data',
        'ai',
        'machine learning',
        'cloud',
      ],
      Healthcare: [
        'medical',
        'health',
        'hospital',
        'nurse',
        'doctor',
        'pharmaceutical',
        'clinical',
        'patient',
        'healthcare',
      ],
      'Finance/Banking': [
        'finance',
        'bank',
        'investment',
        'accounting',
        'financial',
        'analyst',
        'trading',
        'insurance',
        'audit',
      ],
      Education: [
        'teacher',
        'education',
        'school',
        'university',
        'academic',
        'curriculum',
        'student',
        'learning',
      ],
      'Marketing/Sales': [
        'marketing',
        'sales',
        'advertising',
        'brand',
        'campaign',
        'customer',
        'revenue',
        'lead generation',
      ],
      Manufacturing: [
        'manufacturing',
        'production',
        'factory',
        'assembly',
        'quality',
        'supply chain',
        'operations',
      ],
      'Retail/E-commerce': [
        'retail',
        'store',
        'customer service',
        'merchandise',
        'inventory',
        'e-commerce',
        'online',
      ],
      Legal: [
        'legal',
        'law',
        'attorney',
        'lawyer',
        'court',
        'compliance',
        'contract',
        'litigation',
      ],
      'Construction/Engineering': [
        'construction',
        'engineering',
        'building',
        'civil',
        'mechanical',
        'electrical',
        'project management',
      ],
      'Hospitality/Tourism': [
        'hotel',
        'restaurant',
        'tourism',
        'hospitality',
        'service',
        'guest',
        'travel',
      ],
      'Non-profit/Government': [
        'nonprofit',
        'government',
        'public',
        'community',
        'social',
        'policy',
        'advocacy',
      ],
      'Media/Creative': [
        'design',
        'creative',
        'media',
        'content',
        'graphic',
        'video',
        'photography',
        'writing',
      ],
    };

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return industry;
      }
    }

    return 'General/Cross-Industry';
  }

  private detectJobLevel(jobTitle?: string, jobDescription?: string): string {
    const text = `${jobTitle || ''} ${jobDescription || ''}`.toLowerCase();

    if (
      text.includes('ceo') ||
      text.includes('cto') ||
      text.includes('cfo') ||
      text.includes('president')
    ) {
      return 'C-Level/Executive';
    }
    if (
      text.includes('director') ||
      text.includes('vp') ||
      text.includes('vice president')
    ) {
      return 'Director/VP Level';
    }
    if (
      text.includes('manager') ||
      text.includes('lead') ||
      text.includes('supervisor')
    ) {
      return 'Manager/Team Lead';
    }
    if (text.includes('senior') || text.includes('sr.')) {
      return 'Senior Level';
    }
    if (
      text.includes('junior') ||
      text.includes('jr.') ||
      text.includes('entry') ||
      text.includes('intern')
    ) {
      return 'Entry/Junior Level';
    }

    return 'Mid Level';
  }

  private createFallbackSuggestions(
    cv: CV,
    jobTitle?: string,
    jobDescription?: string,
  ): AiOptimizerOutput['suggestions'] {
    const title = jobTitle || 'the position';
    const industry = this.detectIndustry(jobTitle, jobDescription);

    // Extract keywords from job description if available
    const keywords = jobDescription
      ? this.extractUniversalKeywords(jobDescription, industry)
      : this.getDefaultSkillsByIndustry(industry);

    // Create a fallback summary with industry context
    const summary: SuggestionWithReason = {
      suggestion: `Results-driven professional with proven expertise in ${
        cv.skills?.slice(0, 3).join(', ') || 'key competencies'
      }. Seeking to leverage ${
        cv.experience?.length || 0
      }+ years of experience to drive success as ${title} in the ${industry} sector.`,
      reason: `This summary positions your experience within the ${industry} industry context and directly addresses the ${title} role requirements while highlighting your most relevant qualifications.`,
    };

    // Create skills suggestion with industry relevance
    const skills = {
      suggestions: [...(cv.skills || []), ...keywords.slice(0, 5)].filter(
        (skill, index, arr) => arr.indexOf(skill) === index,
      ),
      reason: `These skills combine your existing competencies with industry-specific requirements for ${industry} positions, ensuring both ATS optimization and relevance to the ${title} role.`,
    };

    // Create experience suggestions
    const experience: ExperienceSuggestion[] = (cv.experience || []).map(
      (exp, index) => ({
        index,
        field: 'description',
        suggestion: `${exp.description} Successfully applied ${keywords.slice(0, 2).join(' and ')} expertise to deliver measurable results and drive organizational objectives in line with industry best practices.`,
        reason: `This enhanced description demonstrates your ability to apply relevant skills in a professional context while using industry-appropriate terminology that will resonate with ${industry} employers.`,
      }),
    );

    // Create education suggestions
    const education: EducationSuggestion[] = (cv.education || []).map(
      (edu, index) => ({
        index,
        field: 'description',
        suggestion: edu.description
          ? `${edu.description} Developed strong foundation in ${keywords.slice(0, 2).join(' and ')}, directly applicable to ${industry} challenges and ${title} responsibilities.`
          : `Academic background includes relevant coursework in ${keywords.slice(0, 2).join(', ')}, providing essential knowledge base for success in ${industry} and specifically in ${title} roles.`,
        reason: `This educational positioning demonstrates how your academic background directly supports the requirements of the ${title} position within the ${industry} context.`,
      }),
    );

    return {
      summary,
      skills,
      experience,
      education,
    };
  }

  private extractUniversalKeywords(text: string, industry: string): string[] {
    const universalKeywords = {
      'Technology/Software': [
        'JavaScript',
        'Python',
        'React',
        'Node.js',
        'AWS',
        'Docker',
        'Agile',
        'API',
        'Database',
        'Cloud Computing',
        'Machine Learning',
        'DevOps',
        'Microservices',
        'Version Control',
        'Testing',
        'CI/CD',
      ],
      Healthcare: [
        'Patient Care',
        'Medical Records',
        'Healthcare Compliance',
        'Clinical Research',
        'Healthcare Technology',
        'Patient Safety',
        'Medical Terminology',
        'HIPAA',
        'Electronic Health Records',
        'Healthcare Quality',
      ],
      'Finance/Banking': [
        'Financial Analysis',
        'Risk Management',
        'Compliance',
        'Investment',
        'Portfolio Management',
        'Financial Reporting',
        'Audit',
        'Regulatory',
        'Budgeting',
        'Financial Planning',
      ],
      Education: [
        'Curriculum Development',
        'Student Assessment',
        'Educational Technology',
        'Classroom Management',
        'Learning Objectives',
        'Educational Research',
        'Instructional Design',
        'Student Engagement',
      ],
      'Marketing/Sales': [
        'Digital Marketing',
        'Lead Generation',
        'Customer Acquisition',
        'Brand Management',
        'Analytics',
        'Campaign Management',
        'Sales Funnel',
        'CRM',
        'Content Marketing',
        'Social Media',
      ],
      Manufacturing: [
        'Quality Control',
        'Process Improvement',
        'Supply Chain',
        'Lean Manufacturing',
        'Safety Compliance',
        'Production Planning',
        'Inventory Management',
        'Equipment Maintenance',
        'Cost Reduction',
      ],
      Legal: [
        'Legal Research',
        'Contract Management',
        'Compliance',
        'Litigation',
        'Legal Writing',
        'Regulatory Affairs',
        'Due Diligence',
        'Legal Analysis',
        'Case Management',
      ],
    };

    const industryKeywords = universalKeywords[
      industry as keyof typeof universalKeywords
    ] || [
      'Communication',
      'Leadership',
      'Problem Solving',
      'Team Collaboration',
      'Project Management',
      'Strategic Planning',
      'Process Improvement',
      'Customer Service',
      'Analytical Thinking',
      'Adaptability',
    ];

    return industryKeywords
      .filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))
      .slice(0, 8);
  }

  private getDefaultSkillsByIndustry(industry: string): string[] {
    const defaultSkills = {
      'Technology/Software': [
        'Problem Solving',
        'Technical Analysis',
        'System Design',
        'Code Review',
      ],
      Healthcare: [
        'Patient Care',
        'Medical Knowledge',
        'Attention to Detail',
        'Empathy',
      ],
      'Finance/Banking': [
        'Financial Analysis',
        'Risk Assessment',
        'Attention to Detail',
        'Compliance',
      ],
      Education: ['Communication', 'Patience', 'Adaptability', 'Mentoring'],
      'Marketing/Sales': [
        'Communication',
        'Relationship Building',
        'Analytical Thinking',
        'Creativity',
      ],
      Manufacturing: [
        'Quality Focus',
        'Safety Awareness',
        'Process Optimization',
        'Team Collaboration',
      ],
      Legal: [
        'Analytical Thinking',
        'Attention to Detail',
        'Legal Writing',
        'Research Skills',
      ],
    };

    return (
      defaultSkills[industry as keyof typeof defaultSkills] || [
        'Communication',
        'Leadership',
        'Problem Solving',
        'Team Collaboration',
      ]
    );
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
  }

  async getOptimizationHistory(cvId: string): Promise<CvOptimizationHistory[]> {
    return this.historyRepository.findByCvId(cvId);
  }

  // Quick restore từ history
  async restoreFromHistory(historyId: string): Promise<AiOptimizerOutput> {
    const history = await this.historyRepository.findById(historyId);
    if (!history) {
      throw new Error('History not found');
    }

    // await this.historyRepository.markAsApplied(historyId);

    return {
      optimizedCv: history.optimizedCv as CV,
      suggestions: history.suggestions,
    };
  }

  private cloneCV(cv: CV): CV {
    return JSON.parse(JSON.stringify(cv)) as CV;
  }
}
