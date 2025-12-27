# Affiliate Core Module

## 목적
어플리에이트의 레퍼럴 링크 생성·관리 및 추천 관계(Referral) 매핑을 담당하는 핵심 모듈

## 주요 기능
- 어플리에이트 전용 레퍼럴 링크 최대 20개 생성/관리
- Sub-ID 기반 채널 트래킹 지원 (?sub=youtube 등)
- 추천인-피추천인 관계 기록 (30일 쿠키 유효 기간)
- 셀프 추천 방지 로직 (IP/Device Fingerprint)

## 엔티티
- AffiliateLink
  - userId (affiliate)
  - code (unique)
  - label
  - isActive
  - createdAt
- Referral
  - affiliateId
  - linkId
  - subUserId (referred player)
  - subId (optional channel tag)
  - joinedAt
  - cookieExpires (joinedAt + 30 days)

## API (AffiliateCoreController)
| Method | Endpoint                          | 설명                          |
|--------|-----------------------------------|-------------------------------|
| GET    | /affiliate/links                  | 내 링크 목록 조회 (n/20 표시)  |
| POST   | /affiliate/links                  | 새 링크 생성 (20개 제한 체크) |
| PATCH  | /affiliate/links/:id              | 라벨 수정                     |
| DELETE | /affiliate/links/:id              | 링크 삭제 및 무효화           |