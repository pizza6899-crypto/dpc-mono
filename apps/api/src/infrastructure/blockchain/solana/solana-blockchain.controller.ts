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

  /**
   * [GET] 블록 범위 조회 (Public)
   */
  @Public()
  @Get('blocks')
  @ApiOperation({
    summary: 'Get Blocks / 특정 범위 내의 슬롯 번호 목록 조회',
    description: 'Returns a list of slots between startSlot and optional endSlot.',
  })
  @ApiQuery({ name: 'startSlot', type: Number, required: true })
  @ApiQuery({ name: 'endSlot', type: Number, required: false })
  @ApiStandardResponse()
  async getBlocks(
    @Query('startSlot', ParseIntPipe) startSlot: number,
    @Query('endSlot') endSlot?: string,
  ) {
    const end = endSlot ? parseInt(endSlot, 10) : undefined;
    return await this.solanaService.getBlocks(startSlot, end);
  }

  /**
   * [GET] 최신 블록 상세 정보 조회 (Public)
   */
  @Public()
  @Get('latest-block')
  @ApiOperation({
    summary: 'Get Latest Block / 최신 블록 상세 정보 조회',
    description: 'Returns the details of the latest confirmed block.',
  })
  @ApiQuery({ name: 'details', enum: ['none', 'signatures', 'full'], required: false })
  @ApiStandardResponse()
  async getLatestBlock(@Query('details') details: 'none' | 'signatures' | 'full' = 'none') {
    return await this.solanaService.getLatestBlock(details);
  }
}
