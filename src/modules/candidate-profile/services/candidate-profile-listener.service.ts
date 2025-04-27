import { Injectable, OnModuleInit } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { CandidateProfileRepository } from '@/modules/candidate-profile/repositories/candidate-profile.repository';
import { User } from '@/modules/user/entities/user.entity';
import { AppEvents } from '@/shared/events/event.constants';
import { EventEmitterService } from '@/shared/events/event-emitter.service';
import { AppLogger } from '@/shared/logger/logger.service';

@Injectable()
export class CandidateProfileListenerService implements OnModuleInit {
  constructor(
    private readonly candidateProfileRepository: CandidateProfileRepository,
    private readonly eventEmitter: EventEmitterService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CandidateProfileListenerService.name);
  }

  onModuleInit() {
    // Subscribe to user registered event
    this.eventEmitter
      .listen(AppEvents.USER_REGISTERED)
      .subscribe((user) => this.handleUserRegistered(user));
  }

  /**
   * Creates a candidate profile when a user registers
   */
  private async handleUserRegistered(userData: any) {
    try {
      const logCtx = {
        requestID: 'internal',
        url: 'internal',
        ip: '0.0.0.0',
        user: null,
      };
      this.logger.log(
        logCtx,
        `Creating candidate profile for new user: ${userData.id}`,
      );

      // Check if profile already exists
      const existingProfile =
        await this.candidateProfileRepository.findByUserId(userData.id);

      if (existingProfile) {
        this.logger.log(
          logCtx,
          `Candidate profile already exists for user ${userData.id}`,
        );
        return;
      }

      // Create an empty profile for the user with nullable fields
      const candidateProfile = new CandidateProfile();
      candidateProfile.user = plainToClass(User, { id: userData.id });

      const savedProfile =
        await this.candidateProfileRepository.save(candidateProfile);

      this.logger.log(
        logCtx,
        `Successfully created candidate profile with ID ${savedProfile.id} for user ${userData.id}`,
      );

      // Emit event that profile was created
      this.eventEmitter.emit(AppEvents.CANDIDATE_PROFILE_CREATED, savedProfile);
    } catch (error: any) {
      this.logger.error(
        { requestID: 'internal', url: 'internal', ip: '0.0.0.0', user: null },
        `Failed to create candidate profile: ${error.message}`,
        error.stack,
      );
    }
  }
}
