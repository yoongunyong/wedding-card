# 💍 모바일 청첩장 프로젝트 인수인계 현황 (PROJECT_STATUS.md)

> **최종 업데이트 일시**: 2026-10-16  
> **프로젝트 경로**: `c:\Users\YOONGUNYONG\wedding-card`  
> **핵심 프레임워크**: Next.js 16 (App Router, Turbopack) / Tailwind CSS / Supabase (PostgreSQL)  
> **새 세션 시작 가이드**: 다른 PC나 새 채팅 세션에서 **"PROJECT_STATUS.md 읽고 이어서 작업하자"**라고 말씀하시면 AI가 이 문서의 모든 맥락을 즉시 파악하고 작업을 이어갑니다.

---

## 1. 프로젝트 핵심 운영 원칙 (절대 준수)

1. **하객 화면에 가짜/샘플 데이터 노출 절대 금지 (최우선 철칙)**:
   - 실제 고객 청첩장(`/[slug]`)에서는 고객이 미입력한 항목(초대 문구, 호칭, 부모님 성함 등)에 대해 타인의 정보나 샘플 텍스트가 절대 노출되어서는 안 됩니다.
   - 정보가 없으면 공백(`''`) 또는 안전하게 해당 영역이 미노출(숨김) 처리되어야 합니다.
   - 단, 공식 데모 페이지(`slug: 'cinematic'`, `slug: 'scene'` 등) 또는 제작 중 실시간 미리보기 모달에서만 fallback 예시를 보여줍니다.
2. **AI의 Git Commit / Push 직접 실행 금지**:
   - 변경 사항에 대한 커밋 및 푸시는 사용자가 직접 검토 후 실행할 수 있도록 명령어 및 커밋 메시지를 텍스트로 안내합니다.
3. **언어 정책**:
   - 모든 대화와 주석 및 안내는 한국어로 명확하게 작성합니다.

---

## 2. 시안 1~5 템플릿 상세 명세 및 핵심 차이점

| 구분 | 시안 1 (모던 클래식) | 시안 2 (에디토리얼) | 시안 3 (플레이리스트) | 시안 4 (시네마틱) | 시안 5 (모던 씬) |
|---|---|---|---|---|---|
| **영문 키** | `basic` | `editorial` | `playlist` | `cinematic` | `scene` |
| **디자인 컨셉** | 편지 봉투 오프닝 & 정갈한 크림 베이지 | 패션 매거진 룩북 인트로 & 세리프 타이포 | 포레스트 그린 & 빈티지 폴라로이드 LP | ☀️Day / 🌙Night 듀얼 테마 & 모노크롬 화보 | 영상 1:1 일치, 우아한 모던 클래식 & 3열 캘린더 |
| **프로필 사진** | 커플 사진 1장 (`couple_profile`) | 커플 사진 1장 (`couple_profile`) | 폴라로이드 커플 사진 1장 | 와이드 커플 사진 + **신랑/신부 독사진** | **신랑 & 신부 2단 정사각 독사진 (`groom/bride_profile`)** |
| **인터뷰 (Q&A)** | X | X | X | X | **O (`interviews` 모달 문답 스토리)** |
| **참석 여부 (RSVP)** | 모달 (신랑측/신부측, 참석/불참) | 모달 (신랑측/신부측, 참석/불참) | 모달 (참석/불참) | 모달 (참석/불참) | **인페이지 RSVP (식사 3옵션 + 전세버스 탑승 2옵션)** |
| **갤러리 구조** | 단일 슬라이드 | 단일 그리드 모달 | 단일 뷰어 | **[OUR STORY] + [WEDDING PHOTO] 2개 탭 분리** | 와이드 2장 + 하단 무여백(no-gap) 100% 매거진 타일 그리드 |
| **기타 특화** | 감성 영화 대사 / 글귀 | 영문 세리프 네임 플레이트 | 바이닐 LP 회전 및 뮤직 플레이어 연동 | 상단 CELEBRATE 16:9 와이드 & 흑백 인물 스냅 | 오프닝 단계별 페이드인 시퀀스, 캘린더 2바퀴 손스케치 애니메이션 |

---

## 3. 데이터베이스 (Supabase PostgreSQL) 스키마 검증 완료 현황

현재 DB는 5종의 모든 시안을 100% 포용할 수 있도록 스키마 검증이 완료되었습니다.

1. **`invitations` 테이블 (47개 컬럼)**:
   - 기본 인적사항: `slug`, `groom_name`, `bride_name`, `wedding_date`, `venue_name`, `venue_address`, `venue_hall`, `venue_detail`, `message`
   - 영문 타이포: `groom_name_en`, `bride_name_en`, `groom_first_name_en`, `groom_last_name_en`, `bride_first_name_en`, `bride_last_name_en`, `main_names_en`
   - 가족/호칭: `groom_relation`, `bride_relation`, `groom_father_deceased`, `groom_mother_deceased`, `bride_father_deceased`, `bride_mother_deceased`
   - 멀티미디어 & 동적 설정:
     - `images` (`jsonb`): `main`, `cover`, `couple_profile`, `ending`, `groom_profile`, `bride_profile`
     - `gallery_images` (`jsonb`): 갤러리 이미지 URL 배열 (최대 20장)
     - `accounts` (`jsonb`): 신랑측/신부측 다중 계좌 목록
     - `transportation` (`jsonb`): 대중교통/주차 안내 목록
     - `info_notices` (`jsonb`): 포토부스, 전세버스 등 안내 카드
     - `interviews` (`jsonb`, 55번 컬럼): 신랑 & 신부 문답 Q&A 배열 (시안 5)
     - `template_config` (`jsonb`): `title_color`, `show_rsvp_bus`, 섹션별 노출 ON/OFF 제어
   - 서비스 활성화: `is_active`, `order_code` (스마트스토어 코드), `service_expired_at` (1년 만료일)

2. **`rsvp` 테이블 (11개 컬럼)**:
   - `id`, `invitation_id`, `created_at`
   - `side` ('groom' | 'bride'), `name`, `phone`, `attend` (boolean), `companion_count` (동행 인원)
   - **`meal`** (`text`): 시안 5 식사 여부 ('식사 가능' | '식사 불가' | '미정')
   - **`bus`** (`text`): 시안 5 전세버스 탑승 여부 ('탑승' | '미탑승')
   - `memo` (`text`)

3. **`guestbook` 테이블 (6개 컬럼)**:
   - `id`, `invitation_id`, `created_at`, `author`, `password`, `content`
   - *(주의: `name`, `message` 컬럼은 없으며 `author`, `content`로 정확히 매핑됨)*

4. **`order_codes` 테이블 (8개 컬럼)**:
   - `code`, `is_used`, `used_by_slug`, `used_at`, `type`, `note`, `created_at`

---

## 4. 최근 완료된 핵심 작업 내역 (2026-10-16)

1. **시안 5 (Scene) 완성도 극대화**:
   - 갤러리: 이미지 간 여백(`gap`)을 완전히 제거(`gap-0`, no-gap)하고 가로폭 100% 매거진 타일 그리드 적용.
   - 계좌번호: 아코디언 열림/닫힘 화살표를 부드러운 라운드 SVG Chevron 아이콘으로 교체.
   - 방명록: 하객 본인이 등록 시 설정한 비밀번호로 즉시 삭제할 수 있는 `SceneGuestbookDeleteModal.jsx` 구현.
   - 캘린더: 시안 영상과 1:1 일치하는 빨간색 2바퀴 손스케치 드로잉 애니메이션 및 반투명 밀크 글래스 격자 배경 일치화.
2. **시안별 입력 폼 (`create`, `edit`) 동적 대응 및 안전성 보강**:
   - **전세버스 옵션 (`show_rsvp_bus`)**: 세부 설정에 전세버스 참석 조사 토글 체크박스를 신설하여, 버스를 대절하지 않는 고객에게 엉뚱하게 전세버스 질문이 나가지 않도록 조치.
   - **인터뷰 Q&A 더미 데이터 누출 차단**: 폼 초기값을 빈 배열(`[]`)로 시작하게 하고, 원클릭 `[✨ 추천 질문 3종 불러오기]` 기능 제공(답변은 빈칸). 미작성 시 DB에 가짜 문답 저장을 차단하고 하객 화면에서 인터뷰 버튼 자동 숨김 처리.
   - **신랑/신부 독사진 미등록 시 메인 사진 복제 버그 해결**: 개별 사진이 없을 때 메인 사진 2장이 나란히 복제되던 현상을 방지하고, 미등록 시 사진 없이 단정한 성함 그리드로 단정하게 렌더링되도록 수정.
   - **시안 4 갤러리 안내 가이드**: 앞쪽 절반은 [OUR STORY], 뒤쪽 절반은 [WEDDING PHOTO] 탭에 전시된다는 안내 배지 추가.
3. **DB 정합성 보정**:
   - `SceneTemplate.jsx`의 방명록 insert 쿼리에서 미존재 컬럼(`name`, `message`)을 제거하고 `author`, `content`, `password`로 일치화하여 DB 등록 오류 해결.
4. **시안 1 (모던 클래식) 공식 샘플 데이터 시딩 및 링크 정상화 (2026-10-19)**:
   - 랜딩 페이지(`app/page.js`)에서 시안 1의 미리보기 주소가 실제 고객 슬러그(`/kkeomuk`)로 연결되어 있던 심각한 문제를 발견하여 즉시 차단.
   - DB에 시안 1 공식 가상 샘플 청첩장(`slug: 'basic'`, 신랑 이도현 ♥ 신부 임지연)을 신규 등록.
   - `app/page.js`의 `previewUrl`을 `/basic`으로 교체하여 개인정보 유출 방지 및 공식 샘플 체험 정상화 완료.
5. **전체 소스코드 전수 정밀 감사 및 시안 3 (Playlist) 방명록 결함 해결**:
   - `PlaylistTemplate.jsx`에서 `guestbook` 테이블에 존재하지 않는 `slug`로 조회/갱신하던 쿼리를 `invitation_id` 매핑으로 수정.
   - 렌더링 필드명(`message`, `name` ➔ `content`, `author`) 및 삭제 모달 prop(`targetItem` ➔ `targetMsg`) 일치화로 방명록 등록/조회/삭제 기능 완벽 정상화.
7. **시안 3·4·5 BGM 및 테마 UI 일치화 & 동기화 완료 (2026-10-19)**:
   - **시안 3 (플레이리스트)**: 본문 플레이어 바와 상단 플로팅 BGM 버튼 간 중복 노출을 해결하기 위해, 첫 화면에서는 상단 버튼을 자동 숨김 처리하고 스크롤 시 부드럽게 페이드인되도록 개선. 네이티브 오디오 이벤트(`onPlay`, `onPause`, `timeupdate`) 기반으로 두 플레이어 간 0초 무지연 실시간 양방향 동기화 구현.
   - **시안 4 (시네마틱)**: 우측 상단에서 BGM 아이콘과 100% 포개져 겹치던 테마 변경 버튼(`Brightly | Midnight`)을 좌측 상단(`fixed left-5`)으로 이동하여 좌우 완벽한 대칭 레이아웃 달성 및 겹침 버그 완전 해소.
   - **시안 5 (모던 씬)**: 좌측 상단에 혼자 별개의 재생/정지 아이콘으로 분리되어 있던 것을 다른 모든 시안과 100% 동일한 우측 상단 프리미엄 원형 블랙 이퀄라이저 파동 버튼으로 통일.
8. **RSVP(참석 의사 전달) 중복 방지(Upsert) 및 관리자 삭제 기능 적용 (2026-10-19)**:
   - **전 시안(1~5) 동일 입력 통일**: 모든 템플릿(시안 1~5)에서 예외 없이 **'성함'**과 **'휴대전화 번호 뒤 4자리(숫자 4자리 고정)'**를 동일하게 입력받도록 표준화.
   - **하객 재제출 시 덮어쓰기 (방안 1)**: 하객이 동일한 청첩장에서 동일한 성함과 휴대전화 뒤 4자리로 참석 의사를 다시 제출하면 새 Row를 생성하지 않고 기존 데이터를 최신 내용(참석/불참, 인원, 식사, 버스)으로 덮어쓰기(`UPDATE`)하여 총 참석 인원 및 식대 통계 왜곡을 원천 방지.
   - **관리자 RSVP 개별 삭제 (방안 2)**: 신랑/신부 관리자 페이지(`/manage/[slug]`) 하객 응답 테이블에 [삭제] 버튼을 신설하여, 불필요하거나 잘못 입력된 참석 정보를 즉시 삭제할 수 있도록 구현.
   - **DB 정책 스크립트**: Supabase RLS 정책(`scripts/setup-rsvp-rls.sql`) 생성.
9. **빌드 검증**:
   - `npm run build` 성공 (0 error).

---

## 5. 주요 파일 경로 모음

- **템플릿 컴포넌트**:
  - `components/templates/basic/BasicTemplate.jsx` (시안 1)
  - `components/templates/editorial/EditorialTemplate.jsx` (시안 2)
  - `components/templates/playlist/PlaylistTemplate.jsx` (시안 3)
  - `components/templates/cinematic/CinematicTemplate.jsx` (시안 4)
  - `components/templates/scene/SceneTemplate.jsx` (시안 5)
- **RSVP 모달 및 폼**:
  - `components/templates/basic/BasicRsvpModal.jsx` (시안 1 RSVP 모달)
  - `components/templates/editorial/EditorialRsvpModal.jsx` (시안 2, 3, 4 RSVP 모달)
  - `components/templates/scene/SceneTemplate.jsx` (시안 5 인페이지 RSVP)
- **신청 및 관리 화면**:
  - `app/create/page.js` (최초 제작 신청 페이지)
  - `app/manage/[slug]/edit/page.js` (청첩장 수정 및 시안 변경 페이지)
  - `app/manage/[slug]/page.js` (하객 명단 RSVP 관리, 개별 삭제, 엑셀 CSV 다운로드)
  - `app/[slug]/page.js` (하객 열람용 메인 청첩장 라우터)
- **공통 컴포넌트 & 유틸**:
  - `lib/supabase.js` (Supabase 클라이언트)
  - `lib/imageCompressor.js` (이미지 압축)
  - `components/BgmPlayer.jsx` (전역 배경음악 제어기)
  - `scripts/setup-rsvp-rls.sql` (RSVP UPDATE/DELETE RLS 정책 SQL)
