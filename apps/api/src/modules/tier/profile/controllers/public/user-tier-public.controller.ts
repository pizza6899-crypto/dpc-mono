import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetUserTierService } from '../../application/get-user-tier.service';
import { GetUserTierHistoryService } from '../../application/get-user-tier-history.service';
import { UserTierPublicResponseDto } from './dto/user-tier-public.response.dto';
import { UserTierHistoryResponseDto } from './dto/user-tier-history.response.dto';
import { CurrentUser } from 'src/common/auth/decorators/current-user.decorator';
import { SessionAuthGuard } from 'src/common/auth/guards/session-auth.guard';
import { User } from 'src/modules/user/domain/model/user.entity';

@ApiTags('Tier (User)')
@Controller('v1/tiers')
@ApiBearerAuth()
@UseGuards(SessionAuthGuard)
export class UserTierPublicController {
    constructor(
        private readonly getUserTierService: GetUserTierService,
        private readonly getUserTierHistoryService: GetUserTierHistoryService,
    ) { }

    @Get('my')
    @ApiOperation({ summary: 'Get my tier status and progress' })
    @ApiOkResponse({ type: UserTierPublicResponseDto })
    async getMyTier(@CurrentUser() user: User): Promise<UserTierPublicResponseDto> {
        return this.getUserTierService.execute(user.id);
    }

    @Get('my/history')
    @ApiOperation({ summary: 'Get my tier change history' })
    @ApiOkResponse({ type: [UserTierHistoryResponseDto] })
    async getMyTierHistory(@CurrentUser() user: User): Promise<UserTierHistoryResponseDto[]> {
        return this.getUserTierHistoryService.execute(user.id);
    }
}
