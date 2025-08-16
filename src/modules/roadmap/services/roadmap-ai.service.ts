import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { UserService } from '../../user/services/user.service';
import {
  CVAnalysis,
  CVSnapshot,
  RoadmapSkill,
  RoadmapSubTask,
  RoadmapTask,
} from '../entities/roadmap.entity';

@Injectable()
export class RoadmapAiService {
  private readonly logger = new Logger(RoadmapAiService.name);
  private readonly openaiApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  /**
   * Generate comprehensive roadmap with CV analysis
   */
  async generateRoadmap(
    userId: number,
    cvData: any,
    jobDetails: any,
  ): Promise<{
    title: string;
    description: string;
    estimatedDuration: number;
    skills: RoadmapSkill[];
    cvSnapshot: CVSnapshot;
    cvAnalysis: CVAnalysis;
  }> {
    try {
      const hasPoints = await this.userService.checkAiPoints(userId);
      if (!hasPoints) {
        throw new BadRequestException(
          'You have reached your AI usage limit. Please upgrade your plan or purchase more points.',
        );
      }

      // Step 1: Create CV snapshot
      const cvSnapshot = this.createCVSnapshot(cvData);

      // Step 2: Analyze CV against job
      const cvAnalysis = await this.analyzeCVForJob(cvSnapshot, jobDetails);

      // Step 3: Determine industry
      const industry = this.determineIndustry(jobDetails);

      // Step 4: Generate personalized roadmap
      const roadmapSkills = await this.generatePersonalizedRoadmap(
        cvSnapshot,
        cvAnalysis,
        jobDetails,
        industry,
      );

      await this.userService.deductAiPoints(userId);

      return {
        title: `Roadmap to ${jobDetails.title}`,
        description: `Personalized learning path from ${cvAnalysis.experienceLevel} level to ${jobDetails.title} in ${industry}`,
        estimatedDuration: this.calculateEstimatedDuration(
          cvAnalysis.experienceLevel,
        ),
        skills: roadmapSkills,
        cvSnapshot,
        cvAnalysis,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error generating roadmap: ${errorMessage}`);

      // Fallback generation
      return this.generateFallbackRoadmap(cvData, jobDetails);
    }
  }

  /**
   * Create CV snapshot
   */
  private createCVSnapshot(cvData: any): CVSnapshot {
    const experience = (cvData.experience || []).map((exp: any) => ({
      company: exp.company,
      role: exp.role,
      description: exp.description,
      startDate: exp.startDate,
      endDate: exp.endDate,
      duration: this.calculateDurationBetweenDates(exp.startDate, exp.endDate),
    }));

    return {
      name: cvData.name || 'Unknown',
      email: cvData.email || '',
      phone: cvData.phone || '',
      summary: cvData.summary || '',
      experience,
      education: (cvData.education || []).map((edu: any) => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        startYear: edu.startYear,
        endYear: edu.endYear,
      })),
      skills: Array.isArray(cvData.skills) ? cvData.skills : [],
      certifications: cvData.certifications || [],
      languages: cvData.languages || [],
      totalExperience: this.calculateTotalExperience(experience),
    };
  }

  /**
   * Analyze CV for job match
   */
  private async analyzeCVForJob(
    cvSnapshot: CVSnapshot,
    jobDetails: any,
  ): Promise<CVAnalysis> {
    const prompt = `
Analyze this CV against the job requirements. Be specific and practical.

CV SUMMARY:
- Name: ${cvSnapshot.name}
- Experience: ${cvSnapshot.totalExperience} years
- Current/Recent Role: ${cvSnapshot.experience[0]?.role || 'No experience'}
- Skills: ${cvSnapshot.skills.join(', ') || 'No skills listed'}
- Education: ${cvSnapshot.education.map((e) => `${e.degree} in ${e.field}`).join(', ') || 'Not specified'}

JOB TARGET:
- Position: ${jobDetails.title}
- Description: ${jobDetails.description || 'General position'}

Provide a realistic assessment in JSON format:
{
  "overallScore": [0-100 based on actual match],
  "experienceLevel": "entry|junior|mid|senior|expert",
  "strengths": ["3 specific strengths based on CV"],
  "weaknesses": ["3 specific areas needing improvement"],
  "skillGaps": ["specific skills missing for this role"],
  "recommendations": ["3 actionable recommendations"],
  "matchPercentage": [0-100],
  "detailedAnalysis": {
    "experience": {
      "score": [0-100],
      "feedback": "Specific feedback about their experience"
    },
    "skills": {
      "score": [0-100],
      "feedback": "Specific feedback about skills",
      "matching": ["skills they have that match"],
      "missing": ["skills they need to develop"]
    },
    "education": {
      "score": [0-100],
      "feedback": "Feedback about educational background"
    },
    "overall": {
      "summary": "Honest assessment summary",
      "nextSteps": ["3 specific next steps"]
    }
  }
}`;

    try {
      const response = await this.callOpenAI(prompt);
      const content = response?.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);

      // Validate and ensure all required fields
      return this.validateCVAnalysis(parsed);
    } catch (error) {
      this.logger.warn('AI analysis failed, using fallback analysis');
      return this.generateFallbackAnalysis(cvSnapshot);
    }
  }

  /**
   * Generate personalized roadmap based on analysis
   */
  private async generatePersonalizedRoadmap(
    cvSnapshot: CVSnapshot,
    cvAnalysis: CVAnalysis,
    jobDetails: any,
    industry: string,
  ): Promise<RoadmapSkill[]> {
    const prompt = `
Create a personalized learning roadmap for ${industry} industry.

CANDIDATE ANALYSIS:
- Current Level: ${cvAnalysis.experienceLevel}
- Match: ${cvAnalysis.matchPercentage}%
- Skill Gaps: ${cvAnalysis.skillGaps.join(', ')}
- Strengths: ${cvAnalysis.strengths.join(', ')}

TARGET:
- Job: ${jobDetails.title}
- Industry: ${industry}

Create 4-6 skills with detailed tasks and subtasks.
IMPORTANT: 
- Skills must be specific to ${industry}, not generic
- Each task needs 3-5 detailed subtasks
- No external resources/links, only guidance
- Tasks should build progressively

Return JSON:
{
  "skills": [
    {
      "id": "skill-1",
      "title": "[Industry-Specific Skill Name]",
      "description": "Why this skill matters in ${industry}",
      "category": "fundamental|core|advanced|specialized",
      "difficulty": "beginner|intermediate|advanced|expert",
      "estimatedHours": [20-80],
      "prerequisites": [],
      "progress": 0,
      "order": 1,
      "reason": "Specific reason why candidate needs this based on their CV analysis",
      "tasks": [
        {
          "id": "task-1",
          "title": "Specific task for ${industry}",
          "description": "Detailed description of what to do",
          "type": "learn|practice|project|review|assessment",
          "estimatedHours": [2-10],
          "priority": "critical|high|medium|low",
          "completed": false,
          "order": 1,
          "tips": ["Practical tip 1", "Practical tip 2"],
          "subTasks": [
            {
              "id": "subtask-1",
              "title": "Specific step",
              "description": "Exactly what to do",
              "completed": false,
              "order": 1,
              "estimatedMinutes": 30,
              "checkCriteria": "How to verify completion"
            }
            // 3-5 subtasks per task
          ]
        }
        // 5-8 tasks per skill
      ]
    }
  ]
}`;

    try {
      const response = await this.callOpenAI(prompt);
      const content = response?.choices?.[0]?.message?.content;
      const data = JSON.parse(content);
      return this.processAndValidateSkills(data.skills, cvAnalysis);
    } catch (error) {
      this.logger.warn('AI generation failed, using fallback skills');
      return this.generateIndustrySpecificFallbackSkills(
        industry,
        cvAnalysis,
        jobDetails,
      );
    }
  }

  /**
   * Process and validate skills with proper structure
   */
  private processAndValidateSkills(
    skills: any[],
    cvAnalysis: CVAnalysis,
  ): RoadmapSkill[] {
    return skills.slice(0, 6).map((skill, index) => {
      const processedSkill: RoadmapSkill = {
        id: skill.id || uuidv4(),
        title: skill.title || `Skill ${index + 1}`,
        description: skill.description || 'Develop this skill area',
        category: this.validateCategory(skill.category),
        difficulty: this.validateDifficulty(skill.difficulty),
        estimatedHours: Math.min(Math.max(skill.estimatedHours || 40, 20), 100),
        prerequisites:
          skill.prerequisites || (index > 0 ? [`skill-${index}`] : []),
        progress: 0,
        order: index + 1,
        reason:
          skill.reason ||
          `Important based on ${cvAnalysis.matchPercentage}% job match`,
        tasks: this.processAndValidateTasks(skill.tasks || [], skill.title),
      };

      return processedSkill;
    });
  }

  /**
   * Process and validate tasks with subtasks
   */
  private processAndValidateTasks(
    tasks: any[],
    skillTitle: string,
  ): RoadmapTask[] {
    // Ensure minimum 5 tasks
    if (tasks.length < 5) {
      tasks = [
        ...tasks,
        ...this.generateDefaultTasks(skillTitle, 5 - tasks.length),
      ];
    }

    return tasks.slice(0, 10).map((task, index) => {
      const processedTask: RoadmapTask = {
        id: task.id || uuidv4(),
        title: task.title || `Task ${index + 1}`,
        description: task.description || `Complete this task for ${skillTitle}`,
        type: this.validateTaskType(task.type),
        estimatedHours: Math.min(Math.max(task.estimatedHours || 4, 1), 20),
        priority: this.validatePriority(task.priority),
        completed: false,
        order: index + 1,
        tips: Array.isArray(task.tips)
          ? task.tips.slice(0, 5)
          : this.generateDefaultTips(),
        relatedSkills: task.relatedSkills || [],
        subTasks: this.processAndValidateSubTasks(
          task.subTasks || [],
          task.title || `Task ${index + 1}`,
        ),
      };

      return processedTask;
    });
  }

  /**
   * Process and validate subtasks
   */
  private processAndValidateSubTasks(
    subTasks: any[],
    parentTaskTitle: string,
  ): RoadmapSubTask[] {
    // Ensure minimum 3 subtasks
    if (subTasks.length < 3) {
      subTasks = this.generateDefaultSubTasks(parentTaskTitle);
    }

    return subTasks.slice(0, 8).map((subTask, index) => ({
      id: subTask.id || uuidv4(),
      title: subTask.title || `Step ${index + 1}`,
      description:
        subTask.description ||
        `Complete step ${index + 1} of ${parentTaskTitle}`,
      completed: false,
      order: index + 1,
      estimatedMinutes: Math.min(
        Math.max(subTask.estimatedMinutes || 30, 10),
        180,
      ),
      checkCriteria: subTask.checkCriteria || 'Verify this step is complete',
    }));
  }

  /**
   * Determine industry from job details
   */
  private determineIndustry(jobDetails: any): string {
    const title = (jobDetails?.title || '').toLowerCase();
    const description = (jobDetails?.description || '').toLowerCase();
    const combined = `${title} ${description}`;

    const industryMap: { [key: string]: string[] } = {
      Technology: [
        'software',
        'developer',
        'programmer',
        'engineer',
        'tech',
        'it',
        'data',
        'cloud',
      ],
      Healthcare: [
        'medical',
        'health',
        'doctor',
        'nurse',
        'patient',
        'clinical',
        'hospital',
      ],
      Finance: [
        'finance',
        'banking',
        'investment',
        'accounting',
        'financial',
        'trader',
      ],
      Education: [
        'teacher',
        'education',
        'professor',
        'instructor',
        'academic',
        'school',
      ],
      Marketing: [
        'marketing',
        'brand',
        'advertising',
        'campaign',
        'digital',
        'social media',
      ],
      Sales: [
        'sales',
        'business development',
        'account',
        'customer',
        'revenue',
      ],
      Manufacturing: [
        'manufacturing',
        'production',
        'factory',
        'assembly',
        'quality',
      ],
      Retail: ['retail', 'store', 'shop', 'merchandise', 'customer service'],
      Legal: ['lawyer', 'legal', 'attorney', 'law', 'compliance', 'contract'],
      'Real Estate': [
        'real estate',
        'property',
        'realtor',
        'housing',
        'rental',
      ],
      Hospitality: ['hotel', 'restaurant', 'tourism', 'guest', 'hospitality'],
      Construction: [
        'construction',
        'building',
        'contractor',
        'architect',
        'civil',
      ],
      Transportation: [
        'logistics',
        'transportation',
        'shipping',
        'delivery',
        'driver',
      ],
      Agriculture: ['farm', 'agriculture', 'crop', 'livestock', 'agricultural'],
      Energy: ['energy', 'oil', 'gas', 'renewable', 'power', 'utility'],
      Media: ['media', 'journalism', 'reporter', 'content', 'broadcast'],
      Arts: ['art', 'design', 'creative', 'artist', 'graphic', 'music'],
      Government: [
        'government',
        'public',
        'policy',
        'administration',
        'federal',
      ],
      'Non-profit': [
        'nonprofit',
        'charity',
        'volunteer',
        'social',
        'community',
      ],
      Consulting: [
        'consultant',
        'advisory',
        'strategy',
        'management consulting',
      ],
    };

    for (const [industry, keywords] of Object.entries(industryMap)) {
      if (keywords.some((keyword) => combined.includes(keyword))) {
        return industry;
      }
    }

    return 'General Business';
  }

  /**
   * Generate industry-specific fallback skills
   */
  private generateIndustrySpecificFallbackSkills(
    industry: string,
    cvAnalysis: CVAnalysis,
    jobDetails: any,
  ): RoadmapSkill[] {
    const industrySkills = this.getIndustrySpecificSkills(industry);

    return industrySkills.map((skillTemplate, index) => ({
      id: uuidv4(),
      title: skillTemplate.title,
      description: skillTemplate.description,
      category: skillTemplate.category as any,
      difficulty: this.mapExperienceToDifficulty(cvAnalysis.experienceLevel),
      estimatedHours: 40 + index * 10,
      prerequisites: index > 0 ? [industrySkills[index - 1].title] : [],
      progress: 0,
      order: index + 1,
      reason: `Based on your ${cvAnalysis.experienceLevel} level, this skill will help you transition to ${jobDetails.title}`,
      tasks: this.generateIndustryTasks(skillTemplate.title, industry),
    }));
  }

  /**
   * Get industry-specific skill templates
   */
  private getIndustrySpecificSkills(industry: string): any[] {
    const skillMap: { [key: string]: any[] } = {
      Technology: [
        {
          title: 'Programming Fundamentals',
          description: 'Core programming concepts and best practices',
          category: 'fundamental',
        },
        {
          title: 'System Design',
          description: 'Architecture and design patterns',
          category: 'core',
        },
        {
          title: 'Cloud Technologies',
          description: 'Cloud platforms and services',
          category: 'advanced',
        },
        {
          title: 'DevOps Practices',
          description: 'CI/CD and automation',
          category: 'specialized',
        },
      ],
      Healthcare: [
        {
          title: 'Clinical Procedures',
          description: 'Essential medical procedures and protocols',
          category: 'fundamental',
        },
        {
          title: 'Patient Care',
          description: 'Patient interaction and care management',
          category: 'core',
        },
        {
          title: 'Medical Documentation',
          description: 'Healthcare records and compliance',
          category: 'advanced',
        },
        {
          title: 'Healthcare Technology',
          description: 'Medical software and equipment',
          category: 'specialized',
        },
      ],
      Finance: [
        {
          title: 'Financial Analysis',
          description: 'Financial statements and analysis techniques',
          category: 'fundamental',
        },
        {
          title: 'Risk Management',
          description: 'Risk assessment and mitigation',
          category: 'core',
        },
        {
          title: 'Investment Strategies',
          description: 'Portfolio management and investment',
          category: 'advanced',
        },
        {
          title: 'Regulatory Compliance',
          description: 'Financial regulations and compliance',
          category: 'specialized',
        },
      ],
      Marketing: [
        {
          title: 'Marketing Fundamentals',
          description: 'Core marketing concepts and strategies',
          category: 'fundamental',
        },
        {
          title: 'Digital Marketing',
          description: 'Online marketing channels and tactics',
          category: 'core',
        },
        {
          title: 'Data Analytics',
          description: 'Marketing metrics and analysis',
          category: 'advanced',
        },
        {
          title: 'Brand Management',
          description: 'Brand strategy and positioning',
          category: 'specialized',
        },
      ],
      Education: [
        {
          title: 'Pedagogical Methods',
          description: 'Teaching techniques and methodologies',
          category: 'fundamental',
        },
        {
          title: 'Curriculum Development',
          description: 'Course design and planning',
          category: 'core',
        },
        {
          title: 'Student Assessment',
          description: 'Evaluation and feedback methods',
          category: 'advanced',
        },
        {
          title: 'Educational Technology',
          description: 'Digital tools for education',
          category: 'specialized',
        },
      ],
      Sales: [
        {
          title: 'Sales Fundamentals',
          description: 'Basic sales techniques and processes',
          category: 'fundamental',
        },
        {
          title: 'Customer Relationship',
          description: 'Building and maintaining client relationships',
          category: 'core',
        },
        {
          title: 'Negotiation Skills',
          description: 'Advanced negotiation tactics',
          category: 'advanced',
        },
        {
          title: 'Sales Analytics',
          description: 'Data-driven sales strategies',
          category: 'specialized',
        },
      ],
      default: [
        {
          title: 'Industry Fundamentals',
          description: 'Core concepts of the field',
          category: 'fundamental',
        },
        {
          title: 'Professional Skills',
          description: 'Essential professional competencies',
          category: 'core',
        },
        {
          title: 'Advanced Techniques',
          description: 'Specialized methods and approaches',
          category: 'advanced',
        },
        {
          title: 'Leadership & Strategy',
          description: 'Strategic thinking and leadership',
          category: 'specialized',
        },
      ],
    };

    return skillMap[industry] || skillMap['default'];
  }

  /**
   * Generate industry-specific tasks
   */
  private generateIndustryTasks(
    skillTitle: string,
    industry: string,
  ): RoadmapTask[] {
    const taskTemplates = [
      {
        title: `Understand ${skillTitle} fundamentals in ${industry}`,
        type: 'learn' as const,
        priority: 'critical' as const,
        hours: 5,
      },
      {
        title: `Study ${industry} best practices for ${skillTitle}`,
        type: 'learn' as const,
        priority: 'high' as const,
        hours: 4,
      },
      {
        title: `Practice ${skillTitle} with ${industry} scenarios`,
        type: 'practice' as const,
        priority: 'high' as const,
        hours: 6,
      },
      {
        title: `Complete a ${skillTitle} project relevant to ${industry}`,
        type: 'project' as const,
        priority: 'high' as const,
        hours: 10,
      },
      {
        title: `Review and assess your ${skillTitle} knowledge`,
        type: 'assessment' as const,
        priority: 'medium' as const,
        hours: 3,
      },
    ];

    return taskTemplates.map((template, index) => ({
      id: uuidv4(),
      title: template.title,
      description: `${template.title} to build expertise`,
      type: template.type,
      estimatedHours: template.hours,
      priority: template.priority,
      completed: false,
      order: index + 1,
      tips: this.generateIndustryTips(industry),
      relatedSkills: [],
      subTasks: this.generateDefaultSubTasks(template.title),
    }));
  }

  /**
   * Generate default subtasks
   */
  private generateDefaultSubTasks(parentTaskTitle: string): RoadmapSubTask[] {
    return [
      {
        id: uuidv4(),
        title: 'Research and gather information',
        description: `Research key concepts related to ${parentTaskTitle}`,
        completed: false,
        order: 1,
        estimatedMinutes: 30,
        checkCriteria: 'Have clear notes on key concepts',
      },
      {
        id: uuidv4(),
        title: 'Study fundamental concepts',
        description: `Understand the core principles`,
        completed: false,
        order: 2,
        estimatedMinutes: 45,
        checkCriteria: 'Can explain concepts clearly',
      },
      {
        id: uuidv4(),
        title: 'Practice with examples',
        description: `Apply knowledge through hands-on practice`,
        completed: false,
        order: 3,
        estimatedMinutes: 60,
        checkCriteria: 'Completed practice exercises successfully',
      },
      {
        id: uuidv4(),
        title: 'Create practical application',
        description: `Build something to demonstrate understanding`,
        completed: false,
        order: 4,
        estimatedMinutes: 90,
        checkCriteria: 'Working example or project completed',
      },
      {
        id: uuidv4(),
        title: 'Document and review learning',
        description: `Summarize key learnings and insights`,
        completed: false,
        order: 5,
        estimatedMinutes: 30,
        checkCriteria: 'Documentation complete and organized',
      },
    ];
  }

  /**
   * Generate default tasks
   */
  private generateDefaultTasks(skillTitle: string, count: number): any[] {
    const templates = [
      { title: `Advanced practice for ${skillTitle}`, type: 'practice' },
      { title: `Case study analysis`, type: 'project' },
      { title: `Peer review and feedback`, type: 'review' },
      { title: `Real-world application`, type: 'project' },
      { title: `Knowledge assessment`, type: 'assessment' },
    ];

    return templates.slice(0, count).map((template) => ({
      title: template.title,
      type: template.type,
      estimatedHours: 4,
      priority: 'medium',
    }));
  }

  /**
   * Generate industry-specific tips
   */
  private generateIndustryTips(industry: string): string[] {
    const tipsMap: { [key: string]: string[] } = {
      Technology: [
        'Focus on practical implementation over theory',
        'Build projects to demonstrate skills',
        'Stay updated with latest technologies',
        'Contribute to open source when possible',
      ],
      Healthcare: [
        'Prioritize patient safety and care quality',
        'Stay current with medical guidelines',
        'Practice evidence-based approaches',
        'Develop strong communication skills',
      ],
      Finance: [
        'Understand regulatory requirements',
        'Focus on accuracy and attention to detail',
        'Develop analytical thinking',
        'Stay informed about market trends',
      ],
      default: [
        'Start with fundamentals before advancing',
        'Practice regularly to build proficiency',
        'Seek feedback from professionals',
        'Document your learning progress',
      ],
    };

    return tipsMap[industry] || tipsMap['default'];
  }

  /**
   * Generate default tips
   */
  private generateDefaultTips(): string[] {
    return [
      'Break down complex topics into smaller parts',
      'Practice consistently for better retention',
      'Apply learning to real-world scenarios',
    ];
  }

  /**
   * Calculate duration between dates (returns string)
   */
  private calculateDurationBetweenDates(
    startDate?: string,
    endDate?: string,
  ): string {
    if (!startDate) return 'Unknown';

    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      const months = Math.max(
        0,
        (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth()),
      );

      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;

      if (years > 0 && remainingMonths > 0) {
        return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
      } else if (years > 0) {
        return `${years} year${years > 1 ? 's' : ''}`;
      } else {
        return `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
      }
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Calculate total experience
   */
  private calculateTotalExperience(experience: any[]): number {
    if (!experience || experience.length === 0) return 0;

    let totalMonths = 0;
    experience.forEach((exp: any) => {
      if (exp.startDate) {
        try {
          const start = new Date(exp.startDate);
          const end = exp.endDate ? new Date(exp.endDate) : new Date();
          const months = Math.max(
            0,
            (end.getFullYear() - start.getFullYear()) * 12 +
              (end.getMonth() - start.getMonth()),
          );
          totalMonths += months;
        } catch {
          // Skip invalid dates
        }
      }
    });

    return Math.round((totalMonths / 12) * 10) / 10;
  }

  /**
   * Calculate estimated duration based on experience level (returns number)
   */
  private calculateEstimatedDuration(experienceLevel: string): number {
    const durationMap: { [key: string]: number } = {
      entry: 24,
      junior: 20,
      mid: 16,
      senior: 12,
      expert: 8,
    };
    return durationMap[experienceLevel] || 16;
  }

  /**
   * Map experience level to difficulty
   */
  private mapExperienceToDifficulty(
    level: string,
  ): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const map: { [key: string]: any } = {
      entry: 'beginner',
      junior: 'beginner',
      mid: 'intermediate',
      senior: 'advanced',
      expert: 'expert',
    };
    return map[level] || 'intermediate';
  }

  /**
   * Validate CV Analysis
   */
  private validateCVAnalysis(analysis: any): CVAnalysis {
    return {
      overallScore: analysis.overallScore || 50,
      experienceLevel: analysis.experienceLevel || 'entry',
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
      skillGaps: Array.isArray(analysis.skillGaps) ? analysis.skillGaps : [],
      recommendations: Array.isArray(analysis.recommendations)
        ? analysis.recommendations
        : [],
      matchPercentage: analysis.matchPercentage || 50,
      detailedAnalysis: {
        experience: analysis.detailedAnalysis?.experience || {
          score: 50,
          feedback: 'Experience assessment',
        },
        skills: analysis.detailedAnalysis?.skills || {
          score: 50,
          feedback: 'Skills assessment',
          matching: [],
          missing: [],
        },
        education: analysis.detailedAnalysis?.education || {
          score: 50,
          feedback: 'Education assessment',
        },
        overall: analysis.detailedAnalysis?.overall || {
          summary: 'Overall assessment',
          nextSteps: ['Continue learning'],
        },
      },
    };
  }

  /**
   * Generate fallback CV analysis
   */
  private generateFallbackAnalysis(cvSnapshot: CVSnapshot): CVAnalysis {
    const hasExperience = cvSnapshot.experience.length > 0;
    const totalExp = cvSnapshot.totalExperience || 0;

    const experienceLevel =
      totalExp === 0
        ? 'entry'
        : totalExp < 2
          ? 'junior'
          : totalExp < 5
            ? 'mid'
            : totalExp < 8
              ? 'senior'
              : 'expert';

    return {
      overallScore: hasExperience ? 60 : 30,
      experienceLevel,
      strengths: [
        hasExperience
          ? 'Has relevant work experience'
          : 'Eager to start career',
        cvSnapshot.education.length > 0
          ? 'Good educational background'
          : 'Self-motivated learner',
        cvSnapshot.skills.length > 3 ? 'Diverse skill set' : 'Focused approach',
      ],
      weaknesses: [
        'Need to develop specialized skills',
        'Limited industry-specific experience',
        'Requires practical application',
      ],
      skillGaps: [
        'Advanced technical skills',
        'Industry best practices',
        'Leadership experience',
      ],
      recommendations: [
        'Focus on building core competencies',
        'Gain hands-on experience through projects',
        'Network with industry professionals',
      ],
      matchPercentage: hasExperience ? 50 : 25,
      detailedAnalysis: {
        experience: {
          score: hasExperience ? 60 : 20,
          feedback: hasExperience
            ? `You have ${totalExp} years of experience that provides a foundation`
            : 'You need to build practical experience in the field',
        },
        skills: {
          score: cvSnapshot.skills.length > 5 ? 70 : 40,
          feedback: 'Your skills need enhancement for the target role',
          matching: cvSnapshot.skills.slice(0, 3),
          missing: ['Industry-specific skills', 'Advanced techniques'],
        },
        education: {
          score: cvSnapshot.education.length > 0 ? 70 : 30,
          feedback:
            cvSnapshot.education.length > 0
              ? 'Your educational background provides good foundation'
              : 'Consider formal education or certifications',
        },
        overall: {
          summary: `As a ${experienceLevel} professional, you have potential but need focused development`,
          nextSteps: [
            'Complete this personalized roadmap',
            'Build portfolio projects',
            'Network with professionals in the field',
          ],
        },
      },
    };
  }

  /**
   * Generate complete fallback roadmap
   */
  private async generateFallbackRoadmap(
    cvData: any,
    jobDetails: any,
  ): Promise<any> {
    const cvSnapshot = this.createCVSnapshot(cvData);
    const cvAnalysis = this.generateFallbackAnalysis(cvSnapshot);
    const industry = this.determineIndustry(jobDetails);
    const skills = this.generateIndustrySpecificFallbackSkills(
      industry,
      cvAnalysis,
      jobDetails,
    );

    return {
      title: `Learning Path to ${jobDetails.title || 'Target Position'}`,
      description: `Structured roadmap for ${industry} industry`,
      estimatedDuration: this.calculateEstimatedDuration(
        cvAnalysis.experienceLevel,
      ),
      skills,
      cvSnapshot,
      cvAnalysis,
    };
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<any> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo-16k',
          messages: [
            {
              role: 'system',
              content:
                'You are an expert career advisor specializing in all industries. Provide practical, industry-specific guidance.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`OpenAI API call failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Validate category
   */
  private validateCategory(
    category: string,
  ): 'fundamental' | 'core' | 'advanced' | 'specialized' {
    const valid = ['fundamental', 'core', 'advanced', 'specialized'];
    return valid.includes(category) ? (category as any) : 'core';
  }

  /**
   * Validate difficulty
   */
  private validateDifficulty(
    difficulty: string,
  ): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const valid = ['beginner', 'intermediate', 'advanced', 'expert'];
    return valid.includes(difficulty) ? (difficulty as any) : 'intermediate';
  }

  /**
   * Validate task type
   */
  private validateTaskType(
    type: string,
  ): 'learn' | 'practice' | 'project' | 'review' | 'assessment' {
    const valid = ['learn', 'practice', 'project', 'review', 'assessment'];
    return valid.includes(type) ? (type as any) : 'learn';
  }

  /**
   * Validate priority
   */
  private validatePriority(
    priority: string,
  ): 'critical' | 'high' | 'medium' | 'low' {
    const valid = ['critical', 'high', 'medium', 'low'];
    return valid.includes(priority) ? (priority as any) : 'medium';
  }
}
