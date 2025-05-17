import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { firstValueFrom } from 'rxjs';

import { RegisterCompanyInput } from '@/modules/auth/dtos/auth-register-company-input.dto';
import { RegisterInput } from '@/modules/auth/dtos/auth-register-input.dto';
import { RegisterOutput } from '@/modules/auth/dtos/auth-register-output.dto';
import {
  AuthTokenOutput,
  UserAccessTokenClaims,
} from '@/modules/auth/dtos/auth-token-output.dto';
import { CompanyService } from '@/modules/company/services/company.service';
import { UserOutput } from '@/modules/user/dtos/user-output.dto';
import { UserService } from '@/modules/user/services/user.service';
import { AppEvents } from '@/shared/events/event.constants';
import { EventEmitterService } from '@/shared/events/event-emitter.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { MailService } from '@/shared/mail/mail.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';
import { UnitOfWork } from '@/shared/unit-of-work/unit-of-work.service';

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

    // TODO : Setting default role as USER here. Will add option to change this later via ADMIN users.
    input.isAccountDisabled = false;

    const registeredUser = await this.userService.createUser(ctx, input);

    // Emit user registered event to create candidate profile
    this.eventEmitter.emit(AppEvents.USER_REGISTERED, registeredUser);

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
    const { taxCode, ...userInput } = input;

    // Step 1: Check if the company already exists
    const existingCompany = await this.companyService.findByTaxCode(taxCode);
    if (existingCompany) {
      throw new BadRequestException(
        'A company with this tax code already exists.',
      );
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
            address: externalCompanyData.address
              ? [externalCompanyData.address]
              : [],
            industry: externalCompanyData.industry || 'Unknown',
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
      registeredUser.email,
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

    // Check if already active
    if (!user.isAccountDisabled) {
      return { message: 'User already verified.' };
    }

    // Enable account
    user.isAccountDisabled = false;
    await this.userService.verifyUser(ctx, user.id, false);

    return { message: 'Email verified successfully!' };
  }
}
