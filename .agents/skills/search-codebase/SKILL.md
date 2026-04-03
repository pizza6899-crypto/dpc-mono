---
name: search-codebase
description: "ripgrep(rg) 기반 코드베이스 검색 스킬. USE FOR: 파일 내용 텍스트 검색, 파일 목록 탐색, 패턴 기반 코드 탐색, 심볼·함수·클래스 위치 파악, 대규모 코드베이스 고속 검색. DO NOT USE FOR: 파일 메타데이터(권한, 시간) 조건 검색(find 사용), 파일 내용 수정(sed/awk 사용)."
argument-hint: "검색 대상 패턴 또는 검색 시나리오를 설명"
---

# ripgrep(rg) 코드베이스 검색 — Korean / English (bilingual)

## 개요 (Korean)

ripgrep(`rg`)은 파일 내용을 재귀적으로 검색하는 초고속 도구입니다. 기본적으로 `.gitignore`를 존중하고 숨김/바이너리 파일을 제외합니다. PCRE2 지원과 멀티라인 검색, 파일 타입 필터링 등 다양한 기능을 제공합니다.

## Overview (English)

ripgrep (`rg`) is a fast recursive search tool for file contents. It respects `.gitignore` by default, skips hidden and binary files, and supports PCRE2, multiline search, and file-type filtering.

## 핵심 원칙 (Korean)

1. **rg는 내용 검색 도구** — `find`(파일 속성 검색)와 혼동하지 마세요.
2. **기본 동작이 이미 최적화됨** — `.gitignore` 준수, hidden/binary 파일 제외.
3. **정규식이 기본** — 리터럴 검색 시 `-F` 플래그 사용.
4. **출력을 파이프로 조합** — `rg ... | head`, `rg ... | wc -l` 등 유닉스 철학 활용.

## Principles (English)

1. `rg` is a content search tool — don't use it for metadata searches (use `find`).
2. Defaults are optimized: respects `.gitignore`, skips hidden/binary files.
3. Regex is default; use `-F` for fixed-string (literal) searches.
4. Combine with pipes for further processing: `rg ... | head`, `rg ... | wc -l`.

## 검색 패턴 레시피

### 1. 기본 텍스트 검색

```bash
# 현재 디렉토리 재귀 검색
rg 'searchPattern'

# 특정 디렉토리만 검색
rg 'searchPattern' src/modules/

# 대소문자 무시
rg -i 'searchPattern'

# 스마트 케이스 (패턴에 대문자 있으면 case-sensitive, 없으면 ignore)
rg -S 'searchpattern'

# 리터럴 문자열 (정규식 비활성화)
rg -F 'exact.string(here)'
```

### 2. 파일 타입 필터링

```bash
# 특정 타입만 검색
rg 'pattern' -t ts          # TypeScript 파일만
rg 'pattern' -t py          # Python 파일만

# 특정 타입 제외
rg 'pattern' -T js          # JavaScript 제외

# glob 패턴으로 필터
rg 'pattern' -g '*.dto.ts'           # DTO 파일만
rg 'pattern' -g '!*.spec.ts'         # 테스트 파일 제외
rg 'pattern' -g '*.{ts,js}'          # 복수 확장자

# 커스텀 타입 정의
rg 'pattern' --type-add 'web:*.{html,css,js,ts}' -t web
```

### 3. 파일 목록 탐색 (`find` 대체)

```bash
# 파일 목록만 출력 (내용 검색 없이)
rg --files

# 특정 디렉토리의 파일 목록
rg --files src/modules/

# 파일 이름으로 필터링
rg --files | rg 'dto.*response'
rg --files -g '*.prisma'

# 매칭 파일 경로만 출력 (내용 검색 후)
rg -l 'className'           # 매칭된 파일 경로만
rg -l 'className' -g '*.ts' # TS 파일 중 매칭된 것만
```

### 4. 정규식 고급 패턴

```bash
# 단어 경계 매칭
rg -w 'User'                # User만, UserService는 제외

# 멀티라인 매칭
rg -U 'class \w+.*\{[\s\S]*?constructor'

# OR 패턴
rg 'import|export|require'

# 캡처 그룹 + 치환 (출력만, 파일 미수정)
rg 'version:\s*"(\d+\.\d+)"' -r 'v$1'

# PCRE2 (look-around, backreference)
rg -P '(?<=@Injectable\(\))[\s\S]*?class \w+'
```

### 5. 컨텍스트 및 출력 제어

```bash
# 매칭 전후 N줄 컨텍스트
rg 'pattern' -C 3           # 전후 3줄
rg 'pattern' -B 2           # 이전 2줄
rg 'pattern' -A 5           # 이후 5줄

# 매칭 개수만
rg -c 'TODO'                # 파일별 매칭 수
rg -c 'TODO' --sort-files   # 정렬된 결과

# 매칭 부분만 출력
rg -o '\d{4}-\d{2}-\d{2}'   # 날짜 패턴만 추출

# JSON 출력 (프로그래밍 연동)
rg --json 'pattern'

# 줄번호 없이 출력
rg -N 'pattern'

# 파일명 없이 출력
rg -I 'pattern'

# 최대 결과 수 제한
rg 'pattern' -m 5           # 파일당 최대 5개 매칭
```

### 6. 숨김/무시 파일 포함 검색

```bash
# .gitignore 무시
rg -u 'pattern'             # --no-ignore

# .gitignore 무시 + hidden 파일 포함
rg -uu 'pattern'            # --no-ignore --hidden

# 모든 필터 해제 (binary 포함)
rg -uuu 'pattern'           # --no-ignore --hidden --text

# 특정 ignore 파일만 해제
rg --no-ignore-vcs 'pattern'
```

## 실전 시나리오

### 시나리오 A: 특정 클래스/함수 정의 위치 찾기

```bash
rg 'class UserService' -t ts -l
rg 'export (class|interface|enum) User' -t ts
rg -w 'createUser' -t ts -g '!*.spec.ts' -g '!*.test.ts'
```

### 시나리오 B: 모듈 의존관계 파악

```bash
rg "from '.*user.*'" -t ts -g '!node_modules'
rg "import.*UserModule" -t ts -l
```

### 시나리오 C: TODO/FIXME 현황 파악

```bash
rg 'TODO|FIXME|HACK|XXX' -t ts -c --sort-files
rg 'TODO|FIXME' -t ts -C 1 --heading
```

### 시나리오 D: API 엔드포인트 탐색

```bash
rg "@(Get|Post|Put|Patch|Delete)\(" -t ts -A 1
rg "router\.(get|post|put|delete)\(" -t ts
```

### 시나리오 E: 데이터베이스 스키마/모델 검색

```bash
rg 'model \w+' -g '*.prisma'
rg 'CREATE TABLE|ALTER TABLE' -g '*.sql'
```

## 주요 플래그 빠른 참조

| 플래그 | 축약 | 설명 |
|--------|------|------|
| `--ignore-case` | `-i` | 대소문자 무시 |
| `--smart-case` | `-S` | 스마트 케이스 |
| `--fixed-strings` | `-F` | 리터럴 매칭 (정규식 비활성화) |
| `--word-regexp` | `-w` | 단어 경계 매칭 |
| `--count` | `-c` | 매칭 수만 출력 |
| `--files-with-matches` | `-l` | 매칭 파일 경로만 |
| `--files-without-match` | | 매칭 없는 파일 경로만 |
| `--files` | | 검색 대상 파일 목록 (검색 없이) |
| `--multiline` | `-U` | 멀티라인 매칭 |
| `--pcre2` | `-P` | PCRE2 엔진 사용 (look-around 등) |
| `--glob` | `-g` | glob 필터 |
| `--type` | `-t` | 파일 타입 포함 |
| `--type-not` | `-T` | 파일 타입 제외 |
| `--context` | `-C` | 전후 N줄 컨텍스트 |
| `--before-context` | `-B` | 이전 N줄 |
| `--after-context` | `-A` | 이후 N줄 |
| `--only-matching` | `-o` | 매칭 부분만 출력 |
| `--replace` | `-r` | 출력 치환 (파일 미수정) |
| `--max-count` | `-m` | 파일당 최대 매칭 수 |
| `--max-depth` | | 디렉토리 깊이 제한 |
| `--hidden` | `-.` | 숨김 파일 포함 |
| `--no-ignore` | | ignore 규칙 무시 |
| `--unrestricted` | `-u` | 필터 단계적 해제 (`-u`, `-uu`, `-uuu`) |
| `--sort` | | 정렬 (`path`, `modified`, `accessed`, `created`) |
| `--json` | | JSON 형식 출력 |
| `--debug` | | 디버그 정보 출력 |

## rg vs find vs grep 비교

| 용도 | 추천 도구 | 이유 |
|------|-----------|------|
| 파일 내용 검색 | `rg` | 빠르고 .gitignore 자동 필터링 |
| 파일 목록 빠르게 뽑기 | `rg --files` | .gitignore 자동 적용, 빠름 |
| 파일 메타 조건 검색 (권한, 시간, 크기) | `find` | rg는 메타데이터 조건 미지원 |
| 단일 파일 내 검색 | `rg` 또는 `grep` | 둘 다 OK, rg가 더 빠름 |
| 바이너리 파일 검색 | `rg -uuu` 또는 `grep -a` | rg는 기본 바이너리 제외 |

## 설정 파일 (선택)

`RIPGREP_CONFIG_PATH` 환경변수로 설정 파일 경로를 지정할 수 있다:

```bash
# ~/.ripgreprc
--smart-case
--hidden
--glob=!.git/*
--max-columns=200
--max-columns-preview
```

## 참고 자료

- [ripgrep GitHub](https://github.com/BurntSushi/ripgrep)
- [User Guide](https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md)
- [FAQ](https://github.com/BurntSushi/ripgrep/blob/master/FAQ.md)
- [Regex 문법](https://docs.rs/regex/1/regex/#syntax)
