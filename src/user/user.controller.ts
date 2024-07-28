import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  Res,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Response } from 'express';
import { CreateUserDto } from './dto/create.user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const token = await this.userService.login(loginDto);
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 3600000 * 24 * 30 * 6,
    });
    return res.send({ token });
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req) {
    return req.user;
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('token');
    return res.send({ message: 'Logged out successfully' });
  }
}
