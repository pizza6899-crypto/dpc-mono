import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Public } from 'src/common/auth/decorators/roles.decorator';
import { ApiStandardResponse } from 'src/common/http/decorators/api-response.decorator';
import { SolanaService } from './solana.service';

/**
 * [Support] Solana 블록체인 상태 조회 컨트롤러 (Public 테스트용)
 */
@ApiTags('Support - Blockchain Solana')
@Controller('support/blockchain/solana')
export class SolanaBlockchainController {
  constructor(private readonly solanaService: SolanaService) { }

  /**
   * [GET] 현재 슬롯 번호 조회 (Public)
   */
  @Public()
  @Get('current-slot')
  @ApiOperation({ summary: 'Get Current Slot / 현재 슬롯 번호 조회' })
  @ApiStandardResponse()
  async getCurrentSlot() {
    return await this.solanaService.getCurrentSlot();
  }

  /**
   * [GET] 특정 슬롯의 블록해시 조회 (Public)
   */
  @Public()
  @Get('blockhash/:slot')
  @ApiOperation({
    summary: 'Get Blockhash by Slot / 특정 슬롯의 블록해시 조회',
    description: 'Returns the blockhash of a specific slot.',
  })
  @ApiParam({ name: 'slot', type: Number, description: '조회할 슬롯 번호' })
  @ApiStandardResponse()
  async getBlockHashBySlot(@Param('slot', ParseIntPipe) slot: number) {
    return await this.solanaService.getBlockHashBySlot(slot);
  }

}
