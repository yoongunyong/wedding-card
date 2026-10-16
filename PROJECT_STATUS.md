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
4. **빌드 검증**:
   - `npm run build` 성공 (0 error).

---

## 5. 주요 파일 경로 모음

- **템플릿 컴포넌트**:
  - `components/templates/basic/BasicTemplate.jsx` (시안 1)
  - `components/templates/editorial/EditorialTemplate.jsx` (시안 2)
  - `components/templates/playlist/PlaylistTemplate.jsx` (시안 3)
  - `components/templates/cinematic/CinematicTemplate.jsx` (시안 4)
  - `components/templates/scene/SceneTemplate.jsx` (시안 5)
- **신청 및 관리 화면**:
  - `app/create/page.js` (최초 제작 신청 페이지)
  - `app/manage/[slug]/edit/page.js` (청첩장 수정 및 시안 변경 페이지)
  - `app/manage/[slug]/page.js` (하객 명단 RSVP 관리 및 엑셀 CSV 다운로드)
  - `app/[slug]/page.js` (하객 열람용 메인 청첩장 라우터)
- **공통 컴포넌트 & 유틸**:
  - `lib/supabase.js` (Supabase 클라이언트)
  - `lib/imageCompressor.js` (이미지 압축)
  - `components/BgmPlayer.jsx` (전역 배경음악 제어기)
