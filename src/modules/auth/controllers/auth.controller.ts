import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Redirect,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { ForgotPasswordDto } from '@/modules/auth/dtos/auth-forgot-password.dto';
import { LoginInput } from '@/modules/auth/dtos/auth-login-input.dto';
import { RefreshTokenInput } from '@/modules/auth/dtos/auth-refresh-token-input.dto';
import { RegisterCompanyInput } from '@/modules/auth/dtos/auth-register-company-input.dto';
import { RegisterInput } from '@/modules/auth/dtos/auth-register-input.dto';
import { RegisterOutput } from '@/modules/auth/dtos/auth-register-output.dto';
import { ResetPasswordDto } from '@/modules/auth/dtos/auth-reset-password.dto';
import { AuthTokenOutput } from '@/modules/auth/dtos/auth-token-output.dto';
import { GoogleAuthGuard } from '@/modules/auth/guards/google-auth.guard';
import { JwtRefreshGuard } from '@/modules/auth/guards/jwt-refresh.guard';
import { LocalAuthGuard } from '@/modules/auth/guards/local-auth.guard';
import { AuthService } from '@/modules/auth/services/auth.service';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '@/shared/dtos/base-api-response.dto';
import { AppLogger } from '@/shared/logger/logger.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { TaxCodeReportDto } from '../dtos/auth-report-taxcode-input.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(AuthController.name);
  }
  @Post('login')
  @ApiOperation({
    summary: 'User login API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AuthTokenOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  login(
    @ReqContext() ctx: RequestContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() credential: LoginInput,
  ): BaseApiResponse<AuthTokenOutput> {
    this.logger.log(ctx, `${this.login.name} was called`);

    const authToken = this.authService.login(ctx);
    return { data: authToken, meta: {} };
  }

  @Post('register')
  @ApiOperation({
    summary: 'User registration API',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SwaggerBaseApiResponse(RegisterOutput),
  })
  async registerLocal(
    @ReqContext() ctx: RequestContext,
    @Body() input: RegisterInput,
  ): Promise<BaseApiResponse<RegisterOutput>> {
    const registeredUser = await this.authService.register(ctx, input);
    return { data: registeredUser, meta: {} };
  }

  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AuthTokenOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async refreshToken(
    @ReqContext() ctx: RequestContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() credential: RefreshTokenInput,
  ): Promise<BaseApiResponse<AuthTokenOutput>> {
    this.logger.log(ctx, `${this.refreshToken.name} was called`);

    const authToken = await this.authService.refreshToken(ctx);
    return { data: authToken, meta: {} };
  }

  @Post('register-company')
  @ApiOperation({ summary: 'Register a new company' })
  @ApiResponse({
    status: 201,
    description: 'Company registered successfully',
  })
  async registerCompany(
    @Body() input: RegisterCompanyInput,
    @ReqContext() ctx: RequestContext,
  ): Promise<{ message: string }> {
    try {
      return await this.authService.registerCompany(ctx, input);
    } catch (err) {
      console.error('Register failed:', err);
      throw err;
    }
  }

  @Get('verify-company')
  @Redirect(`${process.env.FRONTEND_URL}/signin`)
  @ApiOperation({ summary: 'Verify company by code' })
  async verifyCompany(
    @ReqContext() ctx: RequestContext,
    @Query('code') code: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyCompany(ctx, code);
  }

  // -------- Email verification for newly registered users --------

  @Get('verify')
  @ApiOperation({ summary: 'Verify email by token' })
  async verifyEmail(
    @ReqContext() ctx: RequestContext,
    @Query('token') token: string,
  ): Promise<{ message: string }> {
    return this.authService.verifyEmail(ctx, token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification link' })
  async resendVerification(
    @ReqContext() ctx: RequestContext,
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    return this.authService.resendVerificationEmail(ctx, email);
  }

  // -------- Password reset functionality --------

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset link' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset link sent (generic message for security)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: BaseApiErrorResponse,
  })
  async forgotPassword(
    @ReqContext() ctx: RequestContext,
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    this.logger.log(ctx, `${this.forgotPassword.name} was called`);
    return this.authService.forgotPassword(ctx, forgotPasswordDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: BaseApiErrorResponse,
  })
  async resetPassword(
    @ReqContext() ctx: RequestContext,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string; success: boolean }> {
    this.logger.log(ctx, `${this.resetPassword.name} was called`);
    return this.authService.resetPassword(
      ctx,
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth authentication' })
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void> {
    // This method initiates the Google OAuth flow
    // The actual redirect is handled by Passport
  }

  @Get('google/callback')
  @ApiOperation({
    summary:
      'Google OAuth callback endpoint - redirects to frontend with JWT token',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description:
      'Redirects to frontend success page with JWT token or error page on failure',
  })
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(
    @Req() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const ctx = new RequestContext();
    const frontendUrl = this.configService.get<string>('frontend.url');

    try {
      // Check if user authentication was successful
      if (!req.user) {
        this.logger.error(ctx, 'Google OAuth failed: No user found in request');
        res.redirect(`${frontendUrl}/error?message=Authentication failed`);
        return;
      }

      // User is available in req.user after successful Google authentication
      ctx.user = req.user;
      const authToken = this.authService.login(ctx);

      // Redirect to frontend success page with JWT token
      const frontendSuccessUrl = `${frontendUrl}/success?token=${authToken.accessToken}`;

      this.logger.log(
        ctx,
        `Redirecting Google OAuth user to: ${frontendSuccessUrl}`,
      );
      res.redirect(frontendSuccessUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        ctx,
        `Google OAuth callback error: ${errorMessage}`,
        errorStack,
      );
      res.redirect(`${frontendUrl}/error?message=Authentication failed`);
    }
  }

  @Post('report/tax-code-issue')
  @ApiOperation({ summary: 'Report duplicate tax code issue' })
  async reportTaxCodeIssue(
    @Body() reportData: TaxCodeReportDto,
  ): Promise<{ message: string }> {
    return this.authService.handleTaxCodeReport(reportData);
  }
}
