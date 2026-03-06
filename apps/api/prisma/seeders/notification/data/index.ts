import { userTemplates } from './user.templates';
import { promotionTemplates } from './promotion.templates';
import { walletTemplates } from './wallet.templates';

export const notificationTemplates = [
    ...userTemplates,
    ...promotionTemplates,
    ...walletTemplates,
];
