import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { googleOAuthConfig } from 'src/common/configs/google-oauth.config';
import { UserService } from 'src/core/users/services/user.services';
import { Profile } from '../types/profile.types';
import { AuthService } from '../services/auth.services';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: googleOAuthConfig.CLIENT_ID,
      clientSecret: googleOAuthConfig.CLIENT_SECRET,
      callbackURL: googleOAuthConfig.CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, name, photos } = profile;

    const user = {
      email: emails ? emails[0].value : '',
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos ? photos[0].value : '',
    };
    let userInDB = await this.userService.findByEmail(user.email);

    if (!userInDB) {
      // tạo user mới trong DB
      userInDB = await this.authService.handleSignUpWithGoogle({
        email: user.email,
        password: '',
      });
    }

    return done(null, userInDB);
  }
}
