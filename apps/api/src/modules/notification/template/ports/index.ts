// apps/api/src/modules/notification/template/ports/index.ts

export { NOTIFICATION_TEMPLATE_REPOSITORY } from './notification-template.repository.token';
export type { NotificationTemplateRepositoryPort } from './notification-template.repository.port';
export type {
  TemplateRenderer,
  RenderResult,
  RenderParams,
} from './template-renderer.port';
