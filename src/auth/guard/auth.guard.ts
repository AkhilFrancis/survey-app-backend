import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rolesGuard = new RolesGuard(this.reflector);
    const request = context.switchToHttp().getRequest();

    // Retrieve token from cookies or Authorization header
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      return rolesGuard.canActivate(context); // Allow anonymous access if no token is present
    }

    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.authService.validateUser(decoded.id);

      if (!user) {
        return false;
      }

      request.user = user;
      return rolesGuard.canActivate(context);
    } catch (error) {
      return false;
    }
  }

  private extractTokenFromRequest(request: any): string | null {
    if (request.cookies && request.cookies.token) {
      return request.cookies.token;
    }
    if (
      request.headers.authorization &&
      request.headers.authorization.startsWith('Bearer ')
    ) {
      return request.headers.authorization.split(' ')[1];
    }
    return null;
  }
}
