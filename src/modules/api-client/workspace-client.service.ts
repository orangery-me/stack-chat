import { Inject, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

interface VerifyMembershipResponse {
  isValid: boolean;
  message: string;
}

interface WorkspaceServiceClient {
  verifyMembership(data: { userId: string; workspaceId: string }): any;
}

@Injectable()
export class WorkspaceClientService implements OnModuleInit {
  private workspaceService: WorkspaceServiceClient;

  constructor(@Inject('WORKSPACE_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.workspaceService = this.client.getService<WorkspaceServiceClient>('WorkspaceService');
  }

  async verifyWorkspaceMembership(userId: string, workspaceId: string): Promise<void> {
    const response = await lastValueFrom<VerifyMembershipResponse>(
      this.workspaceService.verifyMembership({ userId, workspaceId })
    );

    if (!response?.isValid) {
      throw new UnauthorizedException(response?.message || 'You are not a member of this workspace');
    }
  }
}
