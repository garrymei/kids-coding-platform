import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './jwt.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: { sub: string; email: string; role: number }) {
    // The payload is the decoded JWT. We can trust it because the signature has been verified.
    // We could add logic here to look up the user in the DB to ensure they still exist, etc.
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
