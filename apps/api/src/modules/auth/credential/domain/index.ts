// src/modules/auth/credential/domain/index.ts
export {
  LoginAttempt,
  LoginAttemptResult,
  LoginFailureReason,
} from './model/login-attempt.entity';
export {
  CredentialException,
  LoginAttemptNotFoundException,
} from './credential.exception';
