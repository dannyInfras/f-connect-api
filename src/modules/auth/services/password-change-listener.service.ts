import { Injectable, OnModuleInit } from '@nestjs/common';

import { AppEvents } from '@/shared/events/event.constants';
import { EventEmitterService } from '@/shared/events/event-emitter.service';
import { AppLogger } from '@/shared/logger/logger.service';

interface PasswordChangedEvent {
  userId: number;
}

@Injectable()
export class PasswordChangeListenerService implements OnModuleInit {
  // In-memory store of invalidated users and their invalidation timestamps
  // In a production system with multiple instances, this should be in Redis or similar
  private static invalidatedTokens: Map<number, Date> = new Map();

  constructor(
    private readonly eventEmitter: EventEmitterService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PasswordChangeListenerService.name);
  }

  onModuleInit() {
    // Subscribe to password changed event
    this.eventEmitter
      .listen<PasswordChangedEvent>(AppEvents.PASSWORD_CHANGED)
      .subscribe((data) => this.handlePasswordChanged(data));
  }

  /**
   * Handle password change event by invalidating old sessions
   */
  private async handlePasswordChanged(eventData: PasswordChangedEvent) {
    const logCtx = {
      requestID: 'internal',
      url: 'internal',
      ip: '0.0.0.0',
      user: null,
    };

    try {
      this.logger.log(
        logCtx,
        `Password changed for user ${eventData.userId}, invalidating old sessions`,
      );

      // Store user ID and invalidation timestamp
      PasswordChangeListenerService.invalidatedTokens.set(
        eventData.userId,
        new Date(),
      );

      this.logger.log(
        logCtx,
        `Successfully invalidated sessions for user ${eventData.userId}`,
      );
    } catch (error: any) {
      this.logger.error(
        logCtx,
        `Failed to handle password change for user ${eventData.userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Check if a token for a user should be considered invalidated
   * This is used by the JWT strategy to validate tokens
   *
   * @param userId User ID from the token
   * @param tokenIssuedAt When the token was issued
   * @returns true if token is valid, false if invalidated
   */
  static isTokenValid(userId: number, tokenIssuedAt: Date): boolean {
    const invalidationTime = this.invalidatedTokens.get(userId);

    // If no invalidation record exists, token is valid
    if (!invalidationTime) {
      return true;
    }

    // If token was issued before the invalidation time, it's invalid
    return tokenIssuedAt > invalidationTime;
  }

  /**
   * Clear invalidation record for a user (useful for testing or manual reset)
   */
  static clearInvalidation(userId: number): void {
    this.invalidatedTokens.delete(userId);
  }

  /**
   * Get all invalidated user IDs (useful for debugging)
   */
  static getInvalidatedUsers(): number[] {
    return Array.from(this.invalidatedTokens.keys());
  }
}
