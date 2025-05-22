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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { LoginInput } from '@/modules/auth/dtos/auth-login-input.dto';
import { RefreshTokenInput } from '@/modules/auth/dtos/auth-refresh-token-input.dto';
import { RegisterCompanyInput } from '@/modules/auth/dtos/auth-register-company-input.dto';
import { RegisterInput } from '@/modules/auth/dtos/auth-register-input.dto';
import { RegisterOutput } from '@/modules/auth/dtos/auth-register-output.dto';
import { AuthTokenOutput } from '@/modules/auth/dtos/auth-token-output.dto';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
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
    @Body() input: RegisterCompanyInput, // Use the combined DTO
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
}
