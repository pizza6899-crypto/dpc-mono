import { IsString, IsNumber, IsOptional } from 'class-validator';

// 게임 실행 요청
export class WhitecliffGameLaunchRequestDto {
  @IsString()
  user_id: number;

  @IsNumber()
  prd_id: number;

  @IsString()
  @IsOptional()
  sid?: string;

  @IsString()
  @IsOptional()
  game_id?: string;

  @IsString()
  @IsOptional()
  table_id?: string;

  @IsString()
  @IsOptional()
  round_id?: string;

  @IsString()
  @IsOptional()
  return_url?: string;
}

// 게임 실행 응답
export class WhitecliffGameLaunchResponseDto {
  @IsNumber()
  status: number;

  @IsString()
  @IsOptional()
  game_url?: string;

  @IsString()
  @IsOptional()
  error?: string;
}

// 게임 결과 재확인 요청
export class WhitecliffGameResultRequestDto {
  @IsString()
  txn_id: string;

  @IsNumber()
  user_id: number;

  @IsNumber()
  prd_id: number;
}

// 푸시배팅 확인 요청
export class WhitecliffPushBettingRequestDto {
  @IsString()
  user_id: string;

  @IsString()
  txn_id: string;

  @IsString()
  prd_id: string;

  @IsNumber()
  amount: number;
}

// 공통 응답
export class WhitecliffApiResponseDto {
  @IsNumber()
  status: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  error?: string;
}
