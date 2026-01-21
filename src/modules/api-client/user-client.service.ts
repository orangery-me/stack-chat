import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

interface UserServiceClient {
  getUserById(data: { userId: string }): any;
}

@Injectable()
export class UserClientService implements OnModuleInit {
  private userService: UserServiceClient;

  constructor(@Inject('USER_PACKAGE') private readonly userClient: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.userClient.getService<UserServiceClient>('UsersService');
  }

  async getUserProfile(
    userId: string
  ): Promise<{ id: string; name: string; email: string; avatar: string | null } | null> {
    try {
      const response = await lastValueFrom<{ id: string; name: string; email: string; avatar: string | null }>(
        this.userService.getUserById({ userId })
      );

      if (!response) return null;

      return {
        id: response.id,
        name: response.name,
        email: response.email,
        avatar: response.avatar || null,
      };
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
}
