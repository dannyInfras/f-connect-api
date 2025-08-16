import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { Roadmap } from '../../roadmap/entities/roadmap.entity';
import { RoadmapRepository } from '../../roadmap/repositories/roadmap.repository';
import { UserService } from '../../user/services/user.service';
import { QuizAnswer, QuizQuestion } from '../entities/quiz.entity';
import { QuizAttempt, QuizFeedback } from '../entities/quiz-attempt.entity';
import { QuizService } from './quiz.service';

@Injectable()
export class QuizAiService {
  private readonly openaiApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly quizService: QuizService,
    private readonly roadmapRepository: RoadmapRepository,
    private readonly userService: UserService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  /**
   * Generate new quiz or return existing quiz
   */
  async generateOrGetQuiz(
    roadmapId: string,
    userId: number,
    forceNew: boolean = false,
    title?: string,
    description?: string,
  ): Promise<any> {
    // Get roadmap
    const roadmap = await this.roadmapRepository.findOne({
      where: { id: roadmapId },
    });

    if (!roadmap) {
      throw new BadRequestException('Roadmap not found');
    }

    // Check ownership
    if (roadmap.userId !== userId) {
      throw new BadRequestException(
        'You can only create quiz for your own roadmap',
      );
    }

    // Check for existing quiz if not forcing new
    if (!forceNew) {
      const existingQuiz = await this.quizService.findByRoadmapAndUser(
        roadmapId,
        userId,
      );

      if (existingQuiz) {
        // Shuffle questions for retry
        const shuffledQuestions = this.shuffleQuestions(existingQuiz.questions);
        return {
          ...existingQuiz,
          questions: shuffledQuestions,
          isRetry: true,
        };
      }
    }

    // Archive old quiz if forcing new
    if (forceNew) {
      await this.quizService.archiveExisting(roadmapId, userId);
    }

    // Generate new questions
    console.log(
      '🤖 Generating NEW AI quiz questions for roadmap:',
      roadmap.title,
    );
    const questions = await this.generateQuestions(roadmap);

    // Create new quiz
    const quiz = await this.quizService.create({
      roadmapId,
      userId,
      title: title || `Practice Test: ${roadmap.title}`,
      description: description || `AI-generated test for ${roadmap.title}`,
      questions,
      totalQuestions: questions.length,
      passingScore: 80,
      timeLimit: 60,
      status: 'published',
      metadata: {
        generatedAt: new Date(),
        model: this.openaiApiKey ? 'gpt-4' : 'fallback',
        roadmapTitle: roadmap.title,
        skillsCount: roadmap.skills.length,
      },
    });

    console.log(
      '✅ New quiz created successfully with',
      questions.length,
      'questions',
    );
    return quiz;
  }

  /**
   * Shuffle questions and answers for retry
   */
  private shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
    // Shuffle questions order
    const shuffled = [...questions].sort(() => Math.random() - 0.5);

    // Shuffle answers within each question (except true-false)
    return shuffled.map((q, index) => ({
      ...q,
      order: index + 1,
      answers:
        q.type === 'true-false'
          ? q.answers
          : [...q.answers].sort(() => Math.random() - 0.5),
    }));
  }

  /**
   * Generate AI feedback for quiz attempt
   */
  async generateAIFeedback(
    attempt: QuizAttempt,
    quiz: any,
    roadmap: Roadmap,
  ): Promise<QuizFeedback> {
    // If perfect score, return simple feedback
    if (attempt.percentage >= 100) {
      return {
        strengths: [
          'Perfect score! Excellent mastery of all topics',
          'Outstanding understanding of concepts',
          'Ready to apply knowledge in real projects',
        ],
        weaknesses: [],
        recommendations: [
          'Continue practicing to maintain your knowledge',
          'Consider mentoring others on these topics',
        ],
        topicScores: this.calculateTopicScores(attempt, quiz),
      };
    }

    // Generate AI feedback for non-perfect scores
    if (this.openaiApiKey) {
      try {
        return await this.generateAIAnalysis(attempt, quiz, roadmap);
      } catch (error) {
        console.error('AI feedback generation failed:', error);
      }
    }

    // Fallback feedback
    return this.generateFallbackFeedback(attempt, quiz);
  }

  /**
   * Generate AI analysis and feedback
   */
  private async generateAIAnalysis(
    attempt: QuizAttempt,
    quiz: any,
    roadmap: Roadmap,
  ): Promise<QuizFeedback> {
    const topicScores = this.calculateTopicScores(attempt, quiz);

    const prompt = `
    Analyze this quiz attempt and provide personalized feedback:
    
    Quiz: ${quiz.title}
    Score: ${attempt.percentage}%
    Pass Score: ${quiz.passingScore}%
    Time Taken: ${attempt.timeSpent} seconds
    
    Topic Performance:
    ${Object.entries(topicScores)
      .map(
        ([topic, scores]: [string, any]) =>
          `- ${topic}: ${scores.correct}/${scores.total} (${scores.percentage}%)`,
      )
      .join('\n')}
    
    Incorrectly Answered Questions:
    ${this.getIncorrectQuestions(attempt, quiz)}
    
    Roadmap Skills:
    ${roadmap.skills.map((s) => `- ${s.title}: ${s.description}`).join('\n')}
    
    Provide feedback in JSON format:
    {
      "strengths": ["3-4 specific strengths based on performance"],
      "weaknesses": ["2-3 specific areas needing improvement"],
      "recommendations": ["3-4 actionable study recommendations"]
    }
    
    Make feedback specific, actionable, and encouraging.
    Focus on topics with lowest scores and provide concrete next steps.
    `;

    try {
      const messages = [
        {
          role: 'system',
          content:
            'You are an expert learning coach providing personalized feedback.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const aiResponse = await this.callOpenAI(messages, {
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const feedback = aiResponse;

      return {
        strengths: feedback.strengths || ['Good effort on the quiz'],
        weaknesses: feedback.weaknesses || ['Review materials for improvement'],
        recommendations: feedback.recommendations || [
          'Practice more questions',
        ],
        topicScores,
      };
    } catch (error) {
      console.error('AI feedback error:', error);
      return this.generateFallbackFeedback(attempt, quiz);
    }
  }

  /**
   * Call OpenAI API using axios
   */
  private async callOpenAI(
    messages: Array<{ role: string; content: string }>,
    options: {
      temperature?: number;
      max_tokens?: number;
      response_format?: { type: string };
    } = {},
  ): Promise<any> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo-preview',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 4000,
          ...(options.response_format && {
            response_format: options.response_format,
          }),
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        },
      );

      const content = response.data.choices[0]?.message?.content;

      // Parse JSON if response format is json_object
      if (options.response_format?.type === 'json_object') {
        return JSON.parse(content || '{}');
      }

      return content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('OpenAI API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        // Throw more specific error messages
        if (error.response?.status === 401) {
          throw new Error('Invalid OpenAI API key');
        } else if (error.response?.status === 429) {
          throw new Error('OpenAI API rate limit exceeded');
        } else if (error.response?.status === 500) {
          throw new Error('OpenAI service error');
        }
      }
      throw error;
    }
  }

  /**
   * Calculate topic scores
   */
  private calculateTopicScores(
    attempt: QuizAttempt,
    quiz: any,
  ): Record<string, { correct: number; total: number; percentage: number }> {
    const topicScores: Record<string, { correct: number; total: number }> = {};

    quiz.questions.forEach((question: any) => {
      if (!topicScores[question.topic]) {
        topicScores[question.topic] = { correct: 0, total: 0 };
      }
      topicScores[question.topic].total++;

      const userAnswer = attempt.answers.find(
        (a) => a.questionId === question.id,
      );
      if (userAnswer && userAnswer.isCorrect) {
        topicScores[question.topic].correct++;
      }
    });

    // Add percentages
    Object.keys(topicScores).forEach((topic) => {
      (topicScores[topic] as any).percentage = Math.round(
        (topicScores[topic].correct / topicScores[topic].total) * 100,
      );
    });

    return topicScores as any;
  }

  /**
   * Get incorrect questions summary
   */
  private getIncorrectQuestions(attempt: QuizAttempt, quiz: any): string {
    const incorrect = quiz.questions
      .filter((q: any) => {
        const answer = attempt.answers.find((a) => a.questionId === q.id);
        return !answer || !answer.isCorrect;
      })
      .slice(0, 5)
      .map((q: any) => `- ${q.topic}: ${q.question.substring(0, 50)}...`)
      .join('\n');

    return incorrect || 'None';
  }

  /**
   * Generate fallback feedback
   */
  private generateFallbackFeedback(
    attempt: QuizAttempt,
    quiz: any,
  ): QuizFeedback {
    const topicScores = this.calculateTopicScores(attempt, quiz);
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze topic scores
    Object.entries(topicScores).forEach(([topic, scores]: [string, any]) => {
      if (scores.percentage >= 90) {
        strengths.push(`Excellent understanding of ${topic}`);
      } else if (scores.percentage >= 80) {
        strengths.push(`Good grasp of ${topic} concepts`);
      } else if (scores.percentage < 60) {
        weaknesses.push(`Need improvement in ${topic}`);
        recommendations.push(`Review ${topic} materials and practice more`);
      }
    });

    // Overall performance feedback
    if (attempt.percentage >= 90) {
      strengths.push('Outstanding overall performance');
      recommendations.push('Challenge yourself with advanced topics');
    } else if (attempt.percentage >= 80) {
      strengths.push('Good understanding of core concepts');
      recommendations.push('Focus on weak areas for perfect score');
    } else {
      recommendations.push('Review all materials before retaking');
      recommendations.push('Practice with additional exercises');
    }

    // Time-based feedback
    if (attempt.timeSpent && attempt.timeSpent < quiz.timeLimit * 60 * 0.5) {
      strengths.push('Efficient time management');
    }

    return {
      strengths: strengths.length > 0 ? strengths : ['Keep practicing'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['Room for improvement'],
      recommendations:
        recommendations.length > 0 ? recommendations : ['Continue studying'],
      topicScores,
    };
  }

  /**
   * Generate questions from roadmap
   */
  private async generateQuestions(roadmap: Roadmap): Promise<QuizQuestion[]> {
    try {
      if (!this.openaiApiKey) {
        console.log('Using fallback quiz generation (OpenAI not configured)');
        return this.generateFallbackQuestions(roadmap);
      }

      const hasPoints = await this.userService.checkAiPoints(roadmap.userId);
      if (!hasPoints) {
        throw new BadRequestException(
          'You have reached your AI usage limit. Please upgrade your plan or purchase more points.',
        );
      }

      const prompt = this.buildPrompt(roadmap);
      const messages = [
        {
          role: 'system',
          content: `You are an expert quiz creator for technical skills assessment. 
                   Create comprehensive quiz questions that test understanding and practical knowledge.
                   Always return valid JSON format.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const aiQuestions = await this.callOpenAI(messages, {
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      await this.userService.deductAiPoints(roadmap.userId);

      return this.processAIResponse(aiQuestions, roadmap);
    } catch (error) {
      console.error('AI generation failed, using fallback:', error);
      return this.generateFallbackQuestions(roadmap);
    }
  }

  /**
   * Build prompt for AI
   */
  private buildPrompt(roadmap: Roadmap): string {
    const skillsList = roadmap.skills
      .map((s) => `- ${s.title}: ${s.description}`)
      .join('\n');

    return `
    Create a comprehensive practice test with exactly 50 questions for this learning roadmap:
    
    Title: ${roadmap.title}
    Description: ${roadmap.description}
    
    Skills to test:
    ${skillsList}
    
    Requirements:
    1. Generate exactly 50 questions total
    2. Mix of difficulty: 15 easy (30%), 25 medium (50%), 10 hard (20%)
    3. Question types: 35 single-choice (70%), 10 multiple-choice (20%), 5 true-false (10%)
    4. Each question must have 4 answer options (except true-false which has 2)
    5. Include detailed explanations for correct answers
    6. Questions should test both theoretical knowledge and practical application
    7. Distribute questions evenly across all skills
    8. Make questions relevant to real-world scenarios
    9. Focus on practical knowledge that would be useful in actual work
    
    Return JSON in this exact format:
    {
      "questions": [
        {
          "question": "Clear, specific question text",
          "type": "single-choice|multiple-choice|true-false",
          "difficulty": "easy|medium|hard",
          "topic": "skill name this question relates to",
          "answers": [
            {
              "id": "a",
              "text": "answer text",
              "isCorrect": true/false
            }
          ],
          "explanation": "Detailed explanation why this answer is correct and what concept it tests",
          "points": 1-3 based on difficulty
        }
      ]
    }
    
    Make sure all questions are high quality, practical, and test real understanding.
    `;
  }

  /**
   * Process AI response
   */
  private processAIResponse(aiData: any, roadmap: Roadmap): QuizQuestion[] {
    const questions = aiData.questions || [];

    if (questions.length === 0) {
      console.warn('No questions from AI, using fallback');
      return this.generateFallbackQuestions(roadmap);
    }

    return questions.slice(0, 50).map((q: any, index: number) => ({
      id: uuidv4(),
      question: q.question || `Question ${index + 1}`,
      type: this.validateQuestionType(q.type),
      difficulty: this.validateDifficulty(q.difficulty),
      topic: q.topic || roadmap.skills[0]?.title || 'General',
      answers: this.processAnswers(q.answers || [], q.type),
      explanation:
        q.explanation || 'Review the related materials for more information.',
      points: this.calculatePoints(q.difficulty),
      order: index + 1,
    }));
  }

  /**
   * Generate fallback questions when no AI
   */
  private generateFallbackQuestions(roadmap: Roadmap): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    const templates = this.getQuestionTemplates();

    roadmap.skills.forEach((skill) => {
      const questionsPerSkill = Math.ceil(50 / roadmap.skills.length);

      for (let i = 0; i < questionsPerSkill && questions.length < 50; i++) {
        const template = templates[i % templates.length];
        const difficulty = this.getDifficultyByIndex(questions.length);

        questions.push({
          id: uuidv4(),
          question: template.question
            .replace('{skill}', skill.title)
            .replace('{description}', skill.description),
          type: template.type,
          difficulty,
          topic: skill.title,
          answers: this.generateTemplateAnswers(template.type, skill.title),
          explanation: `This question tests your understanding of ${skill.title}. ${skill.description}`,
          points: this.calculatePoints(difficulty),
          order: questions.length + 1,
        });
      }
    });

    return questions.slice(0, 50);
  }

  /**
   * Question templates for fallback
   */
  private getQuestionTemplates(): any[] {
    return [
      {
        question: 'What is the primary purpose of {skill}?',
        type: 'single-choice',
      },
      {
        question:
          'Which of the following statements about {skill} are correct?',
        type: 'multiple-choice',
      },
      {
        question:
          '{skill} is considered a best practice in modern development.',
        type: 'true-false',
      },
      {
        question:
          'How would you implement {skill} in a production environment?',
        type: 'single-choice',
      },
      {
        question: 'What are the key benefits of using {skill}?',
        type: 'multiple-choice',
      },
      {
        question:
          'Which scenario would be most appropriate for applying {skill}?',
        type: 'single-choice',
      },
      {
        question: 'What are the common pitfalls when working with {skill}?',
        type: 'single-choice',
      },
      {
        question: '{skill} can improve application performance.',
        type: 'true-false',
      },
    ];
  }

  /**
   * Generate template answers
   */
  private generateTemplateAnswers(
    type: string,
    skillName: string,
  ): QuizAnswer[] {
    if (type === 'true-false') {
      return [
        { id: 'a', text: 'True', isCorrect: true },
        { id: 'b', text: 'False', isCorrect: false },
      ];
    }

    const answers = [
      {
        id: 'a',
        text: `Correct implementation of ${skillName}`,
        isCorrect: true,
      },
      {
        id: 'b',
        text: `Common misconception about ${skillName}`,
        isCorrect: false,
      },
      { id: 'c', text: `Outdated approach to ${skillName}`, isCorrect: false },
      {
        id: 'd',
        text: `Alternative but less effective method`,
        isCorrect: type === 'multiple-choice',
      },
    ];

    // Shuffle answers to avoid pattern
    return answers.sort(() => Math.random() - 0.5);
  }

  /**
   * Process answers from AI
   */
  private processAnswers(answers: any[], type: string): QuizAnswer[] {
    if (!answers || answers.length === 0) {
      return this.generateTemplateAnswers(type, 'the topic');
    }

    // Ensure at least 1 correct answer
    const hasCorrect = answers.some((a) => a.isCorrect);
    if (!hasCorrect && answers.length > 0) {
      answers[0].isCorrect = true;
    }

    return answers.map((a: any, index: number) => ({
      id: a.id || String.fromCharCode(97 + index),
      text: a.text || `Option ${String.fromCharCode(65 + index)}`,
      isCorrect: Boolean(a.isCorrect),
    }));
  }

  /**
   * Validate question type
   */
  private validateQuestionType(
    type: string,
  ): 'single-choice' | 'multiple-choice' | 'true-false' {
    const validTypes = ['single-choice', 'multiple-choice', 'true-false'];
    return validTypes.includes(type) ? (type as any) : 'single-choice';
  }

  /**
   * Validate difficulty
   */
  private validateDifficulty(difficulty: string): 'easy' | 'medium' | 'hard' {
    const validDifficulties = ['easy', 'medium', 'hard'];
    return validDifficulties.includes(difficulty)
      ? (difficulty as any)
      : 'medium';
  }

  /**
   * Get difficulty by index
   */
  private getDifficultyByIndex(index: number): 'easy' | 'medium' | 'hard' {
    if (index < 15) return 'easy';
    if (index < 40) return 'medium';
    return 'hard';
  }

  /**
   * Calculate points
   */
  private calculatePoints(difficulty: string): number {
    switch (difficulty) {
      case 'easy':
        return 1;
      case 'hard':
        return 3;
      default:
        return 2;
    }
  }
}
