import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Session,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiStandardResponse,
  ApiStandardErrors,
} from '../../../../platform/http/decorators/api-response.decorator';
import { ProfileService } from '../../application/profile.service';
import { AuthAll } from 'src/platform/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/platform/auth/decorators/current-user.decorator';
import type { CurrentUserWithSession } from 'src/platform/auth/decorators/current-user.decorator';
import { RequestClientInfoParam } from 'src/platform/auth/decorators/request-info.decorator';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';
import { ProfileResponseDto } from '../../dtos/profile.dto';
import { LocaleResponseDto } from '../../dtos/locale-response.dto';
import { UpdateLanguageDto } from '../../dtos/update-locale.dto';
import {
  UpdateCountryDto,
  UpdateCountryResponseDto,
} from '../../dtos/update-profile.dto';
import { Throttle } from 'src/platform/throttle/decorators/throttle.decorator';
import { ThrottleScope } from 'src/platform/throttle/types/throttle.types';

@Controller('profile')
@ApiTags('Profile(프로필)')
@ApiStandardErrors()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @AuthAll()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 60,
    ttl: 60, // 1분
    scope: ThrottleScope.USER,
  })
  @ApiOperation({
    summary: 'Get My Profile (내 프로필 조회)',
    description:
      'Retrieve the profile information of the currently logged-in user. (현재 로그인한 사용자의 프로필 정보를 조회합니다.)',
  })
  @ApiStandardResponse(ProfileResponseDto, {
    status: 200,
    description: 'Profile retrieved successfully',
  })
  async getMyProfile(
    @CurrentUser() user: CurrentUserWithSession,
    @Session() session: any,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<ProfileResponseDto> {
    console.log('🔄 user:', user);
    console.log('🔄 session:', session);

    return this.profileService.getMyProfile(user.id, requestInfo);
  }

  @Put('locale')
  @AuthAll()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    limit: 10,
    ttl: 60, // 1분
    scope: ThrottleScope.USER,
  })
  @ApiOperation({
    summary: 'Update User Locale (사용자 로케일 변경)',
    description:
      'Update the locale setting of the currently logged-in user. (현재 로그인한 사용자의 로케일 설정을 변경합니다.)',
  })
  @ApiStandardResponse(LocaleResponseDto, {
    status: 200,
    description: 'Locale updated successfully',
  })
  async updateLocale(
    @CurrentUser() user: CurrentUserWithSession,
    @Body() updateLocaleDto: UpdateLanguageDto,
    @RequestClientInfoParam() requestInfo: RequestClientInfo,
  ): Promise<LocaleResponseDto> {
    return this.profileService.updateUserLocale(
      user.id,
      updateLocaleDto,
      requestInfo,
    );
  }

  // @Put('country')
  // @AuthAll()
  // @HttpCode(HttpStatus.OK)
  // @Throttle({
  //   limit: 5,
  //   ttl: 3600, // 1시간
  //   scope: ThrottleScope.USER,
  // })
  // @ApiOperation({
  //   summary: 'Update User Country (사용자 국가 변경)',
  //   description: `
  //     Update the country setting of the currently logged-in user. (현재 로그인한 사용자의 국가 설정을 추가 또는 변경합니다.)

  //      - This API is mainly used to register the country for the first time when the country information is not set, such as for accounts created via social login.
  //        (이 API는 주로 소셜로그인 등으로 가입한 계정의 국가 정보가 아직 설정되지 않은 경우, 최초 1회 국가를 등록하는 용도로 사용됩니다.)
  //      - If you try to change the country for an account that already has a country set, the request will not be processed and an error will be returned.
  //        (이미 국가가 설정되어 있는 계정에 대해 다시 국가를 변경하려고 시도할 경우, 요청은 처리되지 않으며 에러가 반환됩니다.)
  //      - You can only set the country if it has not been set yet.
  //        (국가 정보가 없는 경우에만 추가 설정이 가능합니다.)
  //   `,
  // })
  // @ApiStandardResponse(UpdateCountryResponseDto, {
  //   status: 200,
  //   description: 'Country updated successfully',
  // })
  // async updateCountry(
  //   @CurrentUser() user: CurrentUserWithSession,
  //   @Body() updateProfileDto: UpdateCountryDto,
  //   @RequestClientInfoParam() requestInfo: RequestClientInfo,
  // ) {
  //   return this.profileService.updateCountry(
  //     user.id,
  //     updateProfileDto,
  //     requestInfo,
  //   );
  // }
}
