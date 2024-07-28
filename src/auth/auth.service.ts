import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(userId: string): Promise<any> {
    return this.userService.findById(userId);
  }

  async generateJWT(user: any): Promise<string> {
    const payload = { id: user.id, isAdmin: user.isAdmin };
    return this.jwtService.sign(payload);
  }

  async verifyJWT(token: string): Promise<any> {
    return this.jwtService.verify(token);
  }
}
