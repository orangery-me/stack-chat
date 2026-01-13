import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@Constant/types';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService, private readonly jwtService: NestJwtService) {}

  verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token, { secret: this.configService.get<string>('JWT_ACCESS_SECRETKEY') });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
