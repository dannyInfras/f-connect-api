import { HttpModule } from '@nestjs/axios'; // Import HttpModule
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompanyModule } from '@/modules/company/company.module';
import { UserModule } from '@/modules/user/user.module';
import { SharedModule } from '@/shared/shared.module';

import { STRATEGY_JWT_AUTH } from './constants/strategy.constant';
import { AuthController } from './controllers/auth.controller';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { AuthService } from './services/auth.service';
import { EmailVerificationService } from './services/email-verification.service';
import { JwtAuthStrategy } from './strategies/jwt-auth.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    SharedModule,
    HttpModule,
    TypeOrmModule.forFeature([EmailVerificationToken]),
    PassportModule.register({ defaultStrategy: STRATEGY_JWT_AUTH }),
    JwtModule.registerAsync({
      imports: [SharedModule],
      useFactory: async (configService: ConfigService) => ({
        publicKey: configService.get<string>('jwt.publicKey'),
        privateKey: configService.get<string>('jwt.privateKey'),
        signOptions: {
          algorithm: 'RS256',
        },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    CompanyModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtAuthStrategy,
    JwtRefreshStrategy,
    EmailVerificationService,
  ],
})
export class AuthModule {}
