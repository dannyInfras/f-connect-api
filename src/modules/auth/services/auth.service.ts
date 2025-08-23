import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

import { RegisterCompanyInput } from '@/modules/auth/dtos/auth-register-company-input.dto';
import { RegisterInput } from '@/modules/auth/dtos/auth-register-input.dto';
import { RegisterOutput } from '@/modules/auth/dtos/auth-register-output.dto';
import {
  AuthTokenOutput,
  UserAccessTokenClaims,
} from '@/modules/auth/dtos/auth-token-output.dto';
import { PasswordResetToken } from '@/modules/auth/entities/password-reset-token.entity';
import { EmailVerificationService } from '@/modules/auth/services/email-verification.service';
import { CompanyService } from '@/modules/company/services/company.service';
import { UserOutput } from '@/modules/user/dtos/user-output.dto';
import { User } from '@/modules/user/entities/user.entity';
import { UserService } from '@/modules/user/services/user.service';
import { AppEvents } from '@/shared/events/event.constants';
import { EventEmitterService } from '@/shared/events/event-emitter.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { MailService } from '@/shared/mail/mail.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';
import { UnitOfWork } from '@/shared/unit-of-work/unit-of-work.service';

import { TaxCodeReportDto } from '../dtos/auth-report-taxcode-input.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly companyService: CompanyService,
    private readonly httpService: HttpService, // Inject HttpService
    private readonly logger: AppLogger,
    private readonly mailService: MailService, // Use shared MailService
    private readonly eventEmitter: EventEmitterService,
    private readonly unitOfWork: UnitOfWork,
    private readonly emailVerificationService: EmailVerificationService,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async validateUser(
    ctx: RequestContext,
    email: string,
    pass: string,
  ): Promise<UserAccessTokenClaims> {
    this.logger.log(ctx, `${this.validateUser.name} was called`);

    // The userService will throw Unauthorized in case of invalid email/password.
    const user = await this.userService.validateEmailPassword(ctx, email, pass);

    // Prevent disabled users from logging in.
    if (user.isAccountDisabled) {
      throw new UnauthorizedException('This user account has been disabled');
    }

    return user;
  }

  login(ctx: RequestContext): AuthTokenOutput {
    this.logger.log(ctx, `${this.login.name} was called`);

    return this.getAuthToken(ctx, ctx.user!);
  }

  async register(
    ctx: RequestContext,
    input: RegisterInput,
  ): Promise<RegisterOutput> {
    this.logger.log(ctx, `${this.register.name} was called`);

    // Newly registered users are disabled until they verify their email.
    input.isAccountDisabled = true;

    const registeredUser = await this.userService.createUser(ctx, input);

    // Queue verification email
    await this.emailVerificationService.createAndSendToken({
      id: registeredUser.id,
      email: registeredUser.email,
    });

    return plainToClass(RegisterOutput, registeredUser, {
      excludeExtraneousValues: true,
    });
  }

  async refreshToken(ctx: RequestContext): Promise<AuthTokenOutput> {
    this.logger.log(ctx, `${this.refreshToken.name} was called`);

    const user = await this.userService.findById(ctx, ctx.user!.id);
    if (!user) {
      throw new UnauthorizedException('Invalid user id');
    }

    return this.getAuthToken(ctx, user);
  }

  getAuthToken(
    ctx: RequestContext,
    user: UserAccessTokenClaims | UserOutput,
  ): AuthTokenOutput {
    this.logger.log(ctx, `${this.getAuthToken.name} was called`);

    const subject = { sub: user.id };
    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles,
      companyId: user.companyId || null,
    };

    const authToken = {
      refreshToken: this.jwtService.sign(subject, {
        expiresIn: this.configService.get('jwt.refreshTokenExpiresInSec'),
      }),
      accessToken: this.jwtService.sign(
        { ...payload, ...subject },
        { expiresIn: this.configService.get('jwt.accessTokenExpiresInSec') },
      ),
    };
    return plainToClass(AuthTokenOutput, authToken, {
      excludeExtraneousValues: true,
    });
  }

  async registerCompany(
    ctx: RequestContext,
    input: RegisterCompanyInput,
  ): Promise<{ message: string }> {
    const { taxCode, business_license_url, ...userInput } = input;

    // Step 1: Check if the company already exists
    const existingCompany = await this.companyService.findByTaxCode(taxCode);

    if (existingCompany) {
      // If the company has not been verified and it has been more than 24 hours -> delete it immediately
      if (!existingCompany.isVerified) {
        const hoursSinceCreated =
          (Date.now() - existingCompany.createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceCreated > 24) {
          // Delete the old company and related users
          const users = await this.userService.findUserByCompanyId(
            existingCompany.id,
          );
          await this.userService.deleteUser(users[0].id);
          await this.companyService.delete(existingCompany.id);
          // Continue with the new registration
        } else {
          // The company was created within 24 hours -> report an error
          throw new BadRequestException(
            'A company with this tax code is pending verification. Please try again later or contact support.',
          );
        }
      } else {
        // The company has been verified -> report an error
        throw new BadRequestException(
          'A company with this tax code already exists.',
        );
      }
    }

    // Step 2: Fetch data from external API
    let externalCompanyData;
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.vietqr.io/v2/business/${taxCode}`),
      );
      externalCompanyData = response.data.data;
      if (!externalCompanyData) {
        throw new BadRequestException('Invalid tax code or company not found.');
      }
    } catch (error) {
      this.logger.error(
        ctx,
        `Failed to fetch company data for taxCode: ${taxCode}, error: ${error}`,
      );
      throw new BadRequestException(
        'Unable to verify company via external API.',
      );
    }

    // Step 3: Create company + user in one transaction
    const { company, registeredUser } = await this.unitOfWork.doTransactional(
      async (manager) => {
        const company = await this.companyService.create(
          {
            companyName: externalCompanyData.name || 'Unknown',
            taxCode,
            email: userInput.email,
            address: externalCompanyData.address
              ? [externalCompanyData.address]
              : [],
            industry: externalCompanyData.industry || 'Unknown',
            businessLicenseUrl: business_license_url,
            isVerified: false,
          },
          manager,
        );

        const registeredUser = await this.userService.createUser(
          ctx,
          {
            ...userInput,
            companyId: Number(company.id),
          },
          manager,
        );

        return { company, registeredUser };
      },
    );

    // Step 4: Send email (outside transaction)
    const verificationCode = this.jwtService.sign(
      { userId: registeredUser.id },
      { expiresIn: '1d' },
    );

    await this.mailService.sendMail(
      userInput.email,
      'Verify Your Company Registration',
      './verify-company',
      {
        companyName: company.companyName,
        verificationLink: `${process.env.BACKEND_URL}/api/v1/auth/verify-company?code=${verificationCode}`,
      },
    );

    return {
      message: 'Company registered successfully. Please verify your email.',
    };
  }

  async verifyCompany(
    ctx: RequestContext,
    code: string,
  ): Promise<{ message: string }> {
    let payload: { userId: string };

    try {
      // Decode and verify JWT token
      payload = this.jwtService.verify(code);
    } catch (error) {
      throw new BadRequestException(
        'Invalid or expired verification code, error: ' + error,
      );
    }

    // Find the user
    const user = await this.userService.findById(ctx, Number(payload.userId));
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const company = await this.companyService.findOne(
      String(user.companyId),
      null,
    );
    if (!company) {
      throw new NotFoundException('Company not found.');
    }
    await this.companyService.update(company.id, {
      isVerified: true,
    });

    // Check if already active
    if (!user.isAccountDisabled) {
      return { message: 'User already verified.' };
    }

    await this.userService.verifyUser(ctx, user.id, true);

    return { message: 'Email verified successfully!' };
  }

  /**
   * Activate user account using the verification token.
   */
  async verifyEmail(
    ctx: RequestContext,
    token: string,
  ): Promise<{ message: string; success: boolean }> {
    const userEntity = await this.emailVerificationService.verifyToken(token);

    if (!userEntity.isAccountDisabled) {
      return { message: 'User already verified.', success: false };
    }

    await this.userService.verifyUser(ctx, userEntity.id, false);

    // Emit email verified event
    this.eventEmitter.emit(AppEvents.EMAIL_VERIFIED, userEntity);

    return {
      message: 'Email verified successfully!',
      success: true,
    };
  }

  /**
   * Resend verification link to given email address, limited to 3 per hour.
   */
  async resendVerificationEmail(
    ctx: RequestContext,
    email: string,
  ): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(ctx, email);

    if (!user.isAccountDisabled) {
      throw new BadRequestException('Account is already verified');
    }

    const canResend = await this.emailVerificationService.canResend(user.id);
    if (!canResend) {
      throw new BadRequestException(
        'Resend limit exceeded. Please try again later.',
      );
    }

    await this.emailVerificationService.createAndSendToken({
      id: user.id,
      email: user.email,
    });

    return { message: 'Verification email sent.' };
  }

  async handleTaxCodeReport(
    reportData: TaxCodeReportDto,
  ): Promise<{ message: string }> {
    // Gửi email cho admin
    await this.mailService.sendMail(
      process.env.MAIL_USER || 'admin@company.com',
      'Tax Code Duplication Report',
      './admin-tax-code-report',
      {
        taxCode: reportData.taxCode,
        companyName: reportData.companyName,
        userEmail: reportData.userEmail,
        contactPhone: reportData.contactPhone,
        additionalInfo: reportData.additionalInfo,
        reportedAt: reportData.timestamp,
      },
    );

    // Lưu report vào database (optional)
    // await this.reportRepository.save({
    //   type: reportData.reportType,
    //   data: reportData,
    //   status: 'PENDING',
    //   createdAt: new Date(),
    // });

    return {
      message: 'Report sent successfully. Admin will review within 24 hours.',
    };
  }

  /**
   * Send password reset email if user exists
   * Always returns same message to prevent user enumeration
   */
  async forgotPassword(
    ctx: RequestContext,
    email: string,
  ): Promise<{ message: string }> {
    this.logger.log(ctx, `${this.forgotPassword.name} was called`);

    try {
      // Try to find user by email - need to get raw user entity to check provider
      const userEntity = await this.userService.findByEmail(ctx, email);

      if (userEntity) {
        // Check if this is a local account (not OAuth) by accessing the raw repository
        const userRepository =
          this.passwordResetTokenRepository.manager.getRepository(User);
        const fullUser = await userRepository.findOne({
          where: { id: userEntity.id },
        });

        // Only send email if user has a password set (not OAuth)
        if (fullUser && fullUser.provider === 'local') {
          // Invalidate any existing tokens for this user
          await this.passwordResetTokenRepository.update(
            { user: { id: userEntity.id }, isUsed: false },
            { isUsed: true },
          );

          // Generate secure reset token (expires in 1 hour)
          const resetToken = this.jwtService.sign(
            { userId: userEntity.id, type: 'password_reset' },
            { expiresIn: '1h' },
          );

          // Store token in database
          const passwordResetToken = new PasswordResetToken();
          passwordResetToken.token = resetToken;
          passwordResetToken.user = fullUser; // TypeORM relationship
          passwordResetToken.expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
          passwordResetToken.isUsed = false;

          await this.passwordResetTokenRepository.save(passwordResetToken);

          // Send reset email
          const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
          await this.mailService.sendMail(
            userEntity.email,
            'Password Reset Request',
            'password-reset',
            {
              name: userEntity.name,
              resetLink,
              expirationTime: '1 hour',
              currentYear: new Date().getFullYear(),
            },
          );

          this.logger.log(ctx, `Password reset email sent to ${email}`);
        } else {
          this.logger.log(
            ctx,
            `Password reset attempted for OAuth user: ${email}`,
          );
        }
      } else {
        this.logger.log(
          ctx,
          `Password reset attempted for non-existent user: ${email}`,
        );
      }
    } catch (error) {
      // Log error but don't expose it to prevent enumeration
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(ctx, `Error in forgotPassword: ${errorMessage}`);
    }

    // Always return the same message for security
    return {
      message:
        'If this email exists in our system, we have sent a password reset link.',
    };
  }

  /**
   * Reset password using valid token
   */
  async resetPassword(
    ctx: RequestContext,
    token: string,
    newPassword: string,
  ): Promise<{ message: string; success: boolean }> {
    this.logger.log(ctx, `${this.resetPassword.name} was called`);

    try {
      // Verify and decode the JWT token
      const decoded = this.jwtService.verify(token);

      if (decoded.type !== 'password_reset') {
        throw new BadRequestException('Invalid token type');
      }

      // Find the reset token in database
      const resetTokenRecord = await this.passwordResetTokenRepository.findOne({
        where: { token, isUsed: false },
        relations: ['user'],
      });

      if (!resetTokenRecord) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Check if token is expired
      if (new Date() > resetTokenRecord.expiresAt) {
        // Mark as used to prevent reuse
        resetTokenRecord.isUsed = true;
        await this.passwordResetTokenRepository.save(resetTokenRecord);
        throw new BadRequestException('Reset token has expired');
      }

      // Check if user still exists
      const user = resetTokenRecord.user;
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Hash new password
      const hashedPassword = await hash(newPassword, 10);

      // Update user password directly in database
      const userRepository =
        this.passwordResetTokenRepository.manager.getRepository(User);
      await userRepository.update(user.id, {
        password: hashedPassword,
      });

      // Mark token as used
      resetTokenRecord.isUsed = true;
      await this.passwordResetTokenRepository.save(resetTokenRecord);

      // Send confirmation email
      await this.mailService.sendMail(
        user.email,
        'Password Reset Successful',
        'password-changed',
        {
          name: user.name,
          timestamp: new Date().toLocaleString(),
          currentYear: new Date().getFullYear(),
          supportUrl: process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/support`
            : '#',
        },
      );

      // Emit password change event to invalidate old sessions
      this.eventEmitter.emit(AppEvents.PASSWORD_CHANGED, {
        userId: user.id,
      });

      this.logger.log(ctx, `Password successfully reset for user ${user.id}`);

      return {
        message: 'Password has been reset successfully',
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(ctx, `Error in resetPassword: ${errorMessage}`);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Invalid or expired reset token');
    }
  }
}
