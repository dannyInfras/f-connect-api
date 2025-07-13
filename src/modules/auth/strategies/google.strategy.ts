import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

import { UserService } from '@/modules/user/services/user.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly logger: AppLogger,
  ) {
    super({
      clientID: configService.get<string>('google.clientId'),
      clientSecret: configService.get<string>('google.clientSecret'),
      callbackURL: configService.get<string>('google.callbackUrl'),
      scope: ['email', 'profile'],
    });
    this.logger.setContext(GoogleStrategy.name);
  }

  /**
   * Validate Google OAuth user and return user data for authentication
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    const ctx = new RequestContext();
    this.logger.log(
      ctx,
      `${this.validate.name} was called for Google user: ${profile.id}`,
    );

    try {
      const { id: googleId, emails, displayName, photos } = profile;
      const email = emails?.[0]?.value;
      const avatar = photos?.[0]?.value;

      this.logger.log(
        ctx,
        `Google profile data: email=${email}, name=${displayName}, googleId=${googleId}`,
      );

      if (!email) {
        throw new Error('No email found in Google profile');
      }

      if (!displayName) {
        throw new Error('No display name found in Google profile');
      }

      // Try to find existing user by Google ID
      let user = await this.userService.findByGoogleId(ctx, googleId);

      if (user) {
        this.logger.log(ctx, `Existing Google user found: ${user.id}`);
        return user;
      }

      // Try to find existing user by email to link accounts
      try {
        user = await this.userService.findByEmail(ctx, email);

        // Link Google account to existing user
        this.logger.log(
          ctx,
          `Linking Google account to existing user: ${user.id}`,
        );
        user = await this.userService.linkGoogleAccount(ctx, user.id, googleId);
        return user;
      } catch (error) {
        // User doesn't exist by email, we'll create a new one below
        this.logger.log(
          ctx,
          `No existing user found with email: ${email}, creating new user`,
        );
      }

      // Create new user with Google authentication
      this.logger.log(ctx, `Creating new Google user with email: ${email}`);
      user = await this.userService.createGoogleUser(ctx, {
        googleId,
        email,
        name: displayName,
        avatar,
        provider: 'google',
        isAccountDisabled: false, // Google users are verified by default
      });

      this.logger.log(ctx, `Successfully created new Google user: ${user.id}`);
      return user;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        ctx,
        `Google OAuth validation failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
