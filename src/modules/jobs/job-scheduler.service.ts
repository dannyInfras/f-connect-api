import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppLogger } from '@/shared/logger/logger.service';
import { MailService } from '@/shared/mail/mail.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { Job } from './entities/jobs.entity';

@Injectable()
export class JobSchedulerService {
  private readonly logger = new Logger(JobSchedulerService.name);
  private readonly requestContext = new RequestContext();

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly mailService: MailService,
    private readonly appLogger: AppLogger,
  ) {
    this.appLogger.setContext(JobSchedulerService.name);
    this.requestContext.requestID = 'system';
    this.requestContext.url = 'job-scheduler';
    this.requestContext.user = null;
  }

  /**
   * Runs every day at midnight to check for expired VIP jobs
   * and update their priority position
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredVipJobs() {
    try {
      this.logger.log('Running check for expired VIP jobs');

      // Find jobs that have expired but still have priority position not set to 3
      const expiredJobs = await this.jobRepository
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.company', 'company')
        .where('job.vip_expired < NOW()')
        .andWhere('job.priority_position != 3')
        .getMany();

      this.logger.log(`Found ${expiredJobs.length} expired VIP jobs`);
      
      if (expiredJobs.length > 0) {
        // Update the priority position in the database
        await this.jobRepository.query('SELECT daily_check_expired_vip_jobs()');
        this.logger.log('Updated priority positions for expired VIP jobs');

        // Send email notifications
        await this.sendExpiredJobNotifications(expiredJobs);
      }
    } catch (error) {
      this.appLogger.error(
        this.requestContext,
        'Failed to check for expired VIP jobs',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Runs every day at midnight to check for jobs that will expire soon
   * and send notification emails
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkSoonToExpireVipJobs() {
    try {
      this.logger.log('Running check for soon-to-expire VIP jobs');

      // Find jobs that will expire in the next 2 days
      const soonToExpireJobs = await this.jobRepository
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.company', 'company')
        .where('job.vip_expired > NOW()')
        .andWhere('job.vip_expired < NOW() + interval \'2 day\'')
        .andWhere('job.priority_position != 3')
        .getMany();

      this.logger.log(`Found ${soonToExpireJobs.length} jobs with VIP expiring within 2 days`);
      
      if (soonToExpireJobs.length > 0) {
        // Send warning emails
        await this.sendExpiringWarningNotifications(soonToExpireJobs);
      }
    } catch (error) {
      this.appLogger.error(
        this.requestContext,
        'Failed to check for soon-to-expire VIP jobs',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Send notifications for expired VIP jobs
   */
  private async sendExpiredJobNotifications(expiredJobs: Job[]) {
    for (const job of expiredJobs) {
      try {
        if (!job.company) {
          this.logger.warn(`No company found for job ${job.id}`);
          continue;
        }

        if (!job.company.email) {
          this.logger.warn(`No email found for company ID: ${job.company.id}, job ID: ${job.id}`);
          continue;
        }

        await this.mailService.sendVipExpiredEmail({
          to: job.company.email,
          companyName: job.company.companyName || 'Valued Customer',
          jobTitle: job.title,
          jobId: job.id,
        });
        
        this.logger.log(`Sent VIP expiration email for job "${job.title}" (ID: ${job.id}) to ${job.company.email}`);
      } catch (error) {
        this.appLogger.error(
          this.requestContext,
          `Failed to send VIP expiration email for job ${job.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  /**
   * Send warning notifications for soon-to-expire VIP jobs
   */
  private async sendExpiringWarningNotifications(soonToExpireJobs: Job[]) {
    for (const job of soonToExpireJobs) {
      try {
        if (!job.company) {
          this.logger.warn(`No company found for job ${job.id}`);
          continue;
        }

        if (!job.company.email) {
          this.logger.warn(`No email found for company ID: ${job.company.id}, job ID: ${job.id}`);
          continue;
        }

        await this.mailService.sendVipExpiringWarningEmail({
          to: job.company.email,
          companyName: job.company.companyName || 'Valued Customer',
          jobTitle: job.title,
          jobId: job.id,
          expiryDate: job.vipExpired,
        });
        
        this.logger.log(`Sent VIP expiring warning for job "${job.title}" (ID: ${job.id}) to ${job.company.email}`);
      } catch (error) {
        this.appLogger.error(
          this.requestContext,
          `Failed to send VIP expiring warning for job ${job.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  /**
   * Test method to simulate a job expiring by temporarily modifying its expiration date
   * @param jobId The ID of the job to test
   */
  async testJobExpiration(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find the job
      const job = await this.jobRepository.findOne({
        where: { id: jobId },
        relations: ['company'],
      });

      if (!job) {
        return { success: false, message: `Job with ID ${jobId} not found` };
      }

      // Check if company and email exist
      if (!job.company) {
        return { success: false, message: `Job ${jobId} has no associated company` };
      }

      if (!job.company.email) {
        return { 
          success: false, 
          message: `Company (ID: ${job.company.id}) for job ${jobId} has no email address` 
        };
      }

      // Save the original expiration date
      const originalExpiryDate = job.vipExpired;
      
      // Temporarily set the expiration date to now (expired)
      job.vipExpired = new Date();
      await this.jobRepository.save(job);
      
      // Process the expired job
      await this.checkExpiredVipJobs();
      
      // Restore the original expiration date
      job.vipExpired = originalExpiryDate;
      await this.jobRepository.save(job);
      
      return { 
        success: true, 
        message: `Successfully tested VIP expiration for job "${job.title}" (ID: ${jobId}). Original expiry date has been restored.` 
      };
    } catch (error) {
      this.appLogger.error(
        this.requestContext,
        `Failed to test job expiration for job ${jobId}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { 
        success: false, 
        message: `Error testing VIP expiration: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Test method to simulate a job about to expire by temporarily modifying its expiration date
   * @param jobId The ID of the job to test
   */
  async testJobExpirationWarning(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find the job
      const job = await this.jobRepository.findOne({
        where: { id: jobId },
        relations: ['company'],
      });

      if (!job) {
        return { success: false, message: `Job with ID ${jobId} not found` };
      }

      // Check if company and email exist
      if (!job.company) {
        return { success: false, message: `Job ${jobId} has no associated company` };
      }

      if (!job.company.email) {
        return { 
          success: false, 
          message: `Company (ID: ${job.company.id}) for job ${jobId} has no email address` 
        };
      }

      // Save the original expiration date
      const originalExpiryDate = job.vipExpired;
      
      // Temporarily set the expiration date to 12 hours from now (about to expire)
      const warningDate = new Date();
      warningDate.setHours(warningDate.getHours() + 12);
      job.vipExpired = warningDate;
      await this.jobRepository.save(job);
      
      // Process the soon-to-expire job
      await this.checkSoonToExpireVipJobs();
      
      // Restore the original expiration date
      job.vipExpired = originalExpiryDate;
      await this.jobRepository.save(job);
      
      return { 
        success: true, 
        message: `Successfully tested VIP expiration warning for job "${job.title}" (ID: ${jobId}). Original expiry date has been restored.` 
      };
    } catch (error) {
      this.appLogger.error(
        this.requestContext,
        `Failed to test job expiration warning for job ${jobId}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { 
        success: false, 
        message: `Error testing VIP expiration warning: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
} 
