import { Module, Global } from '@nestjs/common';
import { UserWebsocketGateway } from './gateways/user-websocket.gateway';
import { AdminWebsocketGateway } from './gateways/admin-websocket.gateway';
import { WebsocketService } from './websocket.service';

@Global() // 전역 모듈로 설정하여 어디서든 쉽게 주입받아 사용 가능하게 함
@Module({
  providers: [UserWebsocketGateway, AdminWebsocketGateway, WebsocketService],
  exports: [WebsocketService], // 다른 모듈에서는 WebsocketService만 사용하도록 내보냄
})
export class WebsocketModule { }
