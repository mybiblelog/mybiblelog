---
dateModified: "2026-11-20"
seo:
  title: "My Bible Log에서 AI 에이전트 사용하기: API 설정 가이드"
  description: "AI 에이전트나 직접 만든 스크립트를 My Bible Log의 공개 API에 연결해 성경 읽기를 기록하고, 노트를 작성하고, 태그를 정리하세요. JHN.3.16 같은 구절 표기를 사용합니다."
og:
  title: "My Bible Log에서 AI 에이전트 사용하기: API 설정 가이드"
  description: "AI 에이전트나 직접 만든 스크립트를 My Bible Log의 공개 API에 연결해 성경 읽기를 기록하고, 노트를 작성하고, 태그를 정리하세요. JHN.3.16 같은 구절 표기를 사용합니다."
---

# My Bible Log에서 AI 에이전트 사용하기

My Bible Log에서 할 수 있는 모든 작업은 공개 API로도 할 수 있습니다. 즉, AI 에이전트나 에이전트의 도움을 받아 작성한 스크립트가 여러분 대신 읽기를 기록하고, 노트를 작성하고, 태그를 관리할 수 있습니다.

이 페이지에는 에이전트가 시작하는 데 필요한 몇 가지 정보가 담겨 있습니다. 에이전트에게 이 페이지와 아래의 API 레퍼런스를 알려 주세요.

## API 레퍼런스

* **OpenAPI 명세 (JSON):** [mybiblelog.com/api/openapi.json](https://www.mybiblelog.com/api/openapi.json)
* **기본 URL:** `https://www.mybiblelog.com/api`

대부분의 에이전트는 OpenAPI 명세를 직접 읽고 모든 엔드포인트를 파악할 수 있습니다.

## 익숙한 구절 표기

구절은 YouVersion과 Bible.com에서 쓰는 형식의 짧은 표기로 적습니다. 따라서 에이전트가 My Bible Log의 내부 절 번호를 다룰 필요가 없습니다.

| 구절 | 표기 |
| --- | --- |
| 창세기 | `GEN` |
| 시편 23편 | `PSA.23` |
| 창세기 1-3장 | `GEN.1-3` |
| 요한복음 3:16-18 | `JHN.3.16-18` |
| 창세기 1:1 - 2:3 | `GEN.1.1-2.3` |

하나의 구절은 한 권의 책 안에서만 지정합니다. 장과 절 번호는 NASB 같은 영어 성경을 따르므로 말라기는 4장입니다.

응답에는 내부 절 번호와 함께 같은 표기가 `passage` 필드에 들어 있습니다.

## 로그인

모든 요청에는 로그인 토큰이 필요하며, 헤더로 보냅니다.

```
Authorization: Bearer <token>
```

이메일과 비밀번호로 로그인해 토큰을 받으세요.

```bash
curl -X POST https://www.mybiblelog.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "your-password"}'
```

토큰은 응답의 `data.token`에 있으며 30일 동안 유효합니다.

* **Google로 가입하셨나요?** 먼저 **설정 → 이메일 변경**에서 비밀번호를 만드세요.
* **비밀번호는 혼자만 알고 계세요.** 직접 로그인한 뒤 에이전트에게는 토큰만 주세요.
* **토큰을 비밀번호처럼 다루세요.** 토큰으로 계정 삭제를 포함해 계정의 모든 작업을 할 수 있습니다.
* **토큰을 취소하려면** 설정에서 **모든 세션 로그아웃**을 사용하거나 비밀번호를 변경하세요.

## 자주 하는 작업

| 작업 | 요청 | 본문 |
| --- | --- | --- |
| 읽기 기록 | `POST /log-entries` | `{"date": "2026-11-11", "passage": "JHN.3"}` |
| 읽기 기록 목록 | `GET /log-entries` | |
| 노트 작성 | `POST /passage-notes` | `{"content": "…", "passages": ["JHN.3.16-18"], "tags": ["<tag id>"]}` |
| 구절의 노트 찾기 | `GET /passage-notes?filterPassage=JHN.3` | |
| 태그 만들기 | `POST /passage-note-tags` | `{"label": "기도", "color": "#3a7bd5"}` |
| 태그 목록 | `GET /passage-note-tags` | |
| 설정 읽기 | `GET /settings` | |

날짜는 여러분의 시간대 기준으로 `YYYY-MM-DD` 형식으로 적습니다. 예를 들어 오늘 요한복음 3장을 읽었다고 기록하려면 다음과 같이 합니다.

```bash
curl -X POST https://www.mybiblelog.com/api/log-entries \
  -H "Authorization: Bearer $MBL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-11-11", "passage": "JHN.3"}'
```

## 에이전트를 위한 팁

* **유효성 검사 오류는 구체적입니다.** `400` 응답에는 실패한 각 필드와 그 이유가 나와 있어, 에이전트가 요청을 고쳐 다시 시도할 수 있습니다.
* **대량 변경 전에 백업하세요.** 에이전트가 여러 항목을 한꺼번에 수정하거나 삭제하게 하기 전에 **설정 → 내보내기**에서 데이터를 내려받으세요.
* **로그인 횟수는 제한됩니다.** 요청할 때마다 로그인하지 말고 토큰 하나를 재사용하세요.
