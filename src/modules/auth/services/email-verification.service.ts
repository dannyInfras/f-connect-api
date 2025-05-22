import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { EmailVerificationToken } from '@/modules/auth/entities/email-verification-token.entity';
import { User } from '@/modules/user/entities/user.entity';
import { EmailQueueService } from '@/shared/mail/email-queue.service';

const TOKEN_EXPIRATION_HOURS = 24;
const RESEND_LIMIT_PER_HOUR = 3;

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(EmailVerificationToken)
    private readonly tokenRepo: Repository<EmailVerificationToken>,
    private readonly emailQueue: EmailQueueService,
  ) {}

  /**
   * createAndSendToken invalidates any existing unused tokens for the user and
   * dispatches a fresh verification email through the queue.
   */
  async createAndSendToken(user: { id: number; email: string }): Promise<void> {
    await this.invalidateOutstandingTokens(user.id);

    const token = uuidv4();
    const expiresAt = new Date(
      Date.now() + TOKEN_EXPIRATION_HOURS * 3600 * 1000,
    );

    const entity = this.tokenRepo.create({
      user: { id: user.id } as User,
      userId: user.id,
      token,
      expiresAt,
    });
    await this.tokenRepo.save(entity);

    await this.emailQueue.queueVerificationEmail(user.email, token);
  }

  /**
   * check if user can request resend (<= 3 tokens within last hour).
   */
  async canResend(userId: number): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const count = await this.tokenRepo.count({
      where: { user: { id: userId }, createdAt: MoreThan(oneHourAgo) },
    } as any);

    return count < RESEND_LIMIT_PER_HOUR;
  }

  /**
   * Verifies the token and activates the user if valid.
   */
  async verifyToken(token: string): Promise<User> {
    const now = new Date();
    const entity = await this.tokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!entity) {
      throw new BadRequestException('Invalid verification token');
    }

    if (entity.used) {
      throw new BadRequestException('Verification link has already been used');
    }

    if (entity.expiresAt < now) {
      throw new BadRequestException('Verification link has expired');
    }

    entity.used = true;
    await this.tokenRepo.save(entity);

    return entity.user;
  }

  private async invalidateOutstandingTokens(userId: number): Promise<void> {
    await this.tokenRepo
      .createQueryBuilder()
      .update(EmailVerificationToken)
      .set({ used: true })
      .where('"user_id" = :userId', { userId })
      .andWhere('used = :used', { used: false })
      .execute();
  }
}
