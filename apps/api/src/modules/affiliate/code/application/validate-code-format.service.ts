// src/modules/affiliate/code/application/validate-code-format.service.ts
import { Injectable } from '@nestjs/common';
import { AffiliateCodeValue } from '../domain';

interface ValidateCodeFormatParams {
  code: string;
}

@Injectable()
export class ValidateCodeFormatService {
  execute({ code }: ValidateCodeFormatParams): boolean {
    return AffiliateCodeValue.validate(code);
  }
}
