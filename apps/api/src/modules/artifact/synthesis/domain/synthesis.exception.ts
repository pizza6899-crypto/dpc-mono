import { HttpException, HttpStatus } from '@nestjs/common';
import { ArtifactGrade } from '@prisma/client';

export class InvalidSynthesisIngredientsException extends HttpException {
  constructor(reason: string) {
    super(`Invalid synthesis ingredients: ${reason}`, HttpStatus.BAD_REQUEST);
  }
}

export class SynthesisPolicyNotConfiguredException extends HttpException {
  constructor(grade: ArtifactGrade) {
    super(`Synthesis policy is not configured for grade: ${grade}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class MaxGradeSynthesisException extends HttpException {
  constructor(grade: ArtifactGrade) {
    super(`Cannot synthesize artifacts of the maximum grade: ${grade}`, HttpStatus.BAD_REQUEST);
  }
}
