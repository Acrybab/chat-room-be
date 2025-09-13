/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Lấy JWT từ Header: Authorization: Bearer <token>
      ignoreExpiration: false,
      secretOrKey: 'secretKey', // secret để verify token
    });
  }

  validate(payload: any) {
    console.log('Payload received in JWT Strategy:', payload);
    return { sub: payload.sub, email: payload.email };
  }
}
