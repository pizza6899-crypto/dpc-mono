---
name: git-commit-guide
description: Git 커밋 메시지 작성 규칙 및 Conventional Commits 모범 사례 가이드
---

# Git Commit Guide

## Overview
이 스킬은 프로젝트의 코드 정합성과 히스토리 추적을 위해 **Conventional Commits** 규격을 따르는 일관된 Git 커밋 메시지 작성을 돕습니다. 

**가장 중요한 원칙은 모든 커밋 메시지(제목 및 본문)를 반드시 한국어로 작성하는 것입니다.**

## Instructions

### 1. 커밋 메시지 작성 원칙 (CRITICAL)
- **무조건 한글 사용**: 제목(Subject)과 본문(Body)은 반드시 한국어로 작성합니다.
- **명확성**: 코드만 보고 알 수 없는 "왜(Why)"와 "무엇을(What)"에 집중합니다.
- **간결함**: 제목은 50자 이내로 요약하며, 상세한 설명은 본문을 활용합니다.

### 2. 커밋 메시지 구조
```text
<type>(<scope>): <subject>

<body> (선택 사항)
<footer> (선택 사항)
```

### 3. 유형 (Type) 정의
표준적인 Conventional Commits 유형을 따릅니다:
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정 (README, 주석, API 문서 등)
- `style`: 코드 의미에 영향을 주지 않는 변경 (포맷팅, 세미콜론 누락 등)
- `refactor`: 코드 리팩토링 (기능 변화 없이 구조만 개선)
- `perf`: 성능 개선
- `test`: 테스트 코드 추가 및 수정
- `chore`: 빌드 프로세스, 패키지 설정, 스크립트 수정 등
- `revert`: 이전 커밋 되돌리기

### 4. 범위 (Scope)
변경이 발생한 모듈이나 도메인을 명시합니다. (예: `wallet`, `casino`, `auth`, `infra` 등)

### 5. 제목 (Subject) 규격
- **반드시 한글로 작성**합니다.
- 과거 시제가 아닌 **현재 시제**를 사용합니다. (예: `수정했음` -> `수정`, `추가함` -> `추가`)
- 마지막에 마침표(`.`)를 찍지 않습니다.

### 6. 본문 (Body) 및 바닥글 (Footer)
- 변경 사유와 상세 내용을 불렛 포인트(`-`)로 나열합니다.
- 이슈 트래킹이 필요한 경우 바닥글에 `Fixes: #123` 문구를 포함합니다.

## Examples

### 기능 추가 (feat)
```text
feat(wallet): 스노우플레이크 기반 거래 ID 생성 로직 구현

- 분산 환경에서의 ID 충돌 방지를 위해 Snowflake ID 도입
- 기존 Autoincrement ID 필드를 문자열 타입으로 변경 및 마이그레이션
```

### 버그 수정 (fix)
```text
fix(casino): 베팅 처리 시 간헐적으로 발생하는 데드락 현상 수정

- DB 트랜잭션 격리 수준 조정
- 지갑 락 획득 순서를 사용자 ID 순으로 정렬하여 데드락 방지
```

### 리팩토링 (refactor)
```text
refactor(api): 컨트롤러 내 비즈니스 로직을 서비스 레이어로 이관

- 코드 재사용성 향상 및 단위 테스트 작성이 용이하도록 구조 개선
- 불필요한 의존성 제거
```

## References
- [Conventional Commits 공식 가이드 (한글)](https://www.conventionalcommits.org/ko/v1.0.0/)
- [Google Git Commit Message Style Guide](https://github.com/google/styleguide/blob/gh-pages/cppguide.md#Git_Commit_Messages)
