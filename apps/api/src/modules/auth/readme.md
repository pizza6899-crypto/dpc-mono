🔐 Auth & Session 모듈 설계 가이드 (Hexagonal + Passport + Session)
본 문서는 Passport.js를 이용한 쿠키 기반 세션 인증을 경량 헥사고날 아키텍처에 맞게 구조화한 가이드입니다.

1. 전체 모듈 구조 (Module Overview)
인증(Auth)과 세션(Session)을 분리하여 **"인증 시도"**와 **"상태 유지"**의 책임을 분리합니다.

Auth Module: 사용자의 자격 증명(ID/PW, 소셜 로그인)을 검증하고 인증 과정을 오케스트레이션합니다.

Session Module: 인증 성공 후의 상태(세션)를 저장소(Redis 등)에 유지하고, Passport의 직렬화/역직렬화를 담당합니다.

2. 디렉토리 구조 (Directory Structure)
Plaintext

src/modules/
├── auth/                         # 인증 모듈 (관문 역할)
│   ├── credential/               # 하위 도메인: 로그인/로그아웃 로직
│   │   ├── application/          # LoginUseCase (Passport Guard 호출 후 로직)
│   │   ├── controllers/          # User/Admin별 로그인 컨트롤러
│   │   └── infrastructure/       # Passport Strategies (Local, Social 등)
│   ├── identity/                 # 하위 도메인: 회원가입 및 계정 정보 검증
│   │   ├── application/          # RegisterUseCase, ValidateUserService
│   │   └── infrastructure/       # UserRepository 구현
│   └── auth.module.ts
│
├── session/                      # 세션 모듈 (상태 관리 역할)
│   ├── domain/                   # Session 엔티티 (ip, device, uid 등)
│   ├── application/              # ClearSessionService, FindActiveSessionsService
│   ├── ports/                    # Outbound: SessionRepositoryPort
│   ├── infrastructure/           
│   │   ├── persistence/          # ✅ PassportSerializer 구현체
│   │   └── repository/           # Redis 기반 SessionRepository 구현
│   └── session.module.ts
3. 핵심 설계 원칙 (Core Principles)
① Hybrid Identity 적용
세션 저장소: 보안을 위해 내부 id(BigInt) 대신 uid(CUID2)를 Key로 저장합니다.

역직렬화(Deserialization): 세션의 uid를 바탕으로 Identity 모듈에서 전체 User 엔티티(id 포함)를 복구하여 Request.user에 담습니다.

② 레이어별 책임 분리
Infrastructure (Adapter): Passport Strategy, Serializer, Guard가 위치합니다.

Application (Use Case): 실제 비즈니스 로직(가입 시 지갑 생성 이벤트 발행 등)이 위치합니다.

Controller (Entry): Set-Cookie 설정 및 유저/어드민 경로 분리를 담당합니다.

4. 주요 구현 코드 (Implementation Snippets)
✅ Session Serializer (Session Infrastructure)
Passport가 세션을 구워내고 읽어올 때 사용하는 핵심 클래스입니다.

TypeScript

// src/modules/session/infrastructure/persistence/session.serializer.ts
@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    // Identity 모듈의 포트를 사용하여 유저를 찾음
    private readonly userRepository: UserRepositoryPort,
  ) {
    super();
  }

  // 1. 세션에 무엇을 저장할 것인가? (uid만 저장)
  serializeUser(user: User, done: Function) {
    done(null, user.uid);
  }

  // 2. 세션의 uid로 어떻게 유저 객체를 복구할 것인가?
  async deserializeUser(uid: string, done: Function) {
    const user = await this.userRepository.findByUid(uid);
    if (!user) return done(null, null);
    
    // 이 시점에 Request.user에 도메인 엔티티(id 포함)가 주입됨
    done(null, user);
  }
}
✅ Local Strategy (Auth Infrastructure)
사용자의 ID/PW 자격 증명을 검증합니다.

TypeScript

// src/modules/auth/credential/infrastructure/strategies/local.strategy.ts
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly validateUserService: ValidateUserService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, pass: string): Promise<User> {
    // Application 레이어의 UseCase 호출
    const user = await this.validateUserService.execute({ email, pass });
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
5. 컨트롤러 분리 정책 (User vs Admin)
가이드에 따라 유저와 어드민 컨트롤러를 물리적으로 분리하여 식별자 노출을 제어합니다.

👤 User Controller (/api/v1/auth/...)
로그인: POST /auth/login (LocalAuthGuard 사용)

로그아웃: POST /auth/logout (세션 파괴)

내 정보: GET /auth/me (**uid**만 포함된 DTO 반환)

👑 Admin Controller (/api/admin/v1/sessions/...)
전체 세션 조회: GET /admin/sessions (운영 편의를 위해 id, uid 모두 노출)

강제 로그아웃: DELETE /admin/sessions/:sessionId (관리자가 특정 세션 강제 종료)

6. 세션 관리 (Session Management)
Redis 연동 (Infrastructure)
세션은 휘발성 데이터이며 빠른 조회가 필요하므로 Redis를 사용합니다.

TypeScript

// main.ts 또는 별도 설정 파일
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,  // JS 접근 방지
      secure: true,    // HTTPS 필수
      sameSite: 'lax', // CSRF 방지
      maxAge: 1000 * 60 * 60 * 24, // 24시간
    },
  }),
);
7. 요약된 의존성 방향 규칙
Credential Application은 Identity Domain을 참조하여 유저 정보를 검증합니다.

Credential Application은 인증 성공 시 Session Application을 호출하지 않고, Passport 흐름에 맡깁니다.

**Session Infrastructure (Serializer)**는 Identity Outbound Port를 참조하여 세션 데이터를 엔티티로 복구합니다.

Admin Controller는 Session Application에 직접 의존하여 세션 강제 종료 등의 관리 기능을 수행합니다.