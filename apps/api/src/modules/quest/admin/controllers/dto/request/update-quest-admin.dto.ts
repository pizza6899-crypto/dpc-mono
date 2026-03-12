import { PartialType } from '@nestjs/swagger';
import { CreateQuestAdminDto } from './create-quest-admin.dto';

/**
 * 퀘스트 수정을 위한 DTO 입니다.
 * CreateQuestAdminDto의 모든 필드를 선택적(Optional)으로 상속받습니다.
 */
export class UpdateQuestAdminDto extends PartialType(CreateQuestAdminDto) { }
