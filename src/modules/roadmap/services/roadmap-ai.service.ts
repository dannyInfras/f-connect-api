import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { RoadmapSkill } from '../entities/roadmap.entity';

interface Experience {
  role: string;
  company: string;
}

interface Education {
  degree: string;
  field: string;
  institution: string;
}

interface RawSkill {
  id?: string;
  title: string;
  description: string;
  progress?: number;
  tasks?: RawTask[];
  test?: RawTest;
}

interface RawTask {
  id?: string;
  title: string;
  completed?: boolean;
}

interface RawTest {
  id?: string;
  title: string;
  description: string;
  completed?: boolean;
  score?: number;
  questions?: RawQuestion[];
}

interface RawQuestion {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
}

@Injectable()
export class RoadmapAiService {
  private readonly logger = new Logger(RoadmapAiService.name);
  private readonly openaiApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  /**
   * Generate a learning roadmap based on CV and job details
   */
  async generateRoadmap(
    cvData: any,
    jobDetails: any,
  ): Promise<{
    title: string;
    description: string;
    skills: RoadmapSkill[];
  }> {
    try {
      const prompt = this.buildRoadmapPrompt(cvData, jobDetails);
      const response = await this.callOpenAI(prompt);
      return this.parseRoadmapResponse(response);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error generating roadmap: ${errorMessage}`,
        errorStack,
      );
      throw new Error(`Failed to generate roadmap: ${errorMessage}`);
    }
  }

  /**
   * Build the prompt for the AI to generate a roadmap
   */
  private buildRoadmapPrompt(cvData: any, jobDetails: any): string {
    const jobTitle = jobDetails?.title || 'Unknown Position';
    const jobDescription = jobDetails?.description || '';
    const jobRequirements = jobDetails?.requirements || '';

    // Extract relevant CV information
    const skills = cvData?.skills || [];
    const experience = cvData?.experience || [];
    const education = cvData?.education || [];

    return `
Generate a personalized learning roadmap to help a candidate transition into this job role.

**Job Information:**
- Position: ${jobTitle}
- Description: ${jobDescription}
- Requirements: ${jobRequirements}

**Candidate Background:**
- Skills: ${skills.join(', ')}
- Experience: ${experience.map((exp: Experience) => `${exp.role} at ${exp.company}`).join(', ')}
- Education: ${education.map((edu: Education) => `${edu.degree} in ${edu.field} from ${edu.institution}`).join(', ')}

**Instructions:**
Create a detailed learning roadmap with 3-5 key skill areas to develop. For each skill area:
1. Provide a clear title and description
2. Include 3-5 specific learning tasks
3. Create a mini-assessment with 3 questions to test knowledge

Return ONLY a JSON object with this exact structure:
{
  "title": "Learning Roadmap for [Job Title]",
  "description": "A personalized learning path to help you transition into the [Job Title] role",
  "skills": [
    {
      "id": "unique-id-1",
      "title": "Skill Area Title",
      "description": "Description of this skill area and why it's important",
      "progress": 0,
      "tasks": [
        {
          "id": "task-id-1",
          "title": "Specific learning task description",
          "completed": false
        }
        // More tasks...
      ],
      "test": {
        "id": "test-id-1",
        "title": "Assessment Title",
        "description": "Brief description of what this test assesses",
        "completed": false,
        "questions": [
          {
            "id": "q1",
            "question": "Question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0 // Index of correct option (0-based)
          }
          // More questions...
        ]
      }
    }
    // More skill areas...
  ]
}
`;
  }

  /**
   * Call the OpenAI API with the prompt
   */
  private async callOpenAI(prompt: string): Promise<any> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const axiosError = error as {
        response?: { data?: { error?: { message: string } } };
      };
      const apiErrorMessage =
        axiosError.response?.data?.error?.message || errorMessage;

      this.logger.error(`OpenAI API call failed: ${errorMessage}`, errorStack);
      throw new Error(`OpenAI API call failed: ${apiErrorMessage}`);
    }
  }

  /**
   * Parse the AI response and extract the roadmap
   */
  private parseRoadmapResponse(apiResponse: any): {
    title: string;
    description: string;
    skills: RoadmapSkill[];
  } {
    try {
      // Extract content from API response
      const content = apiResponse?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in API response');
      }

      // Find JSON block in the response
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No JSON found in API response');
      }

      const jsonContent = content.substring(jsonStart, jsonEnd);
      const roadmapData = JSON.parse(jsonContent);

      // Validate the required fields
      if (
        !roadmapData.title ||
        !roadmapData.description ||
        !Array.isArray(roadmapData.skills)
      ) {
        throw new Error('Invalid roadmap data structure');
      }

      // Ensure all skills have unique IDs and all required fields
      const processedSkills = roadmapData.skills.map((skill: RawSkill) => {
        // Ensure skill has an ID
        if (!skill.id) {
          skill.id = uuidv4();
        }

        // Ensure tasks have IDs
        if (Array.isArray(skill.tasks)) {
          skill.tasks = skill.tasks.map((task: RawTask) => ({
            ...task,
            id: task.id || uuidv4(),
            completed: false,
          }));
        } else {
          skill.tasks = [];
        }

        // Ensure test has ID and questions have IDs
        if (skill.test) {
          skill.test.id = skill.test.id || uuidv4();
          skill.test.completed = false;

          if (Array.isArray(skill.test.questions)) {
            skill.test.questions = skill.test.questions.map(
              (question: RawQuestion) => ({
                ...question,
                id: question.id || uuidv4(),
              }),
            );
          } else {
            skill.test.questions = [];
          }
        }

        return {
          ...skill,
          progress: 0,
        };
      });

      return {
        title: roadmapData.title,
        description: roadmapData.description,
        skills: processedSkills,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to parse roadmap response: ${errorMessage}`,
        errorStack,
      );
      throw new Error(`Failed to parse roadmap response: ${errorMessage}`);
    }
  }
}
