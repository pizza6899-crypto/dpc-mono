import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { AvailabilityField } from 'src/modules/user/account/application/check-availability.service';

export class AvailabilityRequestDto {
  @ApiProperty({
    description: 'Field to check / 중복 검사할 필드',
    enum: [AvailabilityField.NICKNAME, AvailabilityField.EMAIL],
    example: AvailabilityField.NICKNAME,
  })
  @IsEnum({
    [AvailabilityField.NICKNAME]: AvailabilityField.NICKNAME,
    [AvailabilityField.EMAIL]: AvailabilityField.EMAIL,
  })
  field: AvailabilityField;

  @ApiProperty({
    description: 'Value to check / 중복 검사할 값',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  value: string;
}
