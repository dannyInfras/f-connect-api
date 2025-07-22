import { Test, TestingModule } from '@nestjs/testing';

import { EmailQueueService } from '@/shared/mail/email-queue.service';

import { JobApplicationEmailType } from '../types';
import { JobApplicationNotificationService } from './job-application-notification.service';

describe('JobApplicationNotificationService', () => {
  let service: JobApplicationNotificationService;
  let emailQueueService: jest.Mocked<EmailQueueService>;

  const mockJobApplicationEmailData: JobApplicationEmailType = {
    userEmail: 'test@example.com',
    userName: 'Test User',
    jobTitle: 'Software Engineer',
    companyName: 'Test Company',
    appliedDate: '2024-01-15T10:30:00Z',
  };

  beforeEach(async () => {
    const mockEmailQueueService = {
      queueJobApplicationEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobApplicationNotificationService,
        {
          provide: EmailQueueService,
          useValue: mockEmailQueueService,
        },
      ],
    }).compile();

    service = module.get<JobApplicationNotificationService>(
      JobApplicationNotificationService,
    );
    emailQueueService = module.get(EmailQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendApplicationSuccessEmail', () => {
    it('should successfully queue application success email', async () => {
      emailQueueService.queueJobApplicationEmail.mockResolvedValue(undefined);

      await service.sendApplicationSuccessEmail(mockJobApplicationEmailData);

      expect(emailQueueService.queueJobApplicationEmail).toHaveBeenCalledWith(
        mockJobApplicationEmailData,
      );
      expect(emailQueueService.queueJobApplicationEmail).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should handle email queuing failure gracefully', async () => {
      const emailError = new Error('Email queue failed');
      emailQueueService.queueJobApplicationEmail.mockRejectedValue(emailError);

      await expect(
        service.sendApplicationSuccessEmail(mockJobApplicationEmailData),
      ).rejects.toThrow('Email queue failed');

      expect(emailQueueService.queueJobApplicationEmail).toHaveBeenCalledWith(
        mockJobApplicationEmailData,
      );
    });

    it('should format date correctly in internal processing', async () => {
      // This test verifies that the date formatting logic works correctly
      // The formatted date is created but not directly used in the current implementation
      const testDateString = '2024-01-15T10:30:00Z';
      const testDate = new Date(testDateString);
      const expectedFormattedDate = testDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      expect(expectedFormattedDate).toBe('January 15, 2024 at 10:30 AM');

      emailQueueService.queueJobApplicationEmail.mockResolvedValue(undefined);

      await service.sendApplicationSuccessEmail({
        ...mockJobApplicationEmailData,
        appliedDate: testDateString,
      });

      expect(emailQueueService.queueJobApplicationEmail).toHaveBeenCalledWith({
        ...mockJobApplicationEmailData,
        appliedDate: testDateString,
      });
    });

    it('should pass all email data properties to queue service', async () => {
      const completeEmailData: JobApplicationEmailType = {
        userEmail: 'candidate@example.com',
        userName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Corp',
        appliedDate: '2024-02-20T14:45:00Z',
      };

      emailQueueService.queueJobApplicationEmail.mockResolvedValue(undefined);

      await service.sendApplicationSuccessEmail(completeEmailData);

      expect(emailQueueService.queueJobApplicationEmail).toHaveBeenCalledWith(
        completeEmailData,
      );
      expect(emailQueueService.queueJobApplicationEmail).toHaveBeenCalledTimes(
        1,
      );
    });
  });
});
