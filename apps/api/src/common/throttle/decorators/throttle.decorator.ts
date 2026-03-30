// src/platform/throttle/decorators/throttle.decorator.ts
import { SetMetadata } from '@nestjs/common';
import type { ThrottleOptions } from 'src/infrastructure/throttle/types/throttle.types';

export const THROTTLE_KEY = 'throttle';

export const Throttle = (options: ThrottleOptions) =>
  SetMetadata(THROTTLE_KEY, options);
