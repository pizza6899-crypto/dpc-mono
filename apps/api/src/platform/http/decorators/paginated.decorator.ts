import { SetMetadata } from '@nestjs/common';

export const PAGINATED = 'paginated';
export const Paginated = () => SetMetadata(PAGINATED, true);
