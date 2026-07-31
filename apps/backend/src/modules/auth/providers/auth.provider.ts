import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

const SALT_ROUNDS = 10;

@Injectable()
export class AuthProvider {
  constructor(private readonly jwtService: JwtService) {}

  hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  signToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, { expiresIn: '1h' });
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }
}
