---
name: github-flow-branch-switch
description: "GitHub Flow 기준으로 작업 목적을 분석해 안전한 브랜치명을 만들고, 로컬+원격 브랜치 중복을 사전 강제 검사한 뒤 자동 우회 네이밍(-v2, -fix)으로 브랜치를 생성/스위치하는 스킬. USE FOR: 브랜치 분기, 브랜치 네이밍 검증, 원격 충돌 사전 차단, create+switch 자동화. DO NOT USE FOR: Git Flow release/hotfix 운영, 대규모 브랜치 정리/삭제."
argument-hint: "작업 목적과 변경 파일 목록(또는 확장자)을 설명. 예: 배너모듈 테스트 코드 작성, changed: *.spec.ts"
---

# GitHub Flow Branch Switch

## 목적

작업 목적을 입력받아 GitHub Flow에 맞는 브랜치명을 제안하고, 충돌/모호성/생성 실패를 명확한 원인 메시지와 함께 처리한 뒤 최종적으로 안전하게 브랜치를 생성하거나 기존 브랜치로 스위치한다.

## 언제 사용하나

- 새 작업을 시작하며 브랜치명을 일관되게 만들고 싶을 때
- 같은 이름 브랜치가 이미 있는지 확인하고 싶을 때
- 브랜치 생성 실패 원인을 사용자에게 명확히 전달해야 할 때

## 입력 규칙

- 필수 입력: 작업 목적 (예: "배너모듈 테스트 코드 작성")
- 선택 입력: 작업 타입 (`feat`, `fix`, `test`, `chore`, `refactor`, `docs`)
- 권장 입력: 변경 파일 목록 또는 확장자 요약 (예: `apps/api/src/banner/banner.service.spec.ts`)

### 타입 추론 및 결정 규칙 (강제 지양, 자동 감지 지향)

1. 명시적 지정 우선: 사용자가 타입을 직접 입력하면 해당 값을 최우선으로 사용
2. 변경 파일 기반 자동 감지: 명시 타입이 없을 때 아래 규칙 적용
- `test`: 변경 파일이 테스트 전용일 때 (`.spec.ts`, `.test.ts`, `tests/` 경로)
- `docs`: 변경 파일이 문서 전용일 때 (`.md`, `.txt`, `docs/` 경로)
- `chore`: 설정/환경 파일만 변경될 때 (`package.json`, `pnpm-lock.yaml`, `turbo.json`, `tsconfig*.json`, `.env*`, `eslint*`, `prettier*`, `vitest*`, `jest*`, CI/CD 설정)
- `feat`/`fix`: 그 외 `src/` 로직 파일이 포함되면 작업 목적 키워드를 분석해 판단
3. 판단 불가 시: 가장 안전한 기본값 `feat` 또는 `chore`를 제안하고 사용자 확인 후 확정

## 브랜치 네이밍 규칙 (GitHub Flow)

1. 형식: `<type>/<scope>-<slug>`
  - `scope`는 모노레포 내 앱/패키지 식별자(`api`, `web`, `shared` 등)를 의미합니다.
2. `scope-slug` 규칙:
- 한글/영문 목적 설명을 핵심 키워드 2~5개로 축약
- 소문자 영문, 숫자, 하이픈만 사용
- 공백/특수문자는 하이픈으로 치환
- 연속 하이픈은 1개로 축약
- 앞/뒤 하이픈 제거
3. 길이: 8~48자 권장 (표준 유지)
4. 모호성 금지:
- `temp`, `test`, `work`, `misc`, `update`, `new-branch` 단독 사용 금지
- 목적이 드러나지 않으면 재질문
5. 요약력 규칙:
- 가능한 한 "동사+목적어" 또는 "도메인+행위"로 축약
- 의미 없는 장문 금지 (예: `a-very-long-name-that-explains-nothing`)

예시:
- 목적: "배너모듈 테스트 코드 작성"
- 타입: `test`
- 스코프: `api`(예: apps/api)
- 브랜치: `test/api-banner-module`

또 다른 예시:
- `feat/api-auth-logic` (type=feat, scope=api, slug=auth-logic)
- `chore/shared-prisma-schema` (type=chore, scope=shared, slug=prisma-schema)

## 절차

1. 목적 분석
- 입력 문장에서 대상(무엇) + 행위(무엇을) 추출
- 명시 타입이 없으면 변경 파일 성격으로 자동 감지하고, 애매하면 안전 기본값을 제안 후 확인

### 워킹 디렉토리(Safe Switch) 체크

- 브랜치 전환/생성 전 `git status --porcelain`으로 워킹 디렉토리 상태를 확인합니다.
- 변경사항이 있으면 사용자에게 `git stash` 또는 커밋을 권장합니다.
- 자동화된 흐름에서 임시로 보관하려면 `git stash --include-untracked`를 사용하거나, 수동 병합을 시도하려면 `git switch -m <branch>`를 권장합니다.

권장 메시지 예시:
- `WARN=working directory dirty; run "git stash --include-untracked" or commit your changes before switching.`

2. 이름 후보 생성
- 1순위 후보 1개 + 대안 1개 생성
- 후보가 모호성 금지 단어에 해당하면 탈락

3. 로컬/원격 충돌 검사 (사전 강제)
- 로컬 검사: `git show-ref --verify --quiet refs/heads/<branch>`
- 원격 검사(필수): `git ls-remote --heads origin <branch>`

4. 자동 우회 네이밍
- 로컬 또는 원격에서 동일 이름이 발견되면 `-v2`를 우선 부여해 재검사
- 여전히 충돌이면 `-fix`를 부여해 재검사
- 최대 3회(원본 + -v2 + -fix) 재시도 후에도 충돌이면 실패 처리

5. 실행 분기
- 로컬 브랜치 존재: `git switch <branch>`
- 로컬 미존재: `git switch -c <branch>`

6. 결과 확인
- `git branch --show-current`로 현재 브랜치 검증
- 검증 실패 시 즉시 오류로 보고

## 실패 처리 원칙

오류 메시지는 반드시 "무엇 때문에 실패했는지"를 1문장으로 명시한다.

- 네이밍 실패: "브랜치명이 모호합니다: 목적이 드러나지 않습니다. 예: test/banner-module"
- Git 저장소 아님: "현재 경로가 Git 저장소가 아닙니다. 저장소 루트에서 다시 실행하세요."
- 원격 없음: "origin 원격이 없어 사전 원격 중복 검사를 수행할 수 없습니다. 원격 설정 후 다시 실행하세요."
- 원격 중복 지속: "원격에 동일/유사 브랜치가 계속 존재하여 자동 우회(-v2, -fix) 3회 내 해결되지 않았습니다."
- 권한/잠금 문제: "브랜치 생성 실패: .git 잠금 또는 권한 문제입니다."
- 이미 체크아웃된 작업트리 충돌: 실제 Git 에러 핵심 문구를 포함해 전달

## 권장 실행 스니펫

```bash
set -euo pipefail

# 입력 예시: type=feat, scope=api, slug=auth-logic
type="feat"
scope="api"
slug="auth-logic"
new_branch="${type}/${scope}-${slug}"

exists_local() { git show-ref --verify --quiet "refs/heads/$1"; }
exists_remote() { git ls-remote --heads origin "refs/heads/$1" >/dev/null 2>&1; }

# 워킹 디렉토리 체크
if [ -n "$(git status --porcelain)" ]; then
  echo "WARN=working directory dirty; run 'git stash --include-untracked' or commit your changes before switching." >&2
fi

# 로컬에 이미 존재하면 단순 스위치
if exists_local "$new_branch"; then
  git switch "$new_branch" && echo "STATUS=SWITCHED:$new_branch" && exit 0
fi

# 원격 확인
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "ERROR=origin 원격이 없어 사전 원격 중복 검사를 수행할 수 없습니다." >&2
  exit 1
fi

suffixes=("" "-v2" "-fix")
for s in "${suffixes[@]}"; do
  try="${new_branch}${s}"
  if ! exists_remote "$try"; then
    git switch -c "$try" && echo "STATUS=CREATED:$try" && exit 0
  fi
done

echo "ERROR=원격에 동일/유사 브랜치가 계속 존재하여 자동 우회 실패" >&2
exit 1
```

## 완료 기준

- 목적 기반으로 모호하지 않은 브랜치명 1개가 확정됨
- 동일 이름 브랜치를 로컬+원격에서 사전 검사함
- 중복 시 `-v2`/`-fix` 자동 우회가 수행됨
- 최종 현재 브랜치가 목표 브랜치와 일치함
- 실패 시 원인 중심 오류 메시지를 반환함
