import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppLogger } from '@/shared/logger/logger.service';
import { MailService } from '@/shared/mail/mail.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { Job } from '../entities/jobs.entity';

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
      this.logger.log('Running daily check for expired VIP jobs');

      // First, find jobs that have just expired (vip_expired has passed but priority_position is not 3)
      const expiredJobs = await this.jobRepository
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.company', 'company')
        .leftJoinAndSelect('company.user', 'user')
        .where('job.vip_expired < NOW()')
        .andWhere('job.priority_position != 3')
        .getMany();

      if (expiredJobs.length > 0) {
        this.logger.log(`Found ${expiredJobs.length} expired VIP jobs`);

        // Update the priority position in the database
        await this.jobRepository.query('SELECT daily_check_expired_vip_jobs()');

        // Send email notifications
        for (const job of expiredJobs) {
          try {
            if (job.company && job.company.email) {
              await this.mailService.sendVipExpiredEmail({
                to: job.company.email,
                companyName: job.company.companyName || 'Valued Customer',
                jobTitle: job.title,
                jobId: job.id,
              });
              this.logger.log(
                `Sent VIP expiration email for job ${job.id} to ${job.company.email}`,
              );
            }
          } catch (emailError) {
            this.appLogger.error(
              this.requestContext,
              `Failed to send VIP expiration email for job ${job.id}`,
              emailError instanceof Error ? emailError.stack : undefined,
            );
          }
        }
      } else {
        this.logger.log('No expired VIP jobs found');
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
   * Runs every hour to check for jobs that will expire soon
   * and send notification emails
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkSoonToExpireVipJobs() {
    try {
      // Find jobs that will expire in the next 24 hours
      const soonToExpireJobs = await this.jobRepository
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.company', 'company')
        .leftJoinAndSelect('company.user', 'user')
        .where('job.vip_expired > NOW()')
        .andWhere("job.vip_expired < NOW() + interval '1 day'")
        .andWhere('job.priority_position != 3')
        .getMany();

      if (soonToExpireJobs.length > 0) {
        this.logger.log(
          `Found ${soonToExpireJobs.length} jobs with VIP expiring soon`,
        );

        // Send warning emails
        for (const job of soonToExpireJobs) {
          try {
            if (job.company && job.company.email) {
              await this.mailService.sendVipExpiringWarningEmail({
                to: job.company.email,
                companyName: job.company.companyName || 'Valued Customer',
                jobTitle: job.title,
                jobId: job.id,
                expiryDate: job.vipExpired,
              });
              this.logger.log(
                `Sent VIP expiring soon warning for job ${job.id} to ${job.company.email}`,
              );
            }
          } catch (emailError) {
            this.appLogger.error(
              this.requestContext,
              `Failed to send VIP expiring soon warning for job ${job.id}`,
              emailError instanceof Error ? emailError.stack : undefined,
            );
          }
        }
      }
    } catch (error) {
      this.appLogger.error(
        this.requestContext,
        'Failed to check for soon-to-expire VIP jobs',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
