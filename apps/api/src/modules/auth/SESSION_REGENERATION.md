# 세션 재생성 (Session Regeneration) 작업 명세

작성 목적: 세션 픽스테이션(Session Fixation) 취약점 완화 및 로그인 처리 안정화를 위해
1순위(`세션 재생성 적용`) 작업에 필요한 분석, 변경사항, 예외처리, 테스트 계획을 정리합니다.

---

## 1. 요약
- 목표: 로그인 시 기존 세션을 재생성하여 세션 픽스테이션 공격을 방지하고, 세션 저장 시점을 명시적으로 보장한다.
- 주요 변경 파일(참조):
  - [apps/api/src/modules/auth/credential/controllers/user/user-auth.controller.ts](apps/api/src/modules/auth/credential/controllers/user/user-auth.controller.ts)
  - [apps/api/src/modules/auth/credential/controllers/admin/admin-auth.controller.ts](apps/api/src/modules/auth/credential/controllers/admin/admin-auth.controller.ts)
  - [apps/api/src/modules/auth/credential/application/login.service.ts](apps/api/src/modules/auth/credential/application/login.service.ts)
  - [apps/api/src/common/auth/strategies/session.serializer.ts](apps/api/src/common/auth/strategies/session.serializer.ts)
  - [apps/api/src/main.ts](apps/api/src/main.ts)

## 2. 현재 흐름(분석)
1. 클라이언트가 `/auth/login` (또는 `/admin/auth/login`)으로 로그인 요청 전송.
2. 컨트롤러에서 `AuthenticateIdentityService.execute()`로 자격 증명을 검증(계정 잠금 체크 포함).
3. 컨트롤러에서 `req.login(user, cb)`를 호출하여 Passport가 세션에 사용자 정보를 넣음.
4. 컨트롤러에서 `LoginService.execute({ sessionId: req.sessionID, ... })`를 호출하여 DB에 세션 레코드 생성.
5. `SessionSerializer.deserializeUser()`는 요청의 `req.sessionID`로 DB 세션을 조회하여 세션 유효성 확인.

문제: 3번과 4번 사이에 `req.session.regenerate()` 호출이 없어, 기존(외부에서 고정된) sessionId가 그대로 DB 세션과 연결될 수 있음.

## 3. 취약점(위험) 요약
- 세션 픽스테이션: 공격자가 미리 세션ID를 주입/고정하면, 피해자가 로그인 시 공격자가 제어하는 sessionId와 인증이 결합될 수 있음.
- 세션 저장(race) 문제: `req.login()` 직후 세션이 즉시 Redis에 persist 되지 않을 수 있어, 다중 인스턴스 환경에서 불일치가 발생할 수 있음.

### 세션 저장(race) 문제 및 권장 해결방안
세션이 Redis(또는 외부 세션 스토어)에 완전히 쓰여지기 전에 DB 세션을 생성하면 race가 발생할 수 있습니다. 아래 방안을 적용해 이 문제를 완화하세요.

- `req.session.save()` 호출 및 완료 대기: `req.login()` 후 `req.session.save()`를 호출하고 콜백이 완료될 때까지 기다린 뒤에 `LoginService.execute()`를 호출합니다. 이렇게 하면 세션 스토어에 사용자 정보가 확실히 기록된 상태에서 DB 세션을 생성할 수 있습니다.

- 저장 실패에 대한 재시도/실패 정책: `save()`가 실패할 경우 즉시 로그인 성공으로 처리하지 말고 최대 1회 재시도하거나, 실패 시 로그인 프로세스를 중단하고 오류로 응답하는 것을 권장합니다(보안상 안전).

- 세션 저장 보장 코드 예시 (재시도 1회):

```ts
async function saveSessionWithRetry(req: Request, attempts = 2) {
  let lastErr: any = null;
  while (attempts-- > 0) {
    try {
      if (req.session && typeof req.session.save === 'function') {
        await new Promise<void>((resolve, reject) =>
          req.session.save((err) => (err ? reject(err) : resolve())),
        );
      }
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}
```

- 세션 스토어(예: Redis) 설정 점검: 복제/지연이 있는 환경이면 세션 쓰기 지연이 발생할 수 있으므로 Redis 연결·replication 설정과 네트워크 레이턴시를 점검하세요.

- 멀티 인스턴스 고려: 세션이 여러 인스턴스에서 공유될 때는 세션 key prefix(`sess:` vs `admin-sess:`)와 쿠키 설정(`domain`, `path`, `secure`, `sameSite`)이 모든 인스턴스에서 일관되게 적용되어야 합니다.

- 대안(선택): 세션 쿠키에 의존하지 않고 로그인 시 임시 토큰(ID)을 발급하여 DB 세션과 매핑하는 방법도 검토할 수 있습니다. 이 방식은 더 큰 설계 변경을 요구하므로 우선은 `save()` 기반 방식 적용을 권장합니다.


## 4. 변경 목표
1. 로그인 성공 직전에(또는 직후) 반드시 `req.session.regenerate()`를 호출하여 새로운 sessionId를 발급한다.
2. `req.login()` 호출 후 `req.session.save()`로 세션 저장을 보장한다.
3. `LoginService.execute()`에 전달되는 `sessionId`가 항상 최신의 `req.sessionID`가 되도록 보장한다.
4. `regenerate()` 실패 시 로그인 프로세스를 중단하고 적절히 로그/에러 처리한다.

## 5. 구체 구현안 (컨트롤러 변경)

변경 포인트: `user-auth.controller.ts` 및 `admin-auth.controller.ts`의 `login` 메서드.

권장 코드 흐름(의사 코드):

```ts
// 1) 인증 수행
const authenticatedUser = await this.authenticateIdentityService.execute({...});

// 2) 세션 재생성
if (req.session && typeof req.session.regenerate === 'function') {
  await new Promise<void>((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve())),
  );
} else {
  // req.session이 없으면 환경을 점검하도록 로그 남기기
}

// 3) passport login
await new Promise<void>((resolve, reject) =>
  req.login(authenticatedUser as any, (err) => (err ? reject(err) : resolve())),
);

// 4) 명시적 세션 저장 보장
if (req.session && typeof req.session.save === 'function') {
  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve())),
  );
}

// 5) DB 세션 생성(항상 최신 req.sessionID 사용)
await this.loginService.execute({
  user: authenticatedUser,
  clientInfo,
  sessionId: req.sessionID,
  isAdmin: false,
});
```

주의 사항:
- `regenerate()` 실패 시 예외를 던져 로그인 흐름을 중단하는 것이 안전함(기존 세션이 공격자에 의해 고정된 상태로 남는 것을 방지).
- `req.session`이 undefined일 수 있는 테스트/특수 환경을 대비해 방어 코드 포함.

## 6. 에러 처리 권장 정책
- `regenerate()` 에러: 로그 남기고 `500 Internal Server Error` 또는 명시적 인증 실패로 처리. (보안상 기존 세션 사용은 금지)
- `login()` 에러: 현재 코드처럼 클라이언트에 에러 전달(401 등) 후 종료.
- `save()` 실패: 로그 에러 기록, 필요 시 알림. DB 세션 생성 전 `save()` 성공을 보장하지 못하면 race 조건 발생 가능하므로 가능한 경우 재시도(최대 1회) 또는 에러 반환 권장.

// 테스트는 일단 여기서 고려 안한다. 
## 7. 테스트 계획 (통합 테스트 권장)
1. 정상 시나리오
  - 로그인 전/후의 `req.sessionID`가 변하는지 확인.
  - 응답 후 Redis에 저장된 세션의 `passport.user`와 DB `user_session`의 `sessionId`가 일치하는지 확인.
2. 세션 픽스테이션 시나리오
  - 공격자가 임의의 sessionId를 쿠키에 넣은 후 피해자가 로그인했을 때, DB에 저장되는 sessionId가 공격자가 준 값이 아닌지 검증.
3. 실패 경로
  - `regenerate()`가 실패했을 때 로그인 요청이 실패하도록 동작하는지 확인.
4. 동시성/다중 인스턴스
  - 세션 저장이 race 없이 반영되는지(즉시 Redis/DB에서 조회 가능) 확인.

테스트 환경: CI에서 Redis(또는 redis-mock)와 테스트용 DB가 필요하며, e2e 테스트로 시나리오를 구성 권장.

## 8. 작업 체크리스트 (PR 준비 포함)
- [ ] `user-auth.controller.ts`에 `regenerate()`/`save()` 로직 추가
- [ ] `admin-auth.controller.ts`에 동일 로직 추가
- [ ] 단위/통합 테스트 작성: 정상/공격/실패 케이스
- [ ] `IMPLEMENTATION_PLAN.md`에 변경사항 요약(이미 반영됨)
- [ ] 코드 형식 맞춤 및 lint 통과
- [ ] 로컬에서 Redis 연결 후 e2e 테스트 수행
- [ ] PR 생성: 브랜치 `feat/auth/session-regenerate` → `origin/feat/auth/session-regenerate`

## 9. PR 설명(템플릿 제안)
- 제목: feat(auth): regenerate session on login (prevent fixation)
- 내용 요약:
  - 로그인 시 `req.session.regenerate()` 호출 및 `req.session.save()` 추가
  - 로그인 성공 시 `LoginService`에 새 `req.sessionID` 전달 보장
  - 실패 경로 처리 및 테스트 추가

---

문서 작성자: GitHub Copilot (도움말: 구현 원하시면 바로 패치를 적용해 드립니다.)
