# Socket.IO AsyncAPI 문서화 규칙

## AsyncAPI 데코레이터 사용 시 메시지 페이로드 규칙

Socket.IO 이벤트에 `@AsyncApiPub` 또는 `@AsyncApiSub` 데코레이터를 사용할 때, **message 부분의 payload는 반드시 별도로 정의된 DTO 클래스를 참조해야 합니다.**

### ✅ 올바른 사용법

```typescript
// DTO 클래스를 별도로 정의
class MessageResponseDto {
  @ApiProperty({ example: 'socket-id' })
  from: string;

  @ApiProperty({ example: { text: 'Hello!' } })
  data: any;
}

@AsyncApiPub({
  channel: 'message',
  summary: '메시지 브로드캐스트',
  message: {
    name: 'BroadcastMessage',
    payload: MessageResponseDto, // DTO 클래스 참조
  },
})
@SubscribeMessage('message')
handleMessage(@MessageBody() data: any): void {
  // ...
}
```

### ❌ 잘못된 사용법 (인라인 정의 금지)

```typescript
// 인라인으로 메시지 페이로드를 정의하면 안 됩니다
@AsyncApiPub({
  channel: 'message',
  message: {
    name: 'BroadcastMessage',
    payload: {  // ❌ 인라인 객체 정의 금지
      from: string,
      data: any,
    },
  },
})
```

### 규칙 요약

1. **항상 DTO 클래스를 별도 파일 또는 클래스 내부에 정의**
2. **`payload` 속성에는 정의된 DTO 클래스를 참조**
3. **인라인 객체 정의는 절대 사용하지 않음**
4. **DTO 클래스는 `@ApiProperty` 데코레이터를 사용하여 문서화**

이 규칙을 준수하여 코드의 일관성과 유지보수성을 유지하세요.
```

파일을 생성하면 Cursor가 자동으로 인식하고 적용합니다. 파일명은 `socket-io-asyncapi.md`로 권장합니다.
