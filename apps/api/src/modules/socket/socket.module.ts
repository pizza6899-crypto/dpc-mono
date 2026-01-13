import { Module, Global } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Global() // 전역 모듈로 설정하여 어디서든 쉽게 주입받아 사용 가능하게 함
@Module({
    providers: [SocketGateway, SocketService],
    exports: [SocketService], // 다른 모듈에서는 SocketService만 사용하도록 내보냄
})
export class SocketModule { }
