import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsNotEmpty, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DcsTransactionBaseDto, DcsCommonResponseDto } from './base.dto';

// 1. Wager
export class WagerRequestDto extends DcsTransactionBaseDto {
    @ApiProperty({
        description: 'Token created by operator',
        example: 'abc123XYZ456',
        maxLength: 32,
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({
        description: 'Bet amount',
        example: 100.0,
        type: Number,
    })
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    amount: number;

    @ApiProperty({
        description: 'Jackpot contribution amount',
        example: 0.1,
        type: Number,
    })
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    jackpot_contribution: number;

    @ApiProperty({
        description: 'DC game ID',
        example: 12345,
        type: Number,
    })
    @IsNumber()
    @Type(() => Number)
    game_id: number;

    @ApiProperty({
        description: 'DC Game Name',
        example: 'Slot Game 1',
        maxLength: 50,
    })
    @IsString()
    @IsNotEmpty()
    game_name: string;

    @ApiProperty({
        description: 'Bet type (1=Normal; 2=Tip)',
        example: 1,
        type: Number,
        enum: [1, 2],
    })
    @IsNumber()
    @IsEnum([1, 2])
    @Type(() => Number)
    bet_type: number;
}

export class WagerResponseDto extends DcsCommonResponseDto { }

// 2. Cancel Wager
export class CancelWagerRequestDto extends DcsTransactionBaseDto {
    @ApiProperty({
        description: 'Wager type (1=cancelWager, 2=cancelEndWager)',
        example: 1,
        type: Number,
        enum: [1, 2],
    })
    @IsNumber()
    @IsEnum([1, 2])
    @Type(() => Number)
    wager_type: number;
}

export class CancelWagerResponseDto extends DcsCommonResponseDto { }

// 3. Append Wager
export class AppendWagerRequestDto extends DcsTransactionBaseDto {
    @ApiProperty({
        description: 'Player jackpot winning amount',
        example: 50.0,
        type: Number,
    })
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    amount: number;

    @ApiProperty({
        description: 'DC game ID',
        example: 12345,
        type: Number,
    })
    @IsNumber()
    @Type(() => Number)
    game_id: number;

    @ApiProperty({
        description: 'DC Game Name',
        example: 'Slot Game 1',
        maxLength: 50,
    })
    @IsString()
    @IsNotEmpty()
    game_name: string;

    @ApiProperty({
        description: 'Description of appendWager',
        example: 'Additional wager for jackpot',
        maxLength: 100,
    })
    @IsString()
    @IsOptional()
    description: string;
}

export class AppendWagerResponseDto extends DcsCommonResponseDto { }

// 4. End Wager
export class EndWagerRequestDto extends DcsTransactionBaseDto {
    @ApiProperty({
        description: 'Player winning amount in normal round',
        example: 200.0,
        type: Number,
    })
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    amount: number;

    @ApiPropertyOptional({
        description:
            'Game result (Only Ezugi has game result, the other provider will be null)',
        example: null,
        maxLength: 4000,
    })
    @IsString()
    @IsOptional()
    game_result?: string;
}

export class EndWagerResponseDto extends DcsCommonResponseDto { }

// 5. Free Spin Result
export class FreeSpinResultRequestDto extends DcsTransactionBaseDto {
    @ApiProperty({
        description: 'Player winning amount in campaign',
        example: 50.0,
        type: Number,
    })
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    amount: number;

    @ApiProperty({
        description: 'DC game ID',
        example: 12345,
        type: Number,
    })
    @IsNumber()
    @Type(() => Number)
    game_id: number;

    @ApiProperty({
        description: 'DC Game Name',
        example: 'Slot Game 1',
        maxLength: 50,
    })
    @IsString()
    @IsNotEmpty()
    game_name: string;

    @ApiPropertyOptional({
        description: 'freespin_id from the response of 2.7 createFreeSpin',
        example: 123456789,
        type: Number,
    })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    freespin_id?: number;

    @ApiPropertyOptional({
        description: 'FreeSpin campaign description',
        example: 'Welcome Bonus Free Spin',
        maxLength: 100,
    })
    @IsString()
    @IsOptional()
    freespin_description?: string;
}

export class FreeSpinResultResponseDto extends DcsCommonResponseDto { }
