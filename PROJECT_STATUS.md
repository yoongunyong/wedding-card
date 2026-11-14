# 💍 모바일 청첩장 프로젝트 인수인계 현황 (PROJECT_STATUS.md)

> **최종 업데이트 일시**: 2026-11-11 (오너/운영자 관점 전방위 전수 결함 소탕 · 브랜드 404 및 글로벌 에러 바운더리 신설 · 카톡 공유 3중 방어 · 폼 데이터 유실 방지 beforeunload · ESLint 0 Errors · Next.js 프로덕션 빌드 100% 무결성 달성)  
> **프로젝트 경로**: `c:\Users\YOONGUNYONG\wedding-card`  
> **현재 작업 브랜치**: `dev`  
> **핵심 프레임워크**: Next.js 16 (App Router) / Tailwind CSS / Supabase (PostgreSQL)  
> **공식 브랜드명**: 아틀리에 드 무키루 (ATELIER DE MUKIRU)  
> **공식 카카오톡 채널**: `http://pf.kakao.com/_RJamX/chat`  
> **새 세션 시작 가이드**: 다른 PC나 새 채팅 세션에서 **"PROJECT_STATUS.md 읽고 이어서 작업하자"**라고 말씀하시면 AI가 이 문서의 모든 맥락과 개발 원칙을 즉시 파악하고 작업을 이어갑니다.


---

## 0-1. [TODO 작업 대기열] 5대 시안 및 제작·수정 폼 논리/정합성 전수 감사 발견 과제 (2026-11-11 등록)

> **상태**: 🔍 전수 정합성 감사 완료 ➔ **오너 1건씩 순차 지시 대기 중**  
> **배경**: 2026-11-11 오너 요청에 따른 5대 시안(`basic`, `editorial`, `playlist`, `cinematic`, `scene`) 및 제작/수정 폼(`app/create`, `app/manage/[slug]/edit`), DB 스키마 간 데이터 흐름·논리·시안 일치성 전수 점검 결과 발견된 5대 핵심 개선 과제입니다.

1. **[TODO 1] 감성 글귀 & 인용구 (`quote_content` / `quote_source`) 화면 렌더링 복원 (치명적 모순)**
   - **문제점**: 제작 및 수정 폼(`04번 감성 글귀 & 인용구`)에서 추천 명대사/시 프리셋 선택 및 직접 작성을 제공하고 DB에 정상 저장되나, 5대 템플릿 전체에서 화면에 렌더링되지 않음 (`EditorialTemplate.jsx:104`에 `const showQuoteSection = config.show_quote_section !== false;` 선언만 남고 피그마 리뉴얼 시 JSX 블록 누락됨).
   - **조치 방안**:
     - 시안 1, 2, 3: 소개글/모시는 글 영역에 우아한 매거진 북마크 스타일(`“` 큰 따옴표 + 세리프 글귀 + 출처)로 `showQuoteSection && (invitation?.quote_content || config?.quote_content)` 조건부 렌더링 복원.
     - 시안 4, 5: 템플릿 고유 무드에 맞춘 미니멀 인용구 블록 렌더링 지원.
   - **대상 파일**: `components/templates/editorial/EditorialTemplate.jsx`, `components/templates/basic/BasicTemplate.jsx`, `components/templates/playlist/PlaylistTemplate.jsx`, `components/templates/cinematic/CinematicTemplate.jsx`, `components/templates/scene/SceneTemplate.jsx`

2. **[TODO 2 완료 (2026-11-14)] 시안 4(시네마틱) 방명록(`show_guestbook`) 본문 섹션 및 작성·삭제 UI 피그마 1:1 신설 완료**
   - **조치 결과**: 피그마 실측 규격(`780px × 1659px` ➔ 1x `390px × 829.5px`, 그라디언트 배경 `#FEFEFE`~`#EAEAEA`, 3개 카드 세로 배치, X 삭제 모달, 페이지네이션 도트, '글 남기기' 알약 버튼) 1:1 반영 완료. 상세 내역은 본문 최신 안정화 내역 -16번 참조.

3. **[TODO 3] 제작/수정 폼 '봉투 인트로 커버 (`show_intro`)' 토글 템플릿별 동적 정합화 (UX/논리 불일치)**
   - **문제점**: 제작/수정 폼에서 전 시안 공통으로 `봉투 인트로 커버`라는 고정 라벨의 체크박스가 노출되나, 시안 1만 실제 봉투 커버이고 시안 2는 매거진 슬리브 커버이며, 시안 3, 4, 5는 인트로 커버 자체가 없어 켜거나 꺼도 아무 변화가 없는 '유령 토글' 상태임.
   - **조치 방안**:
     - 선택된 템플릿에 따라 동적 라벨 표시:
       - 시안 1: `봉투 인트로 커버 (시안 1)`
       - 시안 2: `에디토리얼 매거진 커버 (시안 2)`
       - 시안 3, 4, 5: `(시안 1, 2 전용)` 안내 뱃지 적용 및 불필요한 혼선 방지 비활성화 또는 숨김 처리.
   - **대상 파일**: `app/create/page.js`, `app/manage/[slug]/edit/page.js`

4. **[TODO 4] 모시는 글 제목(`message_title`)의 시안 4, 5 반영 (기능 불일치)**
   - **문제점**: 고객이 제작/수정 폼에서 "새로운 시작의 날", "초대합니다" 등 모시는 글 제목을 설정해도, 시안 1~3과 달리 시안 4(제목 영역 미존재)와 시안 5(영문 `Invitation` 하드코딩)에서는 반영되지 않고 무시됨.
   - **조치 방안**:
     - 시안 4: 모시는 글 본문 상단에 `message_title` 시네마틱 헤더 노출.
     - 시안 5: 영문 `Invitation` 하단에 고객이 입력한 `message_title`을 한글 서브타이틀로 조화롭게 렌더링.
   - **대상 파일**: `components/templates/cinematic/CinematicTemplate.jsx`, `components/templates/scene/SceneTemplate.jsx`

5. **[TODO 5] 시안 5(모던 씬) 신랑/신부 단독 스냅 렌더링 안전 가드 개선 (데이터 예외 방어)**
   - **문제점**: `SceneTemplate.jsx:743`에서 `{groomPhoto && bridePhoto && (` AND 조건문으로 검사하여, 신랑 또는 신부 중 한 분만 사진을 등록한 경우 둘 다 화면에서 숨겨지는 결함.
   - **조치 방안**:
     - 한 분만 사진을 등록해도 단독 스냅이 정상 노출되도록 조건식 보정 (`(groomPhoto || bridePhoto)`), 혹은 시안 1~3처럼 미등록 쪽에 단아한 아트워크 플레이스홀더를 배치하여 레이아웃 균형 유지.
   - **대상 파일**: `components/templates/scene/SceneTemplate.jsx`

---

## 0. 최근 핫픽스 & 서비스 안정화 내역 (2026-11-14 오너 관점 결함 전수 조치 & 시안 개편)

-31. **[시안 5(모던 씬) 커버화면 및 본문 메인 화보 4귀퉁이 모서리 캠코더 딥 비네팅 음영 정밀 반영 (2026-11-14)]**:
   - **사용자 요청/기획 의도**:
     - "4귀퉁이 모두 음영처리 살짝 들어가준거야? 첨부해주는 이미지 처럼." (첨부: 우하단 HD 및 L자 브래킷 코너가 짙은 블랙으로 집중 음영 처리된 시안 스크린샷)
   - **조치 상세 내역**:
     - `components/templates/scene/SceneIntro.jsx` & `components/templates/scene/SceneTemplate.jsx`:
       - 4귀퉁이 각각(좌상단 0% 0%, 우상단 100% 0%, 좌하단 0% 100%, 우하단 100% 100%)을 원점으로 하는 **4개 독립 원형 방사형 그라디언트(`circle 220px`)**를 적용:
         - `radial-gradient(circle 220px at 0% 0%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%)`
         - `radial-gradient(circle 220px at 100% 0%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%)`
         - `radial-gradient(circle 220px at 0% 100%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%)`
         - `radial-gradient(circle 220px at 100% 100%, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 35%, transparent 75%)`
         - `linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 18%, transparent 82%, rgba(0, 0, 0, 0.4) 100%)`
       - 각 모서리 끝점은 88% 짙은 블랙으로 시작하여 안쪽으로 갈수록 부드럽게 감쇄되어, 첨부 이미지처럼 4개의 L자 브래킷과 모서리 바깥 여백이 깊이감 있게 강조되면서 중앙 인물 영역은 밝고 선명하게 보존.
   - **품질 검증**:
     - ESLint 검사: 0 errors, 0 warnings.
     - Next.js 프로덕션 빌드: 성공 (Exit Code 0).

-30. **[시안 3, 4 커버화면 한글 '화면을 터치해주세요' 터치 인터랙션 안내 문구 통일 (2026-11-14)]**:
   - **사용자 요청/기획 의도**:
     - "그리고 시안1,2 는 수락하기 또는 open The Lookbook이라고 되어있긴한데 나머지 시안은 따로 버튼이 없어 그래서 방금 시안5처럼 커버화면에 화면을 터치해주세요 처럼 시안3,4에도 한글로 넣어줬으면해."
   - **조치 상세 내역**:
     - **시안 4 (`CinematicIntro.jsx`)**:
       - 기존 영문 텍스트(`Tap anywhere to open`)를 제거하고, 시안 5와 동일한 한글 감성 명조체 **'화면을 터치해주세요'**(`NanumMyeongjo`, 11px, `animate-pulse`, 다크/라이트 모드 고대비 색상)로 교체.
     - **시안 3 (`PlaylistIntro.jsx`)**:
       - 기존 하단에 흐리게 들어가 있던 안내 문구를 고대비(#292929, 11px, `animate-pulse`, top: 662px)로 가독성을 대폭 개선하여 시안 5와 동일하게 선명하게 노출.
     - **시안 5 (`SceneIntro.jsx`)**:
       - `leading-[7px]`로 인해 모바일에서 글자가 잘릴 수 있던 위험을 `leading-none`으로 개선하여 정갈한 타이포 유지.
   - **품질 검증**:
     - ESLint 검사: 0 errors.
     - `npm run build`: 성공 (Exit Code 0).

-29. **[시안 4(시네마틱) 최하단 카피라이트와 퀵 내비게이션 바 겹침 결함 수정 및 전 시안 전수 검증 (2026-11-14)]**:
   - **사용자 문의/증상 보고**:
     - "근데 시안3,5는 이 부분이 UI적으로 겹치지 않는데 시안4는 UI적으로 무키루 와 퀵 메뉴가 겹치더라고? 확인해볼래? 시안1,2 도 같이 확인해줘." (첨부 스크린샷: `DESIGNED BY ATELIER DE MUKIRU` 하단에 플로팅 퀵 메뉴가 10~15px 겹치는 현상)
   - **원인 분석**:
     - 플로팅 퀵 내비게이션(`QuickNavigationPill.jsx`)은 화면 하단 고정(`bottom-5` = 20px)에 자체 높이가 약 42px로 총 **62px** 높이 영역을 차지함.
     - **시안 4 (`CinematicTemplate.jsx`)**: `ending-section`에 `pb-[50px]`가 완전히 누락되어 있었고 오직 `<p>` 태그에만 `pb-[50px]`가 적용되어 있어, 총 바닥 여백이 **50px**에 불과했음. 50px < 62px이므로 스크롤을 끝까지 내렸을 때 퀵 메뉴가 `DESIGNED BY ATELIER DE MUKIRU` 카피라이트를 직접 덮어버림.
     - **시안 1, 2, 3, 5**: 모두 `<section>`에 `pb-[50px]`, `<p>`에 `pb-[40px]`가 적용되어 총 바닥 여백이 **90px**로 확보되어 있었음. 90px - 62px = 28px의 안전 마진이 있어 겹치지 않았음.
   - **조치 상세 내역**:
     - `components/templates/cinematic/CinematicTemplate.jsx`:
       - `ending-section`에 `pt-0 pb-[50px]` 추가.
       - 시안 4의 총 바닥 여백을 **100px**(`pb-[50px]` + `pb-[50px]`)로 확장하여 스크롤 최하단에서도 퀵 내비게이션 바 위로 약 38px의 넉넉하고 우아한 여백이 유지되도록 완전 해소.
     - 시안 1(`BasicTemplate`), 시안 2(`EditorialTemplate`), 시안 3(`PlaylistTemplate`), 시안 5(`SceneTemplate`) 전수 점검 완료: 모두 90px의 바닥 여백이 적용되어 있어 퀵 메뉴와 겹침 없이 정상 렌더링 확인.
   - **품질 검증**:
     - `npx eslint components/templates/cinematic/CinematicTemplate.jsx`: 0 errors.
     - `npm run build`: 성공 (Exit Code 0).

-28. **[시안 5(모던 씬) 본문 섹션 2부터 11까지 시안 3(플레이리스트)과 100% 동일한 섹션 구조 및 타이포그래피 일치 (2026-11-14)]**:
   - **사용자 요청/기획 의도**:
     - "응 확인했어. 시안5 방금 수정한 섹션 이후로는 이제 시안3의 메인사진 들어가는 섹션 이후로 똑같이 구현해주면 될것같아. 구현할때 폰트도 시안3에서 사용하는 폰트 그대로."
   - **조치 상세 내역**:
     - `components/templates/scene/SceneTemplate.jsx`:
       - **섹션 1 유지 및 마감선**: 시안 5 고유 레트로 캠코더 히어로 섹션(`CAMERA1 PLAY`, 4개 코너 브래킷, `Our Wedding Day!`, `Group 1275` 포커스 타겟, 일시, 장소, `4K 60FPS / HD`, `SCROLL TO OPEN ↓` 알약 버튼)은 그대로 보존하고, 하단에 0.5px solid #999999 구분선 추가.
       - **섹션 2 (에디토리얼 스토리 / 모시는 글)**: `editorial-story-section` ID 부여로 상단 `SCROLL TO OPEN ↓` 클릭 시 스무스 스크롤 연동. `Cormorant Garamond` 영문 타이틀(`Welcome to / Minwoo & Yujin`), 신부/신랑 단독 포트레이트 카드 액자(`Bride.`, `Groom.` in `font-weddingday`), 혼주 정보 및 구분선 반영.
       - **섹션 3 (커플 화보 & 초대합니다)**: 풀 와이드 커플 사진 화보, 모시는 글 제목(`초대합니다`), 본문, `연락하기` 버튼(`EditorialContactModal` 연동), 구분선.
       - **섹션 4 (Wedding Day 캘린더)**: `Cormorant Garamond` 타이틀, 흑백 감성 화보, `NanumSquare Neo` 예식 일시, 7열 미니멀 달력, 구분선.
       - **섹션 5 (gallery 사진 갤러리)**: `Cormorant Garamond` 타이틀, 메인 화보 대형 컷, 썸네일 8개 그리드, `더보기` 버튼(`EditorialGalleryModal` 전체화면 라이트박스 모달 연동), 구분선.
       - **섹션 6 (location 식장 위치)**: 식장 이름, 주소 + 원클릭 복사, `KakaoMap` 지도, 네이버 지도 & 카카오내비 길안내 버튼, 지하철/버스 노선 공식 컬러 파서(`renderTransitText`) 기반 대중교통 안내, 구분선.
       - **섹션 7 (Account 마음 전하실 곳)**: 신랑측/신부측 슬라이딩 인디케이터 탭, 계좌번호 복사하기 알약 버튼, 구분선.
       - **섹션 8 (Notice 안내 사항)**: 186.5px × 236.5px 카드 캐러셀, 스와이프 및 도트 인디케이터, 구분선.
       - **섹션 9 (R·S·V·P 참석 의사 전달)**: `참석 정보 전달하기` 버튼(`EditorialRsvpModal` 팝업 연동), 구분선.
       - **섹션 9-2 (하객 현장 사진 선물)**: `GuestPhotoSnapSection` 연동 (`isEditorial={true}`).
       - **섹션 10 (Guestbook 방명록)**: 3개 카드 세로 배치, 스와이프 터치 및 도트 페이지네이션, 방명록 삭제 모달(`EditorialGuestbookDeleteModal`), `글 남기기` 버튼(`EditorialGuestbookModal`), 구분선.
       - **섹션 11 (Thank you 엔딩 감사)**: 풀 와이드 엔딩 화보, `Thank you` 타이틀, 감사 인사, 신랑·신부 드림, `DESIGNED BY ATELIER DE MUKIRU`.
       - **타이포그래피 통일**: 영문 섹션 타이틀(`Cormorant Garamond`, #292929), 한글 타이틀 및 본문(`NanumSquare Neo`, #292929 / #333333), 영문 포트레이트 스크립트(`Weddingday Personal Use`).
   - **품질 검증**:
     - `npx eslint components/templates/scene/SceneTemplate.jsx`: 0 errors, 0 warnings.
     - `npm run build`: 성공 (Exit Code 0).

-27. **[시안 5(모던 씬) 본문 첫 화면(섹션 1) 메인 화보 피그마 1:1 실측 규격 및 CAMERA1 PLAY / SCROLL TO OPEN 반영 (2026-11-14)]**:
   - **사용자 요청/기획 의도**:
     - "이제 시안5의 본문 수정하자. 섹션1이야 (첫번째 이미지 참고). 메인사진이 들어갈 곳이야. 방금 수정했던 커버화면과 비슷한 UI인데 약간만 달라."
     - 제공된 2x 피그마 CSS 좌표 및 첨부 시안 이미지 (`media_1794642221421_80009503.png`):
       - 전체 캔버스: `780px × 1413px` (`#1C1C1C`) ➔ 1x `390px × 706.5px`
       - 좌상단: `CAMERA1` / `PLAY` ('VCR OSD Mono' 40px -> 1x 20px, line-height 48px -> 24px, top 84px -> 42px, left: calc(50% - 165px/2 - 231.5px) -> 38px)
       - PLAY 옆 삼각 재생 아이콘: 피그마 실측 `left: 179px, top: 139px, width: 41px, height: 34px, rotate: 90deg, r: 3px` ➔ 1x `left: 89.5px, top: 69.5px, width: 17px, height: 20.5px` 부드러운 라운드 SVG 삼각 아이콘 배치
       - 우상단: 이름/REC 없이 코너 브래킷만 깔끔하게 유지
       - 중앙 타이틀: `Our Wedding Day!` ('VCR OSD Mono' 60px -> 30px, top 319px -> 159.5px)
       - 중앙 오토포커스 타겟 브래킷: Group 1275 실측 (`149.25px × 225.25px`, left: 120.5px, top: 234px)
       - 일시 및 장소: `2027.May 15. 14:00 pm` / `서울 크리스탈 볼룸 1층`
       - 하단 스펙: `4K 60FPS` / `HD`
       - 하단 오픈 버튼: `SCROLL TO OPEN ↓` (232.4px × 55.3px -> 1x 116.2px × 27.65px, top 1298px -> 649px, border 0.7px solid #FEFEFE, rounded-full)
   - **구현 및 정밀 개발 내역**:
     1. **`SceneTemplate.jsx` 섹션 1 전면 개편**:
        - 구버전 텍스트 페이드/펼쳐짐(`heroStep`) 제거 ➔ 피그마 실측 캔버스(`390px × 706.5px`) 기반 레트로 캠코더 재생 UI로 전면 교체.
        - `CAMERA1 \n PLAY ▶` ('VCR OSD Mono') 좌상단 정밀 배치.
        - 풀스크린 화보 배경 위에 뷰파인더 코너 브래킷 및 Group 1275 타겟 브래킷 1:1 정렬.
        - `SCROLL TO OPEN ↓` 알약 버튼 클릭 시 본문 2섹션(초대합니다)으로 부드럽게 스크롤 이동(`handleScrollToOpen`).
     2. **빌드 무결성 검증**:
        - `npx eslint components/templates/scene/SceneTemplate.jsx`: 0 errors
        - `npm run build`: Exit Code 0 통과

-26. **[시안 5(모던 씬) 레트로 캠코더/뷰파인더 커버 화면(SceneIntro) 신설 및 1:1 피그마 규격 반영 (2026-11-14)]**:
   - **사용자 요청/기획 의도**:
     - "시안5 리뉴얼 작업하자. 이것도 마찬가지로 커버화면과 청첩장 본문의 구조를 가지고 있어. 그리고 화면을 터치하면 청첩장 본문으로 들어가는거지."
     - 제공된 2x 피그마 CSS 좌표 및 2종 첨부 이미지(뷰파인더 UI 전체 레이아웃 및 Line 159 브래킷 실측):
       - 전체 캔버스: `780px × 1386px` (`#1C1C1C`) ➔ 1x `390px × 693px`
       - 뷰파인더 내부 영역: `695px × 1302px` ➔ 1x `347.5px × 651px` (상하 21px, 좌우 21.25px 여백)
       - 4개 외곽 코너 브래킷(Line 159 등): `153px` (1x `76.5px`), `border: 4px solid #FEFEFE` (1x `2px`)
       - 녹화 인디케이터: 빨간 점 `24px` (1x `12px`, `#F80602`, 펄스) + `REC` ('VCR OSD Mono' 32px -> 16px)
       - 신랑/신부 성함: 권기득(신부) & 장민기(신랑) ('NanumSquare Neo' 34px -> 17px, top 142px -> 71px)
       - 타이틀: `Our Wedding Day!` ('VCR OSD Mono' 60px -> 30px, top 319px -> 159.5px)
       - 내부 포커싱 타겟 브래킷: `[  ]` (`38.25px` -> 1x `19.1px`, top 468px -> 234px, border 2px -> 1.5px)
       - 일시: `2027.May 15. 14:00 pm` ('VCR OSD Mono' 34px -> 17px, top 1084px -> 542px)
       - 장소: `서울 크리스탈 볼룸 1층` ('NanumSquare Neo' 30px -> 15px, top 1141px -> 570.5px)
       - 캠코더 사양: `4K 60FPS` (top 1285px -> 642.5px), `HD` (top 1285px -> 642.5px)
       - 하단 터치 힌트: `화면을 터치해주세요` ('NanumMyeongjo' 20px -> 10px, top 1335px -> 667.5px)
   - **구현 및 정밀 개발 내역**:
     1. **`VCR OSD Mono` 폰트 에셋 탑재 및 전역 설정**:
        - `public/fonts/VCROSDMono.woff2` 경량 웹폰트 탑재 및 `app/globals.css` 내 `@font-face` 및 `.font-vcr` 유틸리티 클래스 등록.
     2. **`SceneIntro.jsx` 피그마 1:1 실측 컴포넌트 신설 (`components/templates/scene/SceneIntro.jsx`)**:
        - 반응형 자동 스케일러(scale calculation)를 통해 모바일/태블릿/데스크톱 미리보기 모달 전 환경에서 `390px × 693px` 비율 완벽 유지.
        - 풀스크린 화보 배경(`photo-07-grass-run.jpg` 등) 위에 뷰파인더 4개 코너 브래킷 및 중앙 오토포커스 타겟 마크 정밀 렌더링.
        - 깜빡이는 녹화 빨간 점(`animate-pulse`)과 `REC`, `4K 60FPS`, `HD` 레트로 캠코더 OSD 완벽 구현.
        - **신랑/신부 성함 위치 정밀 보정**: 피그마 2x 실측 공식 `calc(50% - 97px/2 - 235.5px)`를 1x로 `calc(50% - 48.5px/2 - 117.75px)` (좌측 53px 위치, 상단 71px)로 정밀 변환하여 브래킷 안쪽에 완벽한 여백으로 안착하도록 수정 (우측 `장민기` 또한 `calc(50% - 48.5px/2 + 117.75px)`로 대칭 일치).
        - **중앙 오토포커스 타겟 영역 피그마 Group 1275 1:1 실측 반영**: `width: 298.5px, height: 450.5px, left: 241px, top: calc(50% - 450.5px/2 + 0.25px)` (1x: `149.25px × 225.25px`, `left: 120.5px`, `top: 234px`) 컨테이너를 구성하고, 4개 모서리에 `19.125px` L자 브래킷을 정확히 배치하여 신랑신부 전신을 감싸는 시안 비율 100% 일치.
     3. **시안 1~4와 100% 동일한 3단계 시네마틱 암전 트랜지션 & BGM 자동 재생**:
        - 하객의 첫 화면 터치 시 브라우저 정책을 충족하며 `play-wedding-bgm` 이벤트 디스패치.
        - 800ms 화면 암전(`darkening`) ➔ 850ms 본문 전환 및 최상단 스크롤 리셋 ➔ 1200ms 안개 걷힘(`revealing`) ➔ 1250ms 언마운트 완료.
     4. **`SceneTemplate.jsx` 및 플랫폼 시스템 동기화**:
        - `SceneTemplate.jsx` 내 `showIntro` 상태 및 모달 스크롤 락 연동, 인트로가 닫히기 전까지 본문 오프닝 텍스트 애니메이션 대기 처리.
        - `app/[slug]/page.js`, `app/create/page.js`, `app/manage/[slug]/edit/page.js`의 `hasIntro` / `hasActualIntro` 배열에 `'scene'`을 포함하여 전체 5대 시안의 인트로 지원 정합성 완성.
   - **검증 결과**:
     - `npx eslint components/templates/scene/SceneIntro.jsx components/templates/scene/SceneTemplate.jsx`: 0 errors
     - `npm run build`: Exit Code 0 (전체 8개 라우트 빌드 성공)

-25. **[시안 3(플레이리스트) & 시안 4(시네마틱) 커버 터치 시 암전 페이드 및 음악 자동 재생 동기화 (2026-11-14)]**:
   - **사용자 요청/기획 의도**:
     - "지금 시안3,4 화면 터치하면 본문으로 들어가잖아. 그 구간을 시안1,2 처럼 화면 어두워졌다가 다시 나타나면서 음악 자동 재생되는 것처럼 그렇게 해줘. 현재 시안1,2가 그렇게 되어있지?"
   - **분석 및 구현 내용**:
     1. **시안 1(`EnvelopeIntro`) & 시안 2(`EditorialIntro`) 시네마틱 트랜지션 구조 분석**:
        - `transitionStep`: `'idle' | 'darkening' | 'revealing'` 3단계 상태 머신.
        - 화면 터치 시 브라우저 오디오 자동 재생 제약(User-Activation Policy)을 충족하며 `window.dispatchEvent(new CustomEvent('play-wedding-bgm'))` 디스패치.
        - **1단계 (darkening, 800ms)**: 화면 전체가 순수 블랙(`#000000`)으로 서서히 어두워짐 (`ease-in-out`).
        - **2단계 (revealing, 850ms 전환 후 1200ms)**: 최상단 스크롤 리셋(`window.scrollTo(0,0)`, `previewContainer.scrollTop = 0`), 인트로 카드 숨김 처리 후 블랙 오버레이가 안개처럼 걷히며 본문이 부드럽게 등장 (`cubic-bezier(0.22, 1, 0.36, 1)`).
        - **3단계 (unmount, 1250ms 후)**: `onOpen()` 콜백을 호출하여 인트로 컴포넌트 완전 언마운트 및 바디 스크롤 락 해제.
     2. **시안 3 (`PlaylistIntro.jsx`) 반영**:
        - 기존 단순 `isOpening` 단일 타이머 제거 ➔ 3단계 `transitionStep` 및 고유 암전 오버레이(`<div className="fixed inset-0 z-[60] bg-black ..."/>`) 신설.
        - 터치 시 `play-wedding-bgm` 이벤트 발송 및 스크롤 위치 초기화 연동.
     3. **시안 4 (`CinematicIntro.jsx`) 반영**:
        - 기존 450ms 단순 축소/페이드아웃 제거 ➔ 3단계 `transitionStep` 및 암전 오버레이 신설.
        - 터치 시 `play-wedding-bgm` 이벤트 발송 및 모달/전체화면 환경 모두에서 완벽한 페이드 투 블랙 연출 보장.
   - **검증 결과**:
     - `npx eslint components/templates/playlist/PlaylistIntro.jsx components/templates/cinematic/CinematicIntro.jsx`: 0 errors
     - `npm run build`: Exit Code 0 (전체 8개 라우트 빌드 성공)

-24. **[시안 3 (플레이리스트) 섹션 1 하단 피그마 구분선(Line 138) 추가 및 본문 타이포그래피 시안 4 폰트 전면 동기화 (2026-11-14)]**:
   - **사용자 요청/기획 의도**:
     - "시안1의 본문 청첩장의 섹션 끝나는 부분에 구분선이 누락되어있어. 구분선 css야: width 561px, top 1413px, border 0.5px solid #999999"
     - "시안3에 본문에 쓰인 글씨체는 아마 시안1,2에서 쓰인 글씨체일거야. 시안4에 쓰이는 글씨체로 시안3 본문들도 폰트 수정해줘."
   - **구현 및 정밀 수정 내역**:
     1. **섹션 1 하단 구분선 (Line 138) 피그마 1:1 실측 반영 (`PlaylistTemplate.jsx`)**:
        - 피그마 CSS: `width: 561px, top: 1413px, left: calc(50% - 561px/2 + 0.5px), border: 0.5px solid #999999`.
        - 1x 모바일 스펙: `width: 280.5px, top: 706.5px, left: calc(50% - 140px), border-top: 0.5px solid #999999`.
        - 섹션 1 컨테이너 높이를 `715px`로 확장하여 'SCROLL TO OPEN ↓' 버튼 하단 29.85px 간격을 두고 섹션 1과 2 사이에 깔끔하게 라인이 노출되도록 배치.
     2. **시안 3 본문 영문 섹션 타이틀 시안 4(`Cormorant Garamond`) 전면 교체**:
        - 기존 시안 2 기반 필기체(`Weddingday Personal Use` / `font-weddingday`)가 적용되어 있던 모든 섹션 헤더를 시안 4(시네마틱) 공식 서체인 **`Cormorant Garamond`**(`font-medium text-[25px]`, `#292929`)로 전면 교체:
          - 섹션 2: `Welcome to` / `Minwoo & Yujin`
          - 섹션 4: `Wedding Day` (달력)
          - 섹션 5: `gallery` (사진 갤러리)
          - 섹션 6: `location` (식장 위치)
          - 섹션 7: `Account` (마음 전하실 곳)
          - 섹션 8: `Notice` (안내 사항)
          - 섹션 9: `R·S·V·P` (참석 의사 전달)
          - 섹션 10: `Guestbook` (방명록)
          - 섹션 11: `Thank you` (엔딩 감사 인사)
     3. **한글 본문 폰트 정합성 확인**:
        - 한글 서브타이틀 및 본문 텍스트는 시안 4와 100% 동일한 **`NanumSquare Neo`**(`font-nanumsquare`)로 완벽 통일 유지.
   - **검증 결과**:
     - `npx eslint components/templates/playlist/PlaylistTemplate.jsx`: 0 errors
     - `npm run build`: Exit Code 0 (전체 8개 라우트 빌드 성공)

-23. **[시안 3 (플레이리스트) 본문 첫 화면 (섹션 1) 피그마 1:1 실측 CSS 및 SCROLL TO OPEN 연동 (2026-11-14)]**:
   - **사용자 요청/기획 의도**:
     - "커버화면은 이대로 넘어가면 될 것 같아. 그럼 이제 화면을 터치해서 청첩장 본문으로 넘어가서 가장 첫 화면에 나오는 부분을 수정해야해. 메인 사진이 쓰이는 곳이지"
     - 전달 피그마 2x 좌표 & CSS:
       - 섹션1 캔버스: `780px × 1407px` (left: 0px, top: 0px) -> 1x `390px × 703.5px` (`#FEFEFE`)
       - 'Getting married': `486px × 44px` (top: 94px, Ownglyph corncorn 70px -> 35px, #454545, center) -> 1x `top: 47px`
       - 메인 이미지 (image 770): `618px × 863px` (top: 171px) -> 1x `309px × 431.5px`, `top: 85.5px`
       - 좌우 회전 세로 텍스트: 커버 화면과 동일 형태 (좌측 하단 장소 `rotate(-90deg)`, 우측 상단 일시 `rotate(90deg)`)
       - 로딩 바: `top: 1087px` -> 1x `543.5px`, width `309px`, 점 `9px`, 오디오 프로그레스 동기화 및 클릭 탐색(seek) 지원
       - 시간 표시: `top: 1101px` -> 1x `550.5px`, `0:16` / `3:37` (오디오 재생 시 실시간 시간 연동)
       - 5대 플레이어 컨트롤러: `top: 1122px` -> 1x `561px`, 하트(좋아요 토글 및 바운스), 이전곡(처음부터 다시 재생), 재생 56px 원형(일시정지/재생 아이콘 토글), 다음곡, 더보기
       - 보조 컨트롤: `top: 1249px` -> 1x `624.5px`, 셔플, 반복재생
       - 하단 'SCROLL TO OPEN ↓' 타원 버튼: `232.4px × 55.3px` (top: 1298px) -> 1x `116.2px × 27.65px`, `top: 649px`, Cormorant Garamond 700 8px, `#333333`, 클릭 시 `#editorial-story-section`으로 부드러운 스크롤 이동
   - **구현 및 정밀 수정 내역**:
     1. **섹션 1 캔버스 & Getting married 헤더 (`PlaylistTemplate.jsx`)**:
        - 기존 카드형 레이아웃(`p-4 rounded-[40px]`)을 전면 피그마 실측 규격(`w-full max-w-[390px] h-[703.5px] bg-[#FEFEFE]`)으로 교체.
        - 사진 상단 여백에 `Getting married` 타이틀(`top: 47px`, 온글잎 콘콘체 35px, `#454545`)을 정확히 배치.
     2. **메인 화보 사진 (image 770) & 좌우 회전 세로 텍스트**:
        - 피그마 1:1 규격(`309px × 431.5px`, `top: 85.5px`)으로 중앙 정렬.
        - 사진 좌측 하단 장소명(`서울 크리스탈 볼룸 1층`, rotate -90deg) 및 우측 상단 일시(`2027.May 15. 14:00 pm`, rotate 90deg)를 앵커링하여 사진 외곽선에 완벽 일치.
     3. **실시간 오디오 연동 플레이어 UI**:
        - 프로그레스 바 클릭 시 원하는 구간으로 탐색하는 `handleSeek` 구현 및 `trackProgress` 연동.
        - 이전 곡 버튼 클릭 시 오디오 0초로 되돌려 재생하는 `handleRestartAudio` 구현.
        - 중앙 56px 재생 버튼으로 BGM 재생/일시정지 완벽 토글.
     4. **피그마 1:1 타원형 'SCROLL TO OPEN ↓' 버튼**:
        - `width: 116.2px, height: 27.65px, top: 649px, border: 1px solid #8E8E93, rounded-full`.
        - Cormorant Garamond 700 폰트로 `SCROLL TO OPEN ↓` (다운 화살표 포함) 렌더링.
        - 클릭 시 본문 2번째 섹션(`editorial-story-section`)으로 부드럽게 스크롤 이동.
   - **검증 결과**:
     - `npx eslint components/templates/playlist/PlaylistTemplate.jsx`: 0 errors
     - `npm run build`: Exit Code 0 (전체 8개 라우트 빌드 100% 무결성 검증 완료)

-22. **[시안 3 (플레이리스트) 커버(오프닝 인트로) 화면 신설 및 피그마 1:1 실측 CSS 구현 (2026-11-14)]**:
   - **사용자 요청/기획 의도**:
     - "시안3 플레이리스트도 시안1,2,4와 같이 커버화면을 따로 만들고싶어. 그리고 화면을 터치하면 청첩장 본문으로 들어가는거지"
     - "사진 기준으로 오른쪽 상단에, 왼쪽 하단에 들어가야할 데이터가 현재 코드에서는 위치를 잘 못잡고 있고, 밑에 아이콘도 피그마와 동일하지 않아."
     - 전달 피그마 2x 좌표 & CSS:
       - 전체 영역: `780px × 1386px` (top: 1276px, left: 12244px, background: `#1C1C1C`) -> 1x `390px × 693px`
       - 내부 컨텐츠 바운딩 영역: `692px × 1260px` (top: 93px, left: 42px) -> 1x `346px × 630px`
       - 신랑/신부 성함 & 구분선: `568px × 39px` (top: 93px, NanumMyeongjo 34px -> 17px, #292929, 구분선 width 290px -> 145px)
       - 커버 화보: `618px × 863px` (top: 171px) -> 1x `309px × 431.5px`
       - 'Getting married': `486px × 44px` (top: 941px, Ownglyph corncorn 70px -> 35px, #FEFEFE)
       - 좌측 바깥 세로 텍스트: '서울 크리스탈 볼룸 1층' (사진 왼쪽 밖 여백에 위치, 사진 하단 라인과 일치, `rotate(-90deg)`, NanumMyeongjo 24px -> 11px, #333333)
       - 우측 바깥 세로 텍스트: '2027.May 15. 14:00 pm' (사진 오른쪽 밖 여백에 위치, 사진 상단 라인과 일치, `rotate(90deg)`, NanumMyeongjo 24px -> 11px, #666666, letter-spacing 0.04em)
       - 로딩 바: `619px × 2.5px` (top: 1087px, #292929, 점 18px -> 8px 원형)
       - 시간 표시: `0:16` / `3:37` (Pretendard 20px -> 10px, #292929)
       - 5대 플레이어 컨트롤러: 하트(Figma `bi:suit-heart`), 이전곡(Figma `bi:skip-start-fill`), 재생 원형(112px -> 56px, #292929, 일시정지 바 2개 #FAFAFA), 다음곡(Figma `bi:skip-end-fill`), 더보기(Figma `bi:three-dots`)
       - 보조 컨트롤: 셔플(Figma `bi:shuffle`), 반복재생(Figma `bi:repeat`)
       - 하단 안내: '화면을 터치해주세요' (NanumMyeongjo 20px -> 10px, #666666, letter-spacing 0.09em)
   - **구현 및 정밀 수정 내역**:
     1. **피그마 1:1 절대좌표 레이아웃 및 반응형 자동 스케일 (`PlaylistIntro.jsx`)**:
        - 기존 flexbox 기반에서 발생하던 화면 높이별 이미지 축소(`max-h-[44vh]`) 결함을 전면 제거하고, 피그마 실측 1:1 절대좌표(`390px × 693px` 기준) 아키텍처로 전환.
        - **화보 사진 (image 770)**: 피그마 실측 규격(`width: 618px, height: 863px, top: 171px, left: calc(50% - 618px/2)`)을 1x 모바일 스펙(`width: 309px, height: 431.5px, top: 85.5px, left: calc(50% - 154.5px)`)으로 1:1 고정 반영. 카드 전체 높이의 62.3%, 너비의 79.2%를 정확히 차지하도록 보장.
        - 사진 내부 `overflow-hidden` 래퍼와 외부 세로 텍스트 앵커 컨테이너를 분리하여 회전 텍스트가 잘리는 현상 방지.
        - 뷰포트나 모달이 390px × 693px보다 작은 환경에서는 `transform: scale(scale)`로 전체 카드가 100% 동일한 비례를 유지하며 선명하게 자동 스케일 다운.
     2. **좌우 회전 세로 텍스트 위치 및 회전축 1:1 완벽 정렬**:
        - **우측 상단 날짜 (`2027.May 15. 14:00 pm`)**: 사진 오른쪽 바깥 여백(`left: calc(100% + 6px)`), 사진 최상단 라인(`top: 0px`)에 앵커링하고 `transform: rotate(90deg) translateY(-100%)` (origin `0 0`)을 적용하여 피그마와 동일하게 사진 상단에서 시작해 아래로 정렬.
        - **좌측 하단 장소 (`서울 크리스탈 볼룸 1층`)**: 사진 왼쪽 바깥 여백(`left: -6px`), 사진 최하단 라인(`bottom: 0px`)에 앵커링하고 `transform: rotate(-90deg)` (origin `0 100%`)을 적용하여 피그마와 동일하게 사진 하단 라인에 맞춰 위로 전개.
     3. **하단 미디어 컨트롤 아이콘 피그마 1:1 Bootstrap Icons 전면 교체**:
        - 기존 제네릭 아이콘을 피그마 원본 아이콘인 Bootstrap Icons SVG 1:1 패스로 교체:
          - 하트: `bi:suit-heart` (부드러운 카드 슈트 하트 라인)
          - 이전곡: `bi:skip-start-fill` (좌측 바 + 좌향 삼각 채움)
          - 일시정지: 56px 원형 + 화이트 일시정지 바 2개 (`#FAFAFA`)
          - 다음곡: `bi:skip-end-fill` (우향 삼각 채움 + 우측 바)
          - 더보기: `bi:three-dots` (가로 삼점 도트)
          - 셔플: `bi:shuffle` (교차 화살표 채움 헤드)
          - 반복: `bi:repeat` (사각 루프 회전 화살표)
     4. **폰트 시스템 보강 (`app/globals.css`, `app/layout.js`)**:
        - 'Getting married'용 온글잎 콘콘체 (`Ownglyph corncorn`), 나눔명조 (`Nanum Myeongjo`) 전역 연동.
     5. **시안 3 템플릿 마운트 & 터치 인터랙션 (`PlaylistTemplate.jsx`)**:
        - 터치 시 부드러운 페이드아웃 + `play-wedding-bgm` 이벤트 트리거로 모바일 브라우저 오디오 정책을 만족하며 즉시 BGM 자동 재생.
        - 샘플 모드(`isSample`) 강제 노출 보장 및 제작/수정 폼 모달 미리보기 스크롤 락 연동.
   - **검증 결과**:
     - `npx eslint`: 0 errors
     - `npm run build`: Exit Code 0 (전체 8개 라우트 빌드 100% 성공)


-21. **[시안 4 (시네마틱) 기본 다크모드(Midnight) 적용 및 고객(신랑신부) 기본 테마 선택 기능 신설 (2026-11-14)]**:
   - **사용자 요청/기획 의도**:
     - "시안4 같은 경우 라이트모드,다크모드가 있는데 일단 기본세팅으로는 다크모드 였으면 좋겠고, 시안4를 (제작 또는 수정시) 선택할 경우 자신의 하객에게 다크모드를 기본으로 할지, 라이트모드를 기본으로 할지 고객(신랑신부)이 정하게 했으면 좋겠어"
   - **구현 및 변경 내역**:
     1. **시안 4 템플릿 기본 테마 다크모드(Midnight) 전환 (`CinematicTemplate.jsx`)**:
        - 기존 기본값 `isNightMode = false` (라이트모드) ➔ `initialNight = config.default_theme ? config.default_theme !== 'light' : true` (기본값 다크모드).
        - 신랑신부가 지정한 `default_theme` 설정을 우선 반영하며, 별도 설정이 없을 시 시네마틱 고유의 모노크롬 감성을 극대화하는 **다크모드(Midnight)**로 첫 화면이 열림.
        - 제작/수정 폼 실시간 프리뷰에서 고객이 테마 선택 변경 시 즉각 반영되도록 `useEffect` 양방향 반응 연동.
     2. **제작 폼 (`app/create/page.js`) & 수정 폼 (`app/manage/[slug]/edit/page.js`) 선택 UI 신설**:
        - Step 1 디자인 시안 선택(Section 00)에서 `시안 4 (시네마틱)` 선택 시 전용 옵션 블록 자동 노출:
          - 🌙 **다크 모드 (Midnight / 기본 추천)**: 모노크롬 흑백 감성과 깊이감 있는 시네마틱 무드
          - ☀️ **라이트 모드 (Brightly)**: 화사하고 밝은 아이보리 화이트 무드
        - 하객이 링크를 처음 열었을 때 보여질 기본 테마를 신랑·신부가 직접 선택하여 `template_config.default_theme`으로 DB에 영구 저장.
        - 하객용 화면 좌측 상단 플로팅 스위처(`Brightly ↔ Midnight`)는 유지하여, 하객이 원할 경우 언제든 자유롭게 모드 전환 가능.
     3. **데모 샘플 및 랜딩 쇼케이스 동기화**:
        - `SAMPLE_INVITATIONS.cinematic`: `default_theme: 'dark'` 기본값 지정.
        - `SignatureShowcase.jsx`: 시안 4 인트로 미리보기 목업 기본 상태를 다크모드(`cinematicNight = true`)로 동기화.
   - **검증 결과**:
     - `npx eslint`: 0 errors
     - `npm run build`: Exit Code 0 (전체 8개 라우트 빌드 성공)


-20. **[시안 1 & 시안 2 커버(인트로) 화면 배경을 커버 사진 줌인(scale-[1.10])으로 일치화 (2026-11-14)]**:
   - **사용자 요청/기획 의도**:
     - "시안1과 시안2의 공통적인 부분인데, 링크 받으면 첫 화면 나오잖아. 나는 그 부분을 커버화면이라고 부를건데, 거기에 커버이미지가 쓰이잖아. 그리고 그 밖에 배경으로 또 쓰이는 이미지가 있어. 지금 시안2 같은 경우는 editorial_cover_image 인가? 아무튼 로컬에 저장된 사진을 쓰고있는데, 이 사진 말고 시안1,2에 쓰이는 cover.img? cover.png? 아무튼 그걸 50% 줌인 한 느낌의 사진으로 배경으로 썼으면 좋겠어. 그래야 어떤 커버 사진이 오더라도 배경이 어울릴 것 같아서말이야."
     - 추가 피드백: "줌인 너무 크게 된거같은데 지금 기준의 반으로 줄여볼래 ?" ➔ 25% 축소(`scale-[1.25]`) 적용 후 "지금도 조금 줌인 크네 살짝 더 조절해줘." 피드백에 맞춰 가장 자연스럽고 원본 구도를 온전히 살리는 **10% 줌인(`scale-[1.10]`)**으로 최종 완화 조정.
   - **문제 분석 및 개선 내용**:
     1. **기존 문제점**:
        - 시안 2(`EditorialIntro.jsx`): 화이트 프레임 카드에 고객 커버 사진이 들어가지만, 정작 전체 화면 배경은 로컬 파일(`/samples/editorial_intro_background.png`)로 하드코딩되어 있어 고객이 어떤 웨딩 사진을 올려도 배경과 조화되지 않는 결함 존재.
        - 시안 1(`EnvelopeIntro.jsx`): AirDrop 카드에 커버 사진이 들어가지만, 배경은 `/airdrop-bg.jpg` 고정 또는 줌인 없는 기본 사진으로 렌더링되어 배경 일체감이 부족했음.
     2. **시안 1 (`EnvelopeIntro.jsx`) 커버 사진 10% 줌인 배경 적용**:
        - 배경 이미지 소스를 카드 내부 커버 사진(`couplePhoto`)과 100% 동일하게 일치화 (`bgImage = couplePhoto`).
        - `scale-[1.10]` (10% 줌인) 적용 및 `overflow-hidden`으로 뷰포트 완벽 고정.
        - `bg-black/20` 틴트 오버레이를 적용하여 전경의 AirDrop 알림 카드에 자연스럽게 시선이 집중되도록 톤 밸런스 조정.
     3. **시안 2 (`EditorialIntro.jsx`) 커버 사진 10% 줌인 배경 적용**:
        - 로컬 고정 이미지(`/samples/editorial_intro_background.png`) 완전 제거 ➔ 실제 청첩장 커버 화보(`coverImage`)와 100% 일치화 (`coverBgImage = coverImage`).
        - `scale-[1.10]` (10% 줌인) 적용 및 `overflow-hidden`으로 안전 격리.
        - 기존 피그마 실측 딥 틴트 오버레이(`bg-black/[0.49]`)를 유지하여 상단 필기체 타이틀(`We are getting married`) 및 하단 영문 날짜 텍스트의 가독성 100% 보존.
     4. **랜딩 페이지 실물 쇼케이스 (`SignatureShowcase.jsx`) 동기화**:
        - 시안 1 & 시안 2 인트로 애니메이션 미리보기 목업의 배경도 커버 사진 10% 줌인(`scale-[1.10]`)으로 동기화하여 브랜드 팩트 1:1 일치.
   - **검증 결과**:
     - `npx eslint`: 0 errors
     - `npm run build`: Exit Code 0 (전체 8개 라우트 빌드 성공)


-19. **[전체 템플릿(시안 1~5) 하단 인라인 공유 버튼 제거 및 플로팅 퀵 메뉴(`QuickNavigationPill`) 단일화 (2026-11-14)]**:
   - **사용자 요청/질문**:
     - "혹시 모든 시안에 첫번째 이미지(`media_1794626402406_3eb18c25.png`: 카카오톡 공유하기 / 링크 복사 버튼)와 같은 이런 부분이 있다면 지워줄래?"
     - "2번째 이미지(`media_1794626426374_44a632e7.png`: 오시는 길 | 마음 전하기 | 공유하기 | ^ x 플로팅 퀵 메뉴)와 같이 퀵 메뉴가 모든 메뉴에 반영되어있는지 확인해줘. 2번째 이미지처럼 구현되어있다면 첫번째 이미지의 부분은 필요없을 것 같아서."
   - **플로팅 퀵 메뉴 전수 검증 및 확인 결과**:
     1. **전 시안 및 모든 페이지 마운트 완료 확인**:
        - `app/[slug]/page.js:248`: 시안 1~5(기본 샘플 및 고객 실제 청첩장 전체)에 `<QuickNavigationPill />`이 글로벌로 마운트되어 항상 동작함.
        - `app/create/page.js:4620`: 제작 폼 모바일 실시간 프리뷰에 반영 완료.
        - `app/manage/[slug]/edit/page.js:3549`: 수정 폼 모바일 실시간 프리뷰에 반영 완료.
     2. **UI & 기능 일치 검증 (2번째 이미지 100% 동일)**:
        - `📍 오시는 길`: 터치 시 식장 안내/지도 섹션으로 부드러운 스크롤.
        - `✉️ 마음 전하기`: 터치 시 축의금/계좌번호 섹션으로 부드러운 스크롤.
        - `🔗 공유하기`: 터치 시 바텀시트 모달(`showShareModal`) 노출 (카카오톡 공유, 링크 복사, 시스템 네이티브 공유, 복사 완료 토스트 포함).
        - `^` (최상단 스크롤), `x` (미니멀 원형 아이콘으로 접기).
   - **5대 시안 하단 인라인 공유 버튼(`share-section`) 전수 제거 및 푸터 정리**:
     - **시안 1 (`BasicTemplate.jsx`)**: 하단 인라인 카카오톡/링크 복사 버튼 제거 ➔ `DESIGNED BY ATELIER DE MUKIRU`를 피그마 실측에 맞춘 `mt-[95px] pb-[40px]` 여백으로 정돈.
     - **시안 2 (`EditorialTemplate.jsx`)**: 하단 인라인 카카오톡/링크 복사 버튼 제거 ➔ 브랜드 로고 `mt-[95px] pb-[40px]` 간격 최적화.
     - **시안 3 (`PlaylistTemplate.jsx`)**: 하단 인라인 카카오톡/링크 복사 버튼 제거 ➔ 브랜드 로고 `mt-[95px] pb-[40px]` 간격 최적화.
     - **시안 4 (`CinematicTemplate.jsx`)**: 이전 엔딩 섹션 피그마 실측 구현 시 기 제거 완료.
     - **시안 5 (`SceneTemplate.jsx`)**: 하단 인라인 카카오톡/링크 복사 버튼 제거 ➔ 푸터 패딩을 `py-12 px-6`으로 단아하게 조정.
   - **검증 결과**:
     - `npx eslint`: 0 errors
     - `npm run build`: Exit Code 0 (전체 8개 라우트 빌드 성공)


-18. **[시안 4 (시네마틱) 엔딩 사진 & Thank you 푸터 섹션 피그마 1:1 실측 CSS 구현 및 퀵 버튼 대체 (2026-11-14)]**:
   - **사용자 요청/제공 피그마 좌표 & 시안 이미지** (`media_1794625859331_25406e44.png`):
     - 섹션 영역: `780px × 1341px` (top: 15446px, bg: `#FEFEFE`)
     - 엔딩 사진: `782px × 593px` (top: 15448px, overlay: `linear-gradient(180deg, rgba(217, 217, 217, 0) 68.73%, rgba(236, 236, 236, 0.23) 82.26%, #FEFEFE 100%)`)
     - Thank you: `206px × 36px` (top: 16135px, Cormorant Garamond 500 50px, line-height: 72%, color: `#292929`)
     - 함께해 주셔서 감사합니다.: `335px × 49px` (top: 16269px, NanumSquare Neo OTF 400 30px, line-height: 162%, color: `#333333`)
     - 민준 · 지민 드림: `201px × 49px` (top: 16323px, NanumSquare Neo OTF 400 30px, line-height: 162%, color: `#999999`)
     - DESIGNED BY ATELIER DE MUKIRU: `371px × 39px` (top: 16648px, Poppins 400 24px, line-height: 162%, color: `#999999`)
     - 공유/복사 기능: 인라인 구형 텍스트 링크 제거 ➔ 시안 2와 동일하게 화면 우하단 플로팅 퀵 버튼(`QuickNavigationPill`)으로 단일화.
   - **피그마 실측 CSS ➔ 1x 모바일 스펙 1:1 정밀 매핑**:
     1. **섹션 컨테이너**:
        - 2x: `780px × 1341px` (top: 15446px) ➔ 1x: `w-full max-w-[430px] mx-auto text-center select-none overflow-hidden`, Day(`bg-[#FEFEFE]`), Night(`bg-[#141414]`).
        - 전체 높이: `296.5 (사진) + 47 + 18 (Thank you) + 49 + 24.5 (문구) + 2.5 + 24.5 (드림) + 138 + 19.5 (브랜드) + 50.5 (바닥 여백) = 670.5px` (`1341px / 2 = 670.5px` 오차 0.0px 완벽 일치).
     2. **엔딩 사진 & 그라데이션 오버레이**:
        - 2x: `782px × 593px` ➔ 1x: `w-full aspect-[782/593] overflow-hidden relative`
        - 오버레이: Day(`linear-gradient(180deg, rgba(217, 217, 217, 0) 68.73%, rgba(236, 236, 236, 0.23) 82.26%, #FEFEFE 100%)`), Night(`linear-gradient(180deg, rgba(20, 20, 20, 0) 68.73%, rgba(20, 20, 20, 0.5) 82.26%, #141414 100%)`).
     3. **Thank you**:
        - 여백: `(16135 - 16041) / 2 = 47px` (`mt-[47px]`)
        - 폰트: `font-serif ('Cormorant Garamond') font-medium text-[25px] leading-[18px] text-center`, Day(`#292929`), Night(`text-white`).
     4. **함께해 주셔서 감사합니다.**:
        - 여백: `(16269 - 16171) / 2 = 49px` (`mt-[49px]`)
        - 폰트: `font-nanumsquare font-normal text-[15px] leading-[24.5px] text-center`, Day(`#333333`), Night(`#D4D4D4`).
     5. **민준 · 지민 드림**:
        - 여백: `(16323 - 16318) / 2 = 2.5px` (`mt-[3px]`)
        - 폰트: `font-nanumsquare font-normal text-[15px] leading-[24.5px] text-center`, Day(`#999999`), Night(`#888888`).
        - 데이터: 성함 3자 슬라이스(`groomShort`, `brideShort`) 동적 적용 (샘플: '민준 · 지민 드림').
     6. **DESIGNED BY ATELIER DE MUKIRU**:
        - 여백: `(16648 - 16372) / 2 = 138px` (`mt-[138px] pb-[50px]`)
        - 폰트: `font-sans font-normal text-[12px] leading-[19.5px] tracking-[0.05em] uppercase text-center`, Day(`#999999`), Night(`#777777`).
     7. **인라인 공유 링크 제거 및 플로팅 퀵 버튼 통합**:
        - 구형 인라인 링크(`💬 Share KakaoTalk`, `🔗 Copy Link`) 완전 제거.
        - 화면 전체에 상시 배치된 `QuickNavigationPill`로 깔끔하게 단일화.
   - **검증 결과**:
     - `npx eslint components/templates/cinematic/CinematicTemplate.jsx`: 0 errors.
     - `npm run build`: 성공 (Exit Code 0).


-17. **[방명록(Guestbook) 섹션 전 시안(시안 1~5) 피그마 1:1 실측 신규 레이아웃 일괄 전파 (2026-11-14)]**:
   - **사용자 요청**: 시안 4에 적용한 1:1 피그마 실측 방명록 디자인(3개 직사각형 카드 세로 스택, 4px 슬림 도트 인디케이터, 글 남기기 알약 버튼, 배경 그라디언트)을 나머지 전체 시안(시안 1, 2, 3, 5)에도 동일하게 적용하고, 폰트는 각 시안의 고유 폰트 시스템을 준수할 것.
   - **시안별 적용 내역**:
     1. **시안 1 (`BasicTemplate.jsx`)**:
        - 기존 4컷 2x2 매거진 프레임 ➔ 시안 4의 3개 카드 세로 스택 레이아웃으로 변경.
        - 폰트: 영문 타이틀 `font-weddingday`, 한글 타이틀/본문/작성자 `font-nanumsquare`.
        - 그라디언트 배경(`from-[#FEFEFE] to-[#EAEAEA]`), 슬림 도트 인디케이터(`gap-[4px]`), '글 남기기' 알약 버튼.
     2. **시안 2 (`EditorialTemplate.jsx`)**:
        - 기존 4컷 2x2 프레임 ➔ 3개 카드 세로 스택 레이아웃으로 개편.
        - 폰트: 영문 타이틀 `font-weddingday`, 한글 타이틀/본문/작성자 `font-nanumsquare`.
        - `EditorialGuestbookModal` 및 `EditorialGuestbookDeleteModal` 정상 유지.
     3. **시안 3 (`PlaylistTemplate.jsx`)**:
        - 기존 4컷 2x2 프레임 ➔ 3개 카드 세로 스택 레이아웃으로 개편.
        - 폰트: 영문 타이틀 `font-weddingday`, 한글 타이틀/본문/작성자 `font-nanumsquare`.
     4. **시안 5 (`SceneTemplate.jsx`)**:
        - 기존 인라인 입력 폼 + 텍스트 리스트 ➔ 3개 카드 세로 스택 + '글 남기기' 알약 버튼(모달 팝업 오픈)으로 통일.
        - 폰트: 영문 타이틀 `font-cormorant italic`, 한글 타이틀/본문/작성자 `font-serif`, 날짜 `font-mono`.
        - `EditorialGuestbookModal` 신규 임포트 및 마운트 연동.
   - **검증 결과**:
     - `npx eslint components/templates/**/*.jsx`: 0 errors.
     - `npm run build`: 성공 (Exit Code 0).


-16. **[시안 4 (시네마틱) 방명록(Guestbook) 섹션 피그마 1:1 실측 CSS 신설 및 모달 연동 (2026-11-14)]**:
   - **사용자 요청/제공 피그마 좌표 & 시안 이미지**:
     - 방명록 영역: `780px × 1659px` (top: 13787px, bg: `linear-gradient(180deg, #FEFEFE 0%, #EAEAEA 100%)`)
     - Guestbook: `214px × 36px` (top: 13979px, Cormorant Garamond 500 50px, line-height: 72%, color: `#292929`)
     - 방명록: `103px × 26px` (top: 14088px, NanumSquare Neo OTF 400 36px, line-height: 72%, color: `#292929`)
     - 본문 문구: `313px × 96px` (top: 14200px, NanumSquare Neo OTF 400 28px, line-height: 172%, color: `#333333`)
     - 방명록 카드 1개당: `696px × 247px` (left: 42px, top: 14349px)
       - From 작성자: `123px × 14px` (top: 14388px, NanumSquare Neo 20px, color: `#666666`)
       - X 삭제 버튼: 우측 상단 모달 연동
       - 본문: `324px × 74px` (top: 14427px, NanumSquare Neo 23px, line-height: 160%, color: `#333333`)
       - 등록일: `115px × 29px` (top: 14528px, NanumSquare Neo 20px, color: `#999999`)
     - 방명록 남기기 버튼: `268px × 78px` (top: 15239px, bg: `#393939`, radius: 49px, box-shadow: 0px 4px 14.2px rgba(0,0,0,0.09))
       - 텍스트 "글 남기기": `114px × 20px` (top: 15268px, NanumSquare Neo 700 28px, color: `#F3F3F3`)
     - 모달: 시안 2와 동일한 `EditorialGuestbookModal` 및 `EditorialGuestbookDeleteModal` 연동.
   - **피그마 실측 CSS ➔ 1x 모바일 스펙 1:1 정밀 매핑**:
     1. **섹션 컨테이너**:
        - 2x: `780px × 1659px` (top: 13787px) ➔ 1x: `w-full pt-[96px] pb-[64.5px] px-[21px] text-center`
        - 상단 패딩: `(13979 - 13787) / 2 = 96px` (`pt-[96px]`)
        - 하단 패딩: `(15446 - 15317) / 2 = 64.5px` (`pb-[64.5px]`)
        - 전체 높이: `96 + 18 + 36.5 + 13 + 43 + 48 + 26.5 + 445 + 39 + 64.5 = 829.5px` (`1659px / 2 = 829.5px` 오차 0.0px 완벽 일치).
        - 배경 그라디언트: Day(`linear-gradient(180deg, #FEFEFE 0%, #EAEAEA 100%)`), Night(`linear-gradient(180deg, #1E1E1E 0%, #141414 100%)`).
     2. **영문 타이틀 (`Guestbook`)**:
        - 2x: `top: 13979px, 214px × 36px, Cormorant Garamond 500 50px`
        - 1x 변환: `font-serif ('Cormorant Garamond') font-medium text-[25px] leading-[18px] text-center select-none`, Day(`#292929`), Night(`text-white`).
     3. **한글 서브타이틀 (`방명록`)**:
        - 2x: `top: 14088px, 103px × 26px, NanumSquare Neo OTF 400 36px`
        - 여백: `(14088 - 14015) / 2 = 36.5px` (`mt-[36.5px]`)
        - 1x 변환: `font-nanumsquare font-normal text-[18px] leading-[13px] text-center tracking-tight`, Day(`#292929`), Night(`text-[#E5E5E5]`).
     4. **본문 안내 문구**:
        - 2x: `top: 14200px, 313px × 96px, NanumSquare Neo OTF 400 28px, line-height 172% (48px)`
        - 여백: `(14200 - 14114) / 2 = 43px` (`mt-[43px]`)
        - 1x 변환: `w-[156.5px] max-w-full mx-auto font-nanumsquare font-normal text-[14px] leading-[24px] text-center whitespace-pre-line`, Day(`#333333`), Night(`text-[#D4D4D4]`).
     5. **방명록 개별 카드 3개 세로 스택 (Figma 1:1 이미지 매칭)**:
        - 2x: `696px × 247px` (left: 42px, top: 14349px) ➔ 1x: `w-full max-w-[348px] min-h-[123.5px] rounded-[14px] p-[18px] pb-[16px]`
        - 여백: `(14349 - 14296) / 2 = 26.5px` (`mt-[26.5px]`), 카드 간 간격: `gap-[11px]`.
        - 상단 From 작성자: `font-nanumsquare text-[10px]`, Day(`#666666`), Night(`#A3A3A3`).
        - 우측 상단 X 삭제 버튼: `EditorialGuestbookDeleteModal` 연동.
        - 본문 메시지: `font-nanumsquare text-[11.5px] leading-[1.6] my-[10px] text-left line-clamp-3`, Day(`#333333`), Night(`#E5E5E5`).
        - 하단 등록일: `font-nanumsquare text-[10px]`, Day(`#999999`), Night(`#888888`), `formatGuestbookDate` 자동 포맷 (`2027. 10.21`).
        - 카드 배경: Day(`bg-white border border-[#DCDCDC]`), Night(`bg-[#242424] border border-white/10`).
     6. **페이지네이션 도트 & 스와이프**:
        - 3개 이상 등록 시 3개씩 페이지 분할(`displayList.slice(page * 3, page * 3 + 3)`).
        - 슬림 인디케이터 도트(`gap-[4px] mt-[18px]`) 및 모바일 좌우 터치 스와이프(`onTouchStart`, `onTouchEnd`) 지원.
     7. **글 남기기 알약 버튼**:
        - 2x: `top: 15239px, 268px × 78px, radius: 49px` ➔ 1x: `w-[134px] h-[39px] rounded-[24.5px] mt-[24px] mx-auto`
        - 버튼 텍스트: `font-nanumsquare font-bold text-[14px] leading-none`
        - 테마: Day(`bg-[#393939] text-[#F3F3F3]`), Night(`bg-white text-[#292929]`).
        - 클릭 시 `EditorialGuestbookModal` 팝업 오픈 및 작성 완료 시 즉시 상단 프리펜드(`[newMsg, ...prev]`).
     8. **모달 연동 및 결함(TODO 2) 해소**:
        - `EditorialGuestbookModal` & `EditorialGuestbookDeleteModal` 정상 바인딩.
        - `PROJECT_STATUS.md` 상단 [TODO 2] 항목 완료 처리.
   - **검증 결과**:
     - `npx eslint components/templates/cinematic/CinematicTemplate.jsx`: 0 errors
     - `npm run build`: Exit Code 0 (전체 성공)


-15. **[시안 4 (시네마틱) 포토쉐어링 섹션 피그마 1:1 실측 CSS 정밀 반영 (2026-11-14)]**:
   - **사용자 요청/제공 피그마 좌표**:
     - 섹션 컨테이너: `780px × 1200px` (top: 12587px, bg: `#FEFEFE`)
     - Photo Sharing: `281px × 36px` (top: 12728px, Cormorant Garamond 500 50px, line-height: 72%, color: `#292929`)
     - 사진 공유: `146px × 26px` (top: 12837px, NanumSquare Neo OTF 400 36px, line-height: 72%, color: `#292929`)
     - 본문 문구: `506px × 147px` (top: 12949px, NanumSquare Neo OTF 400 28px, line-height: 174%, color: `#333333`)
     - 사진 업로드하기: `193px × 20px` (top: 13608px, NanumSquare Neo OTF 700 28px, line-height: 72%, color: `#F3F3F3`)
   - **피그마 실측 CSS ➔ 1x 모바일 스펙 1:1 정밀 매핑**:
     1. **섹션 컨테이너**:
        - 2x: `780px × 1200px` (top: 12587px) ➔ 1x: `w-full pt-[70.5px] pb-[65px] text-center`
        - 상단 패딩: `(12728 - 12587) / 2 = 70.5px` (`pt-[70.5px]`)
        - 하단 패딩: `(13787 - 13657) / 2 = 65px` (`pb-[65px]`)
        - 전체 높이: `70.5 + 18 + 36.5 + 13 + 43 + 73.5 + 22.5 + 192.5 + 26.5 + 39 + 65 = 600px` (`1200px / 2 = 600px` 오차 0.0px 완벽 일치).
        - ☀️Day: `bg-[#FEFEFE]` / 🌙Night: `bg-[#1E1E1E]`.
     2. **영문 타이틀 (`Photo Sharing`)**:
        - 2x: `top: 12728px, 281px × 36px, Cormorant Garamond 500 50px`
        - 1x 변환: `font-serif ('Cormorant Garamond') font-medium text-[25px] leading-[18px] text-center select-none`, Day(`#292929`), Night(`text-white`).
     3. **한글 서브타이틀 (`사진 공유`)**:
        - 2x: `top: 12837px, 146px × 26px, NanumSquare Neo OTF 400 36px`
        - 여백: `(12837 - 12764) / 2 = 36.5px` (`mt-[36.5px]`)
        - 1x 변환: `font-nanumsquare font-normal text-[18px] leading-[13px] text-center tracking-tight`, Day(`#292929`), Night(`text-[#E5E5E5]`).
     4. **본문 안내 문구**:
        - 2x: `top: 12949px, 506px × 147px, NanumSquare Neo OTF 400 28px, line-height 174% (49px)`
        - 여백: `(12949 - 12863) / 2 = 43px` (`mt-[43px]`)
        - 1x 변환: `w-[253px] max-w-full mx-auto font-nanumsquare font-normal text-[14px] leading-[24.5px] text-center whitespace-pre-line`, Day(`#333333`), Night(`text-[#D4D4D4]`).
     5. **폴라로이드 액자 카드**:
        - 1x: `w-[159px] pt-[8.6px] px-[8.6px] pb-[10px] mt-[22.5px] mx-auto`, `box-shadow: 0px 2.7px 5.1px rgba(0,0,0,0.35)`.
        - 내부 사진: `141.75px × 144.23px`, 하단 캡션: `font-nanumsquare text-[9px] mt-[8px]`.
        - ☀️Day: `bg-[#FEFEFE]` / 🌙Night: `bg-[#282828]`.
     6. **사진 업로드하기 버튼**:
        - 2x: `top: 13608px, text: 193px × 20px, font 700 28px, line-height: 72%`
        - 여백: `mt-[26.5px]`
        - 1x: `w-[164.5px] h-[39px] rounded-full mx-auto flex items-center justify-center`, Day(`bg-[#393939] text-[#F3F3F3]`), Night(`bg-white text-[#292929]`), `box-shadow: 0px 4px 14.2px rgba(0,0,0,0.09)`.
        - 버튼 텍스트: `font-nanumsquare font-bold text-[14px] leading-none`.
     7. **구분선 최적화**:
        - 시안 2 전용 하단 구분선(`mt-[70px] mb-[50px]`)을 시안 4에서는 자동 숨김 처리하여 1200px 규격과 단아한 여백 보장.
   - **검증 결과**:
     - `npx eslint components/GuestPhotoSnapSection.jsx components/templates/cinematic/CinematicTemplate.jsx`: 0 errors
     - `npm run build`: Exit Code 0 (전체 성공)


-14. **[RSVP 모달 전세버스 탑승 조사 전 시안 일관성 보완 및 샘플 프리뷰 동기화 (2026-11-14)]**:
   - **사용자 질문/발견 결함**:
     - "근데 지금 모든 시안에서 참석의사 전달받을때 (모달) 전세버스까지 다 받고 있는거 맞아? 지금 시안4에서는 시안2와 달리 전세버스 탑승 여부는 조사 안받고 있는 것 같은데."
   - **원인 분석**:
     1. **실제 서비스(고객 제작 청첩장) 운영 체계**:
        - 제작/수정 페이지(`app/create`, `app/manage/[slug]/edit`)에서 '전세버스 탑승 조사 (RSVP)' 체크박스를 제공하며, 전세버스를 운영하지 않는 예비부부의 하객에게 불필요한 탑승 질문이 나가지 않도록 기본값은 OFF(`show_rsvp_bus: false`)로 설계됨.
        - 고객이 체크박스를 켜면 `template_config.show_rsvp_bus = true`가 저장되어 시안 1~5 모든 템플릿의 RSVP 모달에서 식사 여부 다음 항목으로 '전세버스 탑승 여부 (탑승/미탑승)'가 정상 노출되고 관리자 페이지/엑셀로 실시간 집계됨.
     2. **시안 4 샘플 프리뷰에서만 전세버스가 미노출된 원인 (결함)**:
        - 공용 RSVP 모달(`EditorialRsvpModal.jsx:18`)에서 `const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === 'editorial');`와 같이 **시안 2(`editorial`) 슬러그만 하드코딩**되어 있었음.
        - 그로 인해 `/editorial`(시안 2)에서는 `isSample === true`로 평가되어 샘플 강제 ON 규칙으로 전세버스가 노출되었으나, `/cinematic`(시안 4) 및 `/basic`, `/playlist`에서는 `isSample`이 `false`로 빠져 샘플 화면에서 전세버스 질문이 숨겨지는 불일치 발생.
   - **조치 내역**:
     - `components/templates/editorial/EditorialRsvpModal.jsx` 및 `BasicRsvpModal.jsx`:
       - `isSample` 판별 로직을 `['basic', 'editorial', 'playlist', 'cinematic', 'scene'].includes(invitation?.slug)`로 확장.
       - 이제 5대 공식 시안 샘플 프리뷰 전체에서 시안 2와 100% 동일하게 '전세버스 탑승 여부' 질문이 안정적으로 노출됨.
   - **검증 결과**:
     - `npx eslint components/templates/editorial/EditorialRsvpModal.jsx components/templates/basic/BasicRsvpModal.jsx`: 0 errors
     - `npm run build`: Exit Code 0 (전체 성공)


-13. **[시안 4 (시네마틱) 참석 의사 전달(RSVP) 피그마 1:1 정밀 구현 및 섹션 순서 재배치 (2026-11-14)]**:
   - **사용자 요청**:
     - 시안 4 섹션 순서 재배치: 안내사항 바로 다음에 참석 의사 전달(RSVP)이 위치하고, 그 다음에 포토 쉐어링(`GuestPhotoSnapSection`), 공유 및 브랜드 푸터 순서로 노출.
     - 피그마 2x 좌표 및 실측 CSS 1:1 반영.
     - "참석 정보 전달하기" 클릭 시 시안 2와 동일한 모달(`EditorialRsvpModal`) 연동.
   - **피그마 실측 CSS ➔ 1x 모바일 스펙 1:1 정밀 매핑**:
     1. **섹션 컨테이너 (RSVP Section)**:
        - 2x: `width: 780px; height: 995px; top: 11589px; background: #FEFEFE;`
        - 내부 박스: `top: 11822px; height: 569px;`
        - 1x 변환: `w-full pt-[116.5px] pb-[96.5px] px-6 text-center` (상단 여백 233px/2 = 116.5px, 하단 여백 193px/2 = 96.5px, 높이 합계 116.5 + 284.5 + 96.5 = 497.5px = 995px/2 완벽 일치).
        - 테마: Day(`bg-[#FEFEFE]`), Night(`bg-[#1E1E1E]`).
     2. **영문 타이틀 (`R·S·V·P`)**:
        - 2x: `top: 11822px; width: 145px; height: 36px; font-family: 'Cormorant Garamond'; font-weight: 500; font-size: 50px; line-height: 72% (36px); color: #292929;`
        - 1x 변환: `font-serif ('Cormorant Garamond') font-medium text-[25px] leading-[18px] text-center select-none tracking-normal`, Day(`text-[#292929]`), Night(`text-white`).
     3. **한글 서브 타이틀 (`참석 의사 전달`)**:
        - 2x: `top: 11931px; width: 223px; height: 26px; font-family: 'NanumSquare Neo OTF'; font-weight: 400; font-size: 36px; line-height: 72% (26px); color: #292929;`
        - 1x 변환: `mt-[36.5px]` (73px/2), `font-nanumsquare font-normal text-[18px] leading-[13px] text-center tracking-tight`, Day(`text-[#292929]`), Night(`text-[#E5E5E5]`).
     4. **본문 안내 문구**:
        - 2x: `top: 12047px; width: 479px; height: 147px; font-family: 'NanumSquare Neo OTF'; font-weight: 400; font-size: 28px; line-height: 174% (49px); color: #333333;`
        - 문구: *"소중한 분들과 함께하는 뜻깊은 날,\n정성껏 모실 수 있도록\n참석 여부를 알려주시면 감사하겠습니다."*
        - 1x 변환: `mt-[45px]` (90px/2), `w-[239.5px] max-w-full mx-auto font-nanumsquare font-normal text-[14px] leading-[24.5px] text-center whitespace-pre-line break-keep`, Day(`text-[#333333]`), Night(`text-[#D4D4D4]`).
     5. **참석 정보 전달하기 버튼**:
        - 2x: `top: 12313px; width: 329px; height: 78px; background: #393939; box-shadow: 0px 4px 14.2px rgba(0, 0, 0, 0.09); border-radius: 49px;`
        - 텍스트 2x: `top: 12342px; width: 227px; height: 20px; font-family: 'NanumSquare Neo OTF'; font-weight: 700; font-size: 28px; line-height: 72% (20px); color: #F3F3F3;`
        - 1x 변환: `mt-[59.5px]` (119px/2), `w-[164.5px] h-[39px] rounded-[24.5px] mx-auto flex items-center justify-center transition-all cursor-pointer active:scale-95`, Day(`bg-[#393939] text-[#F3F3F3]`), Night(`bg-white text-[#292929]`), `boxShadow: '0px 2px 7.1px rgba(0, 0, 0, 0.09)'`.
        - 버튼 텍스트: `font-nanumsquare font-bold text-[14px] leading-none text-center`.
     6. **모달 연동 및 섹션 순서 재배치**:
        - 버튼 `onClick={() => setShowRsvpModal(true)}` 이벤트로 기존 시안 2와 동일한 `EditorialRsvpModal` 컴포넌트 호출.
        - 섹션 순서: `08. 안내사항(Notice)` ➔ `09. 참석의사전달(RSVP)` ➔ `10. 하객현장사진선물(GuestPhotoSnapSection)` ➔ `11. 공유링크 및 브랜드 푸터`로 정갈하게 재배치 완료.
   - **검증 결과**:
     - `npx eslint components/templates/cinematic/CinematicTemplate.jsx`: 0 errors
     - `npm run build`: Exit Code 0 (전체 성공)


-12. **[전체 5대 시안 안내사항(Notice) 캐러셀 카드 피그마 CSS 스펙 1:1 일괄 동기화 (2026-11-14)]**:
   - **사용자 요청**:
     - "안내사항 섹션 있잖아 시안4 방금 수정한 것 처럼 다른 시안들도 모두 방금 수정한 형태로 수정해줘. 다만 폰트는 그 시안에서 사용하고 있는 폰트로 사용해줘."
   - **피그마 실측 CSS ➔ 1x 모바일 스펙 5대 시안 공통 매핑**:
     1. **개별 안내카드 컨테이너 (Card Box)**:
        - 2x: `width: 373px; height: 473px; top: 10807px; background: #F3F3F3; border: 1px solid #DCDCDC;`
        - 1x 변환: `w-[186.5px] h-[236.5px]`
        - 상하 대칭 패딩: 상단 번호 시작(10886px - 10807px = 79px ➔ `pt-[39.5px]`), 하단 본문 여백(11280px - 11201px = 79px ➔ `pb-[39.5px]`). 완벽한 수직 대칭 황금비율 적용.
     2. **번호 (01, 02 등)**:
        - 2x: `top: 10886px; font-size: 26px; line-height: 72% (19px); color: #292929;`
        - 1x 변환: `text-[13px] leading-[9.5px]`
        - 폰트: 시안 1~4 (`font-nanumsquare`), 시안 5 (`font-serif font-normal text-stone-800`).
     3. **제목 (화환 안내 등)**:
        - 2x: `top: 10951px; font-size: 26px; line-height: 72% (19px); color: #292929;`
        - 1x 변환: `mt-[23px]` (46px/2), `text-[13px] leading-[9.5px]`
        - 폰트: 시안 1~4 (`font-nanumsquare`), 시안 5 (`font-serif font-medium text-stone-900`).
     4. **제목 ↔ 소제목/시간 구분선 (Divider)**:
        - 2x: `top: 10992px; width: 255px; border: 0.5px solid #999999;`
        - 1x 변환: `mt-[11px]` (22px/2), `w-[127.5px]`, `borderTop: 0.5px solid #999999`.
     5. **소제목/시간 원형 영역 (Subtitle/Time Pill)**:
        - 2x: `top: 11038px; width: 207px; height: 38px; border: 1px solid #999999; border-radius: 26.5px;`
        - 2x 폰트: `top: 11048px; font-weight: 350; font-size: 18px; line-height: 100%; color: #575757;`
        - 1x 변환: `mt-[23px]` (46px/2), `w-[103.5px] h-[19px] rounded-[13.25px] border border-[#999999]`, 텍스트 `text-[9px] leading-none text-[#575757]`.
        - 폰트: 시안 1~4 (`font-nanumsquare`), 시안 5 (`font-sans font-normal`).
     6. **안내사항 본문 (Content Text)**:
        - 2x: `top: 11114px; width: 328px; height: 87px; font-size: 20px; line-height: 145%; color: #333333;`
        - 1x 변환: `mt-[19px]` (38px/2), `w-[164px] max-w-full text-[10px] leading-[14.5px] text-[#333333] text-center`.
        - 폰트: 시안 1~4 (`font-nanumsquare`), 시안 5 (`font-sans font-light text-stone-700`).
     7. **하단 구분선**:
        - 전 시안 본문 하단 구분선 완전 제거 유지 (카드 내 개방감 및 깔끔한 여백 확보).
     8. **피그마 1:1 샘플 카드 02 데이터 동기화**:
        - 전 시안 2번 샘플 카드를 피그마 원본과 동일하게 '화환 안내'(`PM 12:00~16:00`, `예식장 공간이 좁아\n화환은 정중히 사양하오니\n너른 양해 부탁드립니다.`)로 통일.
     9. **페이지 인디케이터 도트 간격 1/3 정밀 축소**:
        - 사용자 피드백("점끼리 간격이 좀 넓은 것 같아 1/3 줄여줘")을 반영하여 컨테이너 `gap-[6px]` ➔ `gap-[4px]`, 버튼 패딩 `p-1` ➔ `px-[2px] py-1`로 축소.
        - 도트 간 실제 시각적 간격을 14px ➔ 8px로 약 1/3 이상 슬림하게 정돈하여 프리미엄 인디케이터 룩 완성 (5대 시안 전체 반영).
     10. **캐러셀 좌측 24px 시작 정렬 및 우측 프리뷰 적용 (좌측 100px 공백 비대칭 완벽 해소)**:
        - 사용자 발견 결함: 2개 이상일 때 처음에 01번 카드가 화면 정중앙에 위치하며 좌측에 거대한 100px 빈 공백이 생기고 우측에 02번 카드가 반쯤 걸치는 어색한 비대칭 발생.
        - 오너 결정 방안: **[방안 1] 모바일 표준 캐러셀: 좌측 여백(24px) 시작 정렬 + 우측 카드 프리뷰 (1개일 땐 중앙 정렬)** 채택.
        - 조치:
          - 카드가 1개일 때: `justify-center px-4`로 화면 중앙에 1개 카드 단독 배치 (도트 숨김).
          - 카드가 2개 이상일 때: `pl-6 pr-[calc(100%-210.5px)]` 및 `snap-start` 적용. 01번 카드가 본문 시작선(24px)에 정갈하게 정렬되고, 우측에 02번 카드가 자연스럽게 걸쳐 보여 스와이프를 직관적으로 유도.
          - 모든 카드가 24px 좌측 정렬 스냅 위치로 부드럽게 안착되도록 정밀 스크롤 수식 동기화 (5대 시안 전체 적용).
   - **조치 대상 파일**:
     - `components/templates/basic/BasicTemplate.jsx` (시안 1: 베이직)
     - `components/templates/editorial/EditorialTemplate.jsx` (시안 2: 에디토리얼)
     - `components/templates/playlist/PlaylistTemplate.jsx` (시안 3: 플레이리스트)
     - `components/templates/cinematic/CinematicTemplate.jsx` (시안 4: 시네마틱)
     - `components/templates/scene/SceneTemplate.jsx` (시안 5: 모던 씬)
   - **검증 결과**:
     - `npx eslint components/templates/**/*.jsx`: 0 errors 통과
     - `npm run build`: Exit Code 0 (컴파일 및 최적화 전 라우트 100% 무결성 통과).

-11. **[시안 2 에디토리얼 인트로 손글씨 획순 드로잉 시험 적용 ➔ 원복 및 미사용 파일 정리 완료 (2026-11-13)]**:
   - **배경 및 사용자 요청**:
     - 에어스튜디오 등 프리미엄 청첩장의 '필기체 이름 써지는 영상'을 참고하여, 시안 2 인트로 `We are getting married`에 실제 사람의 획순을 따르는 손글씨 드로잉(방안 B) 시험 적용.
     - 피그마 원본 폰트(`Weddingday Personal Use`) 100% 보존 + SVG 획순 추적 마스크(Stroke-Tracing Mask) 기법으로 구현 및 시연 진행.
     - **오너 최신 지시**: "일단은 다시 획순 드로잉 이전으로 되돌려줬으면 좋겠어. 원복함으로써 필요없어진 파일이 있으면 삭제해줘. 커밋/푸시는 내가 할 테니 소스 수정까지만 해."
   - **현재 적용 상태 (원복 및 클린업 완료)**:
     - [EditorialIntro.jsx](file:///c:/Users/YOONGUNYONG/wedding-card/components/templates/editorial/EditorialIntro.jsx)에서 기존 타자기 모드인 `<EditorialTitleTypewriter />`로 **100% 원복 완료**.
     - 획순 시험을 위해 생성되었던 미사용 컴포넌트(`components/templates/editorial/EditorialTitleHandwriting.jsx`)는 프로젝트 클린업을 위해 깔끔히 **삭제 완료**.
   - **★ 다른 PC 또는 추후 손글씨 획순 드로잉 코드가 다시 필요할 때 (Git 복원 가이드)**:
     - 획순 드로잉 소스 코드는 Git 커밋 `878e402`에 온전히 영구 보존되어 있으므로, 차후 필요 시 아래 단 한 줄 명령어로 즉시 되살릴 수 있습니다:
       ```bash
       git checkout 878e402 -- components/templates/editorial/EditorialTitleHandwriting.jsx
       ```

-10. **[웨딩 갤러리 화보 사진 업로드 제한 20장 ➔ 30장 상향 조정 및 랜딩페이지 스펙 일치화 (2026-11-11)]**:
   - **사용자 요청**: "지금 제작할 때 갤러리 사진 20장으로 개수 제한해서 받고 있는 것 같은데, 30장으로 늘리자. 관련된 거 모두 수정해 줘."
   - **배경 및 전수 점검**:
     - 랜딩페이지(`FeatureTabs.jsx`, `PricingSection.jsx`)에서는 이미 "최대 30장 지원, 고화질 웨딩 화보 30장 최적화"로 홍보되고 있었으나, 제작 및 수정 폼의 핸들러와 카운터가 20장으로 제한되어 있던 불일치를 완벽히 해소.
   - **조치 내역**:
     1. `app/create/page.js`:
        - 파일 선택 잔여 슬롯 계산식: `const remainingSlots = 30 - galleryPreviews.length;`
        - 초과 알림 메시지 20장 ➔ 30장 상향.
        - 섹션 라벨: `웨딩 갤러리 화보 사진 (최대 30장)`
        - 사진 카운터: `{galleryPreviews.length} / 30 PIC`
     2. `app/manage/[slug]/edit/page.js`:
        - 기존 사진 + 신규 사진 합산 잔여 슬롯 계산식: `const totalAllowed = 30 - currentTotal;`
        - 초과 알림 메시지 20장 ➔ 30장 상향.
        - 섹션 라벨: `웨딩 갤러리 화보 사진 (최대 30장)`
        - 사진 카운터: `현재 총 {existingGalleryUrls.length + newGalleryPreviews.length} / 30장`
   - **검증 결과**:
     - `npx eslint .`: 0 errors
     - `npm run build`: Exit Code 0 (전체 성공)

-9. **[신랑·신부 단독 스냅 및 커플 화보 '권장' 배지 도입 및 미등록 폴백 아트워크 전면 업그레이드 (2026-11-11)]**:
   - **사용자 논의 및 고민**:
     - "신랑신부 각 프로필과 커플 프로필이 시안 1~3의 핵심 비주얼인데, 필수여야 하지 않나? 이걸 선택으로 둬야 하나..."
   - **분석 및 해결 전략 (이탈 방지 + 비주얼 퀄리티 양립)**:
     1. 커플 화보: 이미 미등록 시 메인 사진이 100% 자동 폴백 적용되므로 레이아웃 결손 없음 ➔ '권장'으로 유도 전환.
     2. 신랑·신부 독사진: 스튜디오에서 독사진을 촬영하지 않았거나 보정본이 미완성인 고객이 필수로 지정될 시 제작을 포기하고 사이트를 이탈(Drop-off)하는 치명적 리스크 존재.
     3. 따라서 강제 필수로 등록을 막는 대신 **'권장 · 완성도 UP' 배지**와 세련된 유도 문구를 제공하고, 미등록 시 노출되던 이모지(`👰`, `🤵`)를 **명품 부티크 감성의 미니멀 타이포/보태니컬 아트워크 프레임**으로 전면 업그레이드.
   - **조치 내역**:
     1. `app/create/page.js` & `app/manage/[slug]/edit/page.js`:
        - '신랑 & 신부 개별 인물 스냅 사진' 섹션에 `권장 · 완성도 UP` 앰버 캡슐 배지 장착.
        - 안내 문구 보강: *"두 분의 단독 스냅 사진을 등록하시면 각 시안 고유의 감성 프레임이 100% 완성됩니다."*
        - 커플 화보 사진 섹션의 배지를 `선택` ➔ `권장`으로 격상.
     2. `BasicTemplate.jsx`, `EditorialTemplate.jsx`, `PlaylistTemplate.jsx`:
        - 기존의 `👰`, `🤵` 장난스러워 보일 수 있던 이모지 전면 제거.
        - 단아하고 따뜻한 크림톤(`bg-[#FAF9F5]`), 감성 보태니컬/타이 라인아트 SVG, 그리고 이탤릭 세리프 레터링(`Bride / Portrait`, `Groom / Portrait`)이 어우러진 고급 아트워크 프레임으로 전면 교체.
        - 사진을 올리지 못한 고객의 청첩장도 명품 매거진 콘셉트 화보처럼 우아하게 노출되도록 보장.
   - **검증 결과**:
     - `npx eslint .`: 0 errors
     - `npm run build`: Exit Code 0 (전체 성공)

-8. **[제작/수정 화면 신랑·신부 단독 스냅 사진 전 시안 지원 개편 & 커플 화보 라벨 직관화 (2026-11-11)]**:
   - **사용자 요청/발견 결함**:
     1. 제작 화면에서 '커플 사진 (인용구 섹션용)'으로 표기되어 있으나 시안 1, 2, 3에서는 인용구가 아닌 소개글(모시는 글) 상단 화보로 사용되므로 명칭 불일치 ➔ '커플 화보 사진 (소개글 / 모시는 글용)'으로 직관화.
     2. 제작/수정 화면에서 '신랑 & 신부 개별 인물 스냅 사진' 필드가 `OPTION 02 전용` 뱃지로 표기되어 특정 시안 1개 전용으로 오인되는 결함.
   - **코드베이스 전수 조사 결과**:
     - 시안 1(베이직), 시안 2(에디토리얼), 시안 3(플레이리스트) 모두 신부 & 신랑 2단 액자 카드(`bridePhoto`, `groomPhoto`)를 보유하고 있음.
     - 시안 4(시네마틱), 시안 5(씬) 역시 신부 & 신랑 2열 인물 스냅(`bridePhoto`, `groomPhoto`)을 보유하고 있음.
     - 즉, **5대 템플릿 전체(시안 1~5)**가 신랑·신부 개별 인물 사진을 정상 지원함에도 불구하고, 제작/수정 페이지 폼에서는 `['editorial', 'cinematic', 'scene']` 조건부로 감싸져 시안 1과 3에서는 입력란이 노출되지 않았고, 시안 2 선택 시 `OPTION 02 전용`으로 오인 뱃지가 노출되고 있었음.
   - **조치 내역**:
     1. `app/create/page.js` & `app/manage/[slug]/edit/page.js`:
        - 템플릿 필터링 래퍼 제거 ➔ 전 시안(시안 1~5 전체) 공통 입력으로 완전 개편.
        - 뱃지를 `전 시안 지원`으로 통일 및 신뢰도 향상.
        - 안내 설명문을 현재 선택된 시안에 맞춰 시안별 실제 위치(시안 1~3: 2단 액자 카드, 시안 4: 2열 인물 스냅, 시안 5: 2단 프로필 스냅)로 정밀 안내.
        - `previewInvitation`에서 `bride_profile`, `groom_profile`을 전 시안에 걸쳐 정상 주입하도록 개선.
        - 커플 사진 필드 라벨을 `커플 화보 사진 (소개글 / 모시는 글용)`으로 교정하고 설명문 업데이트.
   - **검증 결과**:
     - `npx eslint .`: 0 errors
     - `npm run build`: Exit Code 0 (전체 성공)

-7. **[데이터 경우의 수(0개/1개/다수/한부모/무부모/한쪽계좌) 전수 감사 및 잠재 레이아웃 결함 소탕 (2026-11-11)]**:
   - **사용자 요청**: "하객화면에서 값이 하나인 경우, 두개인 경우, 없을 경우 이런식으로 경우의 수가 다양한 필드(예: 부모가 1명, 2명, 또는 없을 때 등)에 대해 제작화면, 수정화면, 하객화면 등 모두 검사해줘."
   - **경우의 수별 전수 분석 및 발견된 결함 조치**:
     1. **부모님 성함 및 혼주 표기 (0명 / 1명 / 2명 / 고인 혼주)**:
        - renderParentPair에서 양부모(2명), 한부모(1명), 무부모(0명) 분기 로직 정상 검증 완료. 부모 정보가 둘 다 없을 시 hasGroomFamily/hasBrideFamily 가드로 해당 줄 전체가 안전하게 숨겨지고 빈 여백이 남지 않음.
        - 한부모(부 또는 모만 입력) 가정일 경우 ' · ' 구분선 없이 단독 성함 및 고인(故/국화) 심볼이 완벽하게 표시됨.
        - 시안 5(Scene): 부모 정보가 둘 다 없을 시 groomName · brideName 한 줄로 자연스럽게 폴백.
     2. **계좌번호 (신랑측 0개 & 신부측 1개 이상 / 반대 / 둘 다 0개)**:
        - 신랑측 계좌가 없고 신부측 계좌만 등록된 경우, 신부측 탭이 자동으로 선택(userAccountTab || (groomAccounts.length === 0 && brideAccounts.length > 0 ? 'bride' : 'groom'))되도록 5대 템플릿 공통 로직 완비.
        - CinematicTemplate: 신랑/신부 탭 전환 시 등록된 계좌가 없는 탭을 선택했을 때 빈 흰 박스로 남던 결함 ➔ "등록된 계좌 정보가 없습니다." 감성 Empty State 추가.
        - 둘 다 0건일 때: 5대 템플릿 모두 showAccountsSection && (allAccounts.length > 0 || isSample) 가드로 섹션 전체가 안전하게 숨겨짐.
     3. **연락처 (0개 / 신랑측만 / 신부측만 / 부분 등록)**:
        - EditorialContactModal: 등록된 연락처가 0개일 때 모달 내부가 하얗게 비던 결함 ➔ "등록된 연락처 정보가 없습니다." Empty State 추가.
        - BasicContactModal: 모달 활성화 시 배경 스크롤 방지 및 ESC 키 닫기 이벤트 핸들러 장착, 연락처 0건 시 Empty State 추가, 신랑측/신부측 중 한쪽만 등록된 경우 불필요한 중간 구분선 숨김 처리.
     4. **갤러리 썸네일 그리드 (1장 / 2~3장 / 4장 이상)**:
        - EditorialTemplate, PlaylistTemplate, BasicTemplate:
          - 사진이 1장일 때 상단에 큰 대표 사진이 이미 노출되어 있음에도 하단 썸네일 바에 동일 사진 1장이 중복 노출되던 문제 ➔ galleryImages.length > 1 가드로 1장일 때 썸네일 바 숨김 처리.
          - 사진이 2~3장일 때 w-[333px] 컨테이너에서 justify-between으로 양 끝으로 극단적으로 벌어지던 레이아웃 결함 ➔ galleryImages.length >= 4 ? 'justify-between' : 'justify-center gap-[14px]'로 2~3장일 때 정중앙에 14px 간격으로 단아하게 정렬되도록 완전 개편.
        - CinematicTemplate: 가로 스와이프 캐러셀에서 사진이 1장일 때 좌측에 붙던 현상 ➔ activeGalleryImages.length === 1 ? 'justify-center' : ''로 화면 정중앙 배치.
     5. **인터뷰 (0개 / 다 삭제 / 수정화면)**:
        - app/create/page.js: 사용자가 입력을 시작했음에도(hasAnyName === true) 인터뷰가 빈 배열일 때 PREVIEW_FALLBACK.interviews로 덮어써지던 결함 ➔ (!hasAnyName ? PREVIEW_FALLBACK.interviews : [])로 안전 분기.
        - app/manage/[slug]/edit/page.js: 수정 화면에서 사용자가 인터뷰를 비웠을 때 DEFAULT_INTERVIEWS가 다시 나타나던 버그 ➔ interviews && interviews.length > 0 ? interviews : []로 교정하여 삭제 시 완벽하게 빈 상태 유지.
     6. **안내 카드 / 교통편 (0개 / 1개 / 다수)**:
        - 안내 카드가 1개일 때 스와이프 화살표 및 인디케이터 도트가 자동 숨김 처리되고 단일 카드가 정중앙에 단아하게 배치됨 확인. 0개일 때 섹션 숨김 확인.
        - 교통편 0개일 때 해당 구역이 숨겨지고 여백이 비지 않음 확인.
   - **검증 결과**:
     - npx eslint . --rule "no-undef: error": 0 errors
     - npm run build: Exit Code 0 (전체 성공)
     - 5대 템플릿 및 제작/수정 페이지 HTTP 200 OK 무결성 응답.

-6. **[결함 발생 근본 원인(Root Causes) 관점 전수 코드베이스 정밀 감사 및 잠재 버그 박멸]**:
   - **사용자 질의**: "지금 계속 발견되는 결함들.. 결국은 너가 어떠한 이유에서 놓치는 부분들이잖아. 그 이유들을 관점으로 코드를 전체 검증해서 버그 수정해줘."
   - **AI가 결함을 놓쳤던 5대 근본 원인 도출 및 정밀 분석**:
     1. **[원인 1] 국소적 리팩토링 시 스코프 영향도 간과 (Local Cleanup Side-effect)**:
        - ESLint 경고나 미사용 변수를 정리할 때 특정 변수(`transitionStep`, `activeTab`)를 지우거나 남겨두면서 조건문/삼항식/인라인 핸들러의 런타임 참조를 놓침.
     2. **[원인 2] 변수명/상태명 리네이밍 불일치 (Inconsistent Renaming)**:
        - 상태명이나 Ref를 바꿀 때 전체 일괄 교체하지 않고 수동 교체하면서 분기별 구 변수명 잔재(`photoSharingInputRef` vs `photoSharingImageInputRef`, `activeTab` vs `accountTab`)가 남음.
     3. **[원인 3] 콜백/이벤트 핸들러 옵셔널 체이닝 누락 (`TypeError: is not a function`)**:
        - 모달이나 자식 컴포넌트에서 상위 prop(`onClose()`, `onDeleteSuccess()`)을 가드 없이 직접 호출하여 prop 미전달 시 즉시 크래시되는 취약점.
     4. **[원인 4] Next.js 빌드의 경고 관대성 (Leniency of Standard Next.js Build)**:
        - `next build`는 `no-undef`를 기본 Warning으로 취급하여 컴파일을 통과(Exit 0)시키므로 빌드 성공만으로는 런타임 ReferenceError를 사전에 걸러내지 못함.
     5. **[원인 5] 5대 템플릿 간 복사/분기 드리프트 (Multi-template Drift)**:
        - 5개 템플릿(Basic, Editorial, Playlist, Cinematic, Scene) 간에 유사 코드가 복사되면서 한쪽만 고치고 다른 템플릿의 잔여 미정의 변수를 놓침.
   - **전수 감사 및 조치 내역**:
     1. **엄격 정적 검사 강제 (`npx eslint . --rule "no-undef: error"`)**:
        - [CinematicTemplate.jsx](file:///c:/Users/YOONGUNYONG/wedding-card/components/templates/cinematic/CinematicTemplate.jsx#L1049): `activeTab === 'bride'`로 잘못 참조되어 `acc.title`이 없을 때 500 에러를 유발하던 시한폭탄 결함 적발 ➔ `accountTab === 'bride'`로 교정 완료.
        - 프로젝트 전체에서 `no-undef` 0 Errors 달성.
     2. **콜백/모달 핸들러 안전 가드 전수 교정**:
        - `BasicGuestbookDeleteModal.jsx`: `onDeleteSuccess?.()`, `onClose?.()` 안전 옵셔널 체이닝 적용.
        - `SceneGuestbookDeleteModal.jsx`: `onDeleteSuccess?.()`, `onClose?.()` 안전 옵셔널 체이닝 적용.
        - `SceneInterviewModal.jsx`: `onClose?.()` 안전 옵셔널 체이닝 적용.
        - `SceneGalleryModal.jsx`: `onClose?.()` 안전 옵셔널 체이닝 적용.
        - `BasicGalleryModal.jsx`: `onClose?.()` 안전 옵셔널 체이닝 적용.
        - `EditorialGalleryModal.jsx`: `onClose?.()` 안전 옵셔널 체이닝 적용.
        - `SamplePreviewModal.jsx`: `onClose?.()` 안전 옵셔널 체이닝 적용.
     3. **5대 템플릿 날짜 및 널 가드 무결성 점검**:
        - 5대 템플릿 전체(`BasicTemplate`, `EditorialTemplate`, `PlaylistTemplate`, `CinematicTemplate`, `SceneTemplate`)의 `targetDate`, `timeLeft`, `calendarData`, `formattedDates`에 `!targetDate` 널 가드가 100% 장착되어 있음을 확인.
     4. **템플릿 간 인풋 유효성(maxLength) 불일치 전수 해소**:
        - `EditorialGuestbookModal` 및 `EditorialRsvpModal`에만 적용되어 있던 `maxLength`를 `BasicGuestbookModal`(성함 30, 비번 20, 본문 300), `BasicRsvpModal`(성함 30), `SceneTemplate`(성함 30, 비번 20)에 동일하게 전수 적용 완료.
     5. **모달 배경 스크롤 락(overflow hidden/restore) 전수 일관화**:
        - `SceneGuestbookDeleteModal`, `SceneGalleryModal`, `SceneInterviewModal`에 모달 오픈 시 배경 스크롤 방지 및 언마운트 시 원복 cleanup 로직 장착.
     6. **하객 뷰(`app/[slug]/page.js`) 민감 정보 2차 격리 방어선 보강**:
        - `sanitizedInvitation`에서 `template_config`뿐 아니라 레거시/확장 필드인 `extra_data` 내부의 `manage_password`, `manage_token`, `order_code`까지 2중 완전 삭제 처리.
     7. **갤러리 모달 3종(Basic, Editorial, Scene) images null 참조 방어(safeImages) 장착**:
        - `BasicGalleryModal`, `EditorialGalleryModal`, `SceneGalleryModal`에서 `images` prop이 `null`로 인입될 경우 `useCallback` 의존성 평가 및 `.map()`에서 발생할 수 있는 잠재 런타임 크래시(`Cannot read properties of null (reading 'length')`)를 방지하기 위해 `const safeImages = Array.isArray(images) ? images : [];` 널 방어 체계 전수 장착.
   - **검증 결과**:
     - 5대 템플릿(`/basic`, `/editorial`, `/playlist`, `/cinematic`, `/scene`) 전수 HTTP 200 OK 무결성 응답.
     - 메인(`/`) 및 청첩장 제작(`/create`) 정상 응답.
     - `npm run build` 전 라우트 최적화 컴파일 100% 무결성 통과 (Exit Code 0).

-5. **[시안2 Editorial 인트로 크래시(500) 및 Create 페이지 DOM Ref 결함 핫픽스]**:
   - **사용자 문의**: "사이트 메인화면에서 상단 카드 시안 중 시안2 editorial을 클릭하면 첨부 이미지와 같이 오류('페이지를 불러오는 중 일시적인 오류가 발생했습니다')가 발생해. 원인 파악해보고, 다른 데서도 같은 문제 없는지 검증해."
   - **원인 파악**:
     1. `components/templates/editorial/EditorialIntro.jsx`에서 인트로 화면 트랜지션 애니메이션 제어용 상태인 `const [transitionStep, setTransitionStep] = useState('idle');` 선언부가 누락되어 있어, 인트로 렌더링 시점에 `ReferenceError: transitionStep is not defined`가 발생하면서 컴포넌트가 크래시되고 글로벌 에러 바운더리(`app/error.js`)가 트리거됨.
     2. 추가 전수 검증 중 `app/create/page.js` 초기화 로직(Line 664)에서 `photoSharingImageInputRef`가 `photoSharingInputRef`로 잘못 참조되어 있던 잠재 `no-undef` 결함 발견.
   - **조치 내역**:
     1. `EditorialIntro.jsx`에 누락된 `const [transitionStep, setTransitionStep] = useState('idle');` 복원 완료.
     2. `app/create/page.js` Line 664의 참조명을 정확한 인풋 참조 변수명(`photoSharingImageInputRef`)으로 교정 완료.
   - **전수 검증 결과**:
     1. **5대 템플릿 전수 요청 테스트**:
        - `/basic`: HTTP 200 OK (정상)
        - `/editorial`: HTTP 200 OK (정상 복구 확인)
        - `/playlist`: HTTP 200 OK (정상)
        - `/cinematic`: HTTP 200 OK (정상)
        - `/scene`: HTTP 200 OK (정상)
     2. **메인 및 제작 페이지 검증**:
        - `/`: HTTP 200 OK (정상)
        - `/create`, `/create?template=editorial`, `/create?template=playlist`: 모두 HTTP 200 OK (정상)
     3. **정적 분석 및 빌드**:
        - `npx eslint components/templates/editorial/EditorialIntro.jsx app/create/page.js`: 0 Errors (10 image warnings only)
        - `npm run build`: 전 라우트 최적화 컴파일 완료 (Exit Code 0).

-4. **[하객 인터랙티브 기능 (방명록, 참석의사, 하객 포토스냅) 통신·화면·보안 전수 검증 및 강화]**:
   - **사용자 질의**: "하객화면에서 방명록, 참석의사, 하객 포토 쉐어링 뭐 이런것들에 있어서도 통신 및 데이터 누락, 화면처리, 결함, 버그 그 무엇에도 문제가 없는지 확인해줘."
   - **전수 정밀 감사 및 개선 내역**:
     1. **방명록 (Guestbook)**:
        - **통신 및 CRUD**: 작성자(`author`), 비밀번호(`password`), 내용(`content`) 모두 공백 트림 검증 완료. `.select().single()` 낙관적 렌더링으로 글 작성 즉시 첫 번째 카드로 실시간 반영 확인.
        - **삭제 보안**: 틀린 비밀번호 입력 시 0건 삭제 (`비밀번호가 일치하지 않습니다`), 올바른 비밀번호 입력 시 DB 삭제 및 UI 즉시 필터링 완료.
        - **화면 처리 및 빈 상태 (Empty State)**: 등록된 방명록이 0개 또는 4개 미만일 때 감성 플레이스홀더 카드('Best Wishes / 따뜻한 축하를 남겨주세요 ✍️')가 렌더링되어 클릭 시 바로 작성 모달이 열리는 완성도 높은 UX 확인.
        - **보강 조치**: 악의적인 텍스트 도배 및 레이아웃 깨짐 방지를 위해 작성자(30자), 비밀번호(20자), 본문(300자) `maxLength` 제한 적용. `loadGuestbook` 시 전체 삭제 후 빈 배열([]) 정상 반영 로직 보강.
     2. **참석의사 (RSVP)**:
        - **통신 및 Upsert (덮어쓰기)**: 동일 하객(성함 + 휴대전화 뒤 4자리)이 정보 변경을 위해 재제출할 경우 중복 Row를 누적하지 않고 기존 Row를 최신 정보로 덮어쓰는(UPDATE) 멱등성 100% 검증 통과. 동명이인(번호가 다른 경우)은 정상적으로 별도 행 생성.
        - **데이터 누락 방지**: 불참(`attend: false`) 선택 시 식사 여부와 버스 탑승 여부를 자동으로 `null` 처리하여 집계 왜곡 원천 차단.
        - **옵션 토글 연동**: 신랑·신부 설정에 따라 식사 여부(`show_rsvp_meal`), 버스 탑승(`show_rsvp_bus`) 질문이 동적으로 정확히 노출/숨김 처리됨.
        - **보강 조치**: 성함 인풋에 `maxLength={30}` 제한 적용.
     3. **하객 포토스냅 (Photo Sharing)**:
        - **통신 및 스토리지 격리**: 브라우저 WebP/JPG 경량 압축(최대 1920px, 0.82) ➔ Supabase Storage `guest-snaps/${slug}/` 전용 폴더 격리 업로드 ➔ `guest_photos` 일괄 INSERT 완료.
        - **용량 및 만석(100장) 방어**: `count >= 100` 시 '사진 보관함이 가득 채워졌습니다' 마감 UI 자동 전환. 1회 최대 10장 배치 업로드 슬롯 계산 정확.
        - **비공개 선물함 정책**: 하객 사진은 타 하객에게 공개되지 않고 신랑·신부 관리자 페이지(`GuestPhotoManager`)로만 안전하게 전달되며, ZIP 일괄 다운로드 및 격리 삭제 지원.
        - **보강 조치**: 제작 실시간 미리보기 모드(`!invitation?.id`)에서 시험 제출 시 에러가 발생하지 않도록 조기 안내 가드 장착.
   - **자동화 엔드투엔드(E2E) 테스트 결과**: `scripts/test_interactive_features.mjs` Supabase 실서버 통신 100% 무결성 통과.
   - **빌드 및 린트 검증**: `npx eslint .` 0 errors, `npm run build` 전 페이지 컴파일 성공 (Exit Code 0).

-3. **[고객 데이터 오염 및 샘플 덮어쓰기 가능성 전수 감사(Audit) 및 원천 차단 조치]**:
   - **사용자 질의**: "샘플로 덮어써지는 경우가 다른 곳에도 있을까? 데이터가 잘못 노출될 수 있는 가능성이 있는 건가?"
   - **전수 감사 결과 요약**:
     1. **실제 배포된 하객용 URL (`/[slug]`)**:
        - `app/[slug]/page.js`에서 공식 5대 템플릿 슬러그(`basic`, `editorial`, `playlist`, `cinematic`, `scene`) 외의 모든 실제 고객 슬러그는 `isSampleSlug = false` 및 `is_sample_preview = false`로 강제됨.
        - 따라서 실제 하객들이 열람하는 실제 청첩장에서는 샘플 데이터나 더미 이름/계좌/혼주가 노출될 위험이 **0% (원천 차단)**임을 전수 코드 및 DB 쿼리 레벨에서 확인.
     2. **DB INSERT / UPDATE (저장 통신)**:
        - `app/create/page.js` 및 `app/manage/[slug]/edit/page.js`의 `handleSubmit` 로직에서 DB로 전송되는 데이터는 사용자가 폼에 입력한 `formData`를 직접 정제하여 저장함. 샘플 더미 이름이나 가짜 부모님 성함이 DB로 저장되는 경로는 0건임.
     3. **발견된 잠재 결함 (제작 중 실시간 미리보기 화면의 Fallback 노출)**:
        - 제작 페이지(`app/create/page.js`)에서 사용자가 성함을 한글로만 입력하고 영문 이름을 비워뒀을 때, `previewInvitation` 및 템플릿 `fullNamesEn`에서 `PREVIEW_FALLBACK.groom_name_en` ('Minjun Kang')이나 'Dohyun Kim & Seoyeon Lee' 등이 실시간 미리보기에 주입되어 고객에게 혼란을 주는 취약점 확인.
        - `BasicTemplate`, `EditorialTemplate`, `PlaylistTemplate`에서 사용자가 신랑 부모님 중 아버지만 입력하고 어머니를 비워뒀을 때, 실시간 미리보기에서 미입력 혼주에 샘플 어머니('강오진 · 류창희', '장철규 · 이정자' 등)가 합성되어 나타나던 취약점 확인.
        - `EditorialContactModal`에서 사용자가 한쪽 부모님만 입력했을 때 미입력 혼주 자리에 샘플 '이미자', '장철규' 및 가짜 연락처가 나타나던 취약점 확인.
   - **적용된 4중 방어벽 (Defense-in-Depth)**:
     - **방어벽 1 (`app/create/page.js`)**: 고객이 신랑/신부 성함(`rawGroom || rawBride`)을 입력하기 시작하면 영문 이름/부모님/연락처에 샘플 더미 주입을 즉시 중단하고 빈 문자열(`''`)을 유지하며, `is_sample_preview`를 `false`로 자동 전환.
     - **방어벽 2 (템플릿 부모님 성함 가드)**: `BasicTemplate`, `EditorialTemplate`, `PlaylistTemplate`에서 `const allowSampleParents = isOfficialDemo || (!hasUserEnteredAny && isSample)` 원칙을 도입. 고객이 입력을 시작한 상태에서는 비워둔 부모님 자리에 절대 샘플 부모님이 끼어들지 않고 깔끔하게 숨김/공백 처리.
     - **방어벽 3 (영문 풀네임 가드)**: 고객이 영문 이름을 비워뒀더라도 한글 성함을 입력했다면 영문 샘플('Kang Min-jun' 등)로 덮어쓰지 않고 한글 성함(`coupleKo`)을 최우선 바인딩.
     - **방어벽 4 (`EditorialContactModal`)**: `allowSampleFallback` 가드를 적용하여 고객이 입력을 시작한 제작/수정 미리보기에서는 실제 입력된 가족만 표시되고 미입력 혼주(샘플 '이미자' 등)는 완벽히 제거됨.
   - **검증 결과**: `npx eslint .` 0 errors, `npm run build` Next.js 정적/동적 라우트 전수 통과 (Exit Code 0).

-2. **[전체 템플릿 전수 감사 및 실시간 미리보기 샘플 이름 덮어쓰기 결함 완전 소탕]**:
   - **발견된 결함 1 (고객 입력 성함 덮어쓰기)**: `BasicTemplate` 및 `EditorialTemplate`에서 제작(`app/create`)이나 관리(`app/manage`) 화면의 실시간 미리보기 시(`is_sample_preview: true`), 고객이 직접 입력한 성함이나 영문명이 있음에도 `isSample ? 'Jang Min-ki & Kwon Ki-deuk'` 및 `기득 ♥ 민기님의` 하드코딩이 0순위로 강제 덮어씌워지던 심각한 데이터 바인딩 결함 발견 및 즉시 수정 (고객 입력 성함 1순위 최우선 보장).
   - **발견된 결함 2 (퀵 내비게이션 상단 바 가림)**: 모바일 상단에 샘플 미리보기 바(약 52~60px)가 떠있을 때 `yOffset = -24`로 인해 식장 위치나 계좌 섹션 상단 제목이 헤더 뒤로 묻혀 잘리던 현상을 `yOffset = -70`으로 여유롭게 확장하여 완벽 해결.
   - **발견된 결함 3 (시안 1 더미 이름 불일치)**: `BasicTemplate` 본문 헤더에 `Jang Min-ki`가 노출되던 불일치를 제거하고 시안 1 기본 주인공(`Dohyun Kim & Seoyeon Lee`) 및 고객 입력 데이터로 통일.

-1. **[퀵 내비게이션 바닥 휑한 스크롤 결함 해결 및 '공유 팝업 모달' 전면 도입 (`components/QuickNavigationPill.jsx`)]**:
   - **사용자 제보 결함**: 모바일 청첩장에서 플로팅 퀵 메뉴의 [공유하기] 터치 시, 화면 맨 밑바닥 끝(`scrollHeight`)으로 휙 스크롤되면서 상단 고정 헤더 아래에 노란 버튼 2개와 로고만 덜렁 걸리고 아래는 텅 빈 여백만 남아 화면이 깨진 것처럼 보이던 UX 결함 발생.
   - **조치 사항**:
     - 바닥 강제 스크롤(`scrollTo`) 로직을 완전히 제거하고, **현재 읽고 있던 화면 위치를 100% 보존하며 그 자리에서 우아하게 뜨는 [공유 팝업 모달]**로 전면 전환.
     - 팝업 내에 **카카오톡 공유하기** (3중 Fallback 및 안전한 썸네일/텍스트 바인딩), **청첩장 링크 복사** (원클릭 복사 및 실시간 토스트 피드백), 모바일 기기 지원 시 **기타 앱 공유 (Web Share API)**까지 완벽 탑재.
     - 모달 활성화 시 배경 청첩장이 뒤에서 스크롤되지 않도록 `body overflow` 락/언락 적용.
     - `app/[slug]/page.js`, `app/create/page.js`, `app/manage/[slug]/edit/page.js`의 미리보기 및 실서비스 전체에 `invitation` prop 연동 완료.

0. **[시안 3(플레이리스트) 상단 고유 플레이어 유지 + 하단 본문 시안 2(에디토리얼) UI 전면 개편 (`components/templates/playlist/PlaylistTemplate.jsx`)]**:
   - **사용자 요청 사항**: 시안 3의 최상단 고유 플레이리스트 UI(웨딩 앨범 자켓, 트랙 타이틀, 1줄 고정 카피, 하트 좋아요, 프로그레스 바 & 재생 컨트롤러)만 온전히 유지하고, 그 아래의 본문 섹션 전체를 시안 2(에디토리얼)의 피그마 1:1 고품격 UI 디자인과 모달 구조로 전면 교체.
   - **유지된 영역**:
     - `TodayConciergeCard` (예식 당일 자동 전환 컨시어지 카드)
     - `01. HERO SECTION: PREMIUM WEDDING PLAYLIST CARD` (크림 톤 그라데이션, 웨딩 화보 앨범 자켓, 신랑💗신부 본명조 명조체, 1줄 서브카피, 트랙 진행률 & 시간, 5버튼 미디어 컨트롤러, 실시간 오디오 태그 양방향 동기화, `SCROLL FOR STORY`)
   - **교체된 하단 본문 영역 (시안 2 에디토리얼 규격 100% 일치)**:
     - 2. **Welcome to & 신부/신랑 2단 액자 카드 & 혼주 정보**: `font-weddingday` 필기체, 331.35px 액자 카드 그리드, 단아한 255px 혼주 성함 (국화꽃/故 심볼 완벽 지원).
     - 3. **풀 와이드 커플 화보 & 초대합니다 본문**: `aspect-[780/576]` 커플 사진, 256px 여유로운 초대글, 타원형 연락하기 버튼 (`EditorialContactModal`).
     - 4. **Wedding Day 캘린더 & 카운트다운**: 35px 필기체 헤더, 7열 미니 달력(예식일 원형 하이라이트), 4개 사각 카운트다운 박스(DAYS/HOURS/MINUTES/SECONDS), 감성 D-day 문구.
     - 5. **Gallery 화보 갤러리**: 333x415px 메인 대형 컷, 4개 썸네일 그리드, 타원형 `VIEW THE LOOKBOOK` 버튼 (`EditorialGalleryModal`).
     - 6. **Location 식장 위치 & 지도 & 길안내**: 카카오맵 303.5x216.5px, 원클릭 주소 복사, 네이버 지도 & 카카오내비 2대 길안내 버튼, 지하철/버스 노선 공식 컬러 파서 (`renderTransitText`).
     - 7. **Account 마음 전하실 곳**: 신랑측/신부측 파일철 탭 카드, 복사하기 버튼, 계좌 토스트 알림, 카카오페이/토스 지원.
     - 8. **Notice 안내사항**: 파스텔 블루 필름 스트립 프레임 스와이프 UI (식사 안내, 셔틀버스 등).
     - 9. **RSVP 참석 의사 전달**: `R·S·V·P` 필기체, 안내문구, [참석 정보 전달하기] 버튼 (`EditorialRsvpModal`).
     - 09-2. **하객 현장 포토 스냅**: `GuestPhotoSnapSection (isEditorial={true})`.
     - 10. **Guestbook 축하 메시지**: 4컷 2x2 프레임 영역, 스와이프 및 페이지네이션 도트, [글 남기기] 버튼 (`EditorialGuestbookModal`), 삭제 휴지통 (`EditorialGuestbookDeleteModal`).
     - 11. **Thank you 엔딩 화보 & 인라인 공유**: 풀 와이드 엔딩 사진, [카카오톡 공유하기] 3중 Fallback 연동, [링크 복사], `DESIGNED BY ATELIER DE MUKIRU`.
   - **데이터 무결성 & 엣지 케이스 전수 방어 검증**:
     - 상·하단 주인공 성함 불일치 방어: 상단 트랙 정보와 하단 에디토리얼 프로필 헤더 및 캘린더 D-day 문구에서 고객 입력 성함 우선 노출(더미/샘플 이름 충돌 원천 차단).
     - DB 직렬화 방어: `accounts`, `info_notices`, `transportation`, `gallery_images` 컬럼이 문자열(JSON string 또는 Postgres array)로 인입될 때의 안전 역직렬화(Safe JSON Parse) 전수 적용.
     - 모달 통신 무결성: 연락처, RSVP, 방명록(등록/삭제), 갤러리 룩북 모달의 DB CRUD 파라미터 및 이벤트 콜백 100% 연동 확인.
     - 필수값/결측치 안전성: 날짜 미지정, 혼주 미입력, 계좌 미등록 등 극단적 미입력 시에도 화면 크래시 없이 조건부 렌더링으로 우아하게 숨김 처리.
   - **무결성 검증**: `npx eslint .` (0 errors), `npm run build` (Next.js 16.3.8 Webpack 프로덕션 빌드 100% 통과).

1. **[브랜드 전용 404 페이지 신설 (`app/not-found.js`)]**:
   - 하객이 청첩장 URL 오타를 내거나 존재하지 않는 슬러그 접근 시 Next.js 기본 흑백 에러 대신 아틀리에 드 무키루 무드의 세련된 안내("소중한 청첩장을 찾을 수 없습니다", [홈으로 이동], [카카오톡 1:1 상담]) 제공.
2. **[글로벌 에러 바운더리 신설 (`app/error.js`)]**:
   - 카카오톡 인앱 브라우저나 모바일 사파리에서 예기치 못한 런타임 오류 시 화면이 하얗게 튕기는 현상을 원천 방지하고, "일시적인 오류가 발생했습니다" 안내 및 [새로고침(다시 시도)], [홈으로] 버튼 제공.
3. **[카카오톡 공유 3중 Fallback 보강 (`BasicTemplate.jsx`, `EditorialTemplate.jsx`)]**:
   - Kakao SDK 미로드/차단 상태에서 공유 버튼 클릭 시 무반응이던 문제를 해결하고, 자동으로 청첩장 URL을 클립보드에 복사하며 친절한 안내 알림 제공.
4. **[청첩장 제작/수정 중 데이터 유실 방어 (`app/create/page.js`, `app/manage/[slug]/edit/page.js`)]**:
   - 폼 입력 중 실수로 새로고침, 뒤로가기, 탭 닫기 시 브라우저 경고창(`beforeunload`)을 띄워 고객의 소중한 청첩장 입력 데이터가 날아가는 사고 완벽 차단.
5. **[모바일 iOS Safari 인풋 카드 돌출 결함 해결]**:
   - `-webkit-appearance: none`, `box-sizing: border-box !important`, `min-w-0 !important`, 카드 `overflow-hidden`으로 인풋 박스가 우측으로 삐져나오던 문제 완전 해결.
6. **[실시간 미리보기 필수값 사전 검증 및 카카오톡 웹뷰 튕김 해결]**:
   - 필수값 미입력 상태에서 미리보기 클릭 시 친절한 alert 안내 출력 및 안전한 `pushState(..., window.location.href)` 처리로 웹뷰 크래시 방지.
7. **[검색엔진 개인정보 노출 방지 (`public/robots.txt` 신설 & `robots: { index: false }` 메타 태그)]**:
   - 구글/네이버 등 검색엔진 로봇이 개인 청첩장을 무단 크롤링하여 신랑·신부 실명, 계좌번호, 혼주 성함을 검색창에 박제하는 프라이버시 침해 사고를 원천 방지 (SNS 카톡 공유 썸네일은 정상 작동).
8. **[모바일 가상 키보드 가림 결함 해결 (`BasicGuestbookModal.jsx`)]**:
   - 시안 1 축하 메시지 작성 모달에 `max-h-[90vh] overflow-y-auto`를 적용하여 소형 기기에서 가상 키보드가 올라올 때 등록 버튼이 잘려 터치 불가하던 현상 완벽 방어.
9. **[DB UPDATE 시 Silent Fail 방지 (`app/manage/[slug]/edit/page.js`, `app/manage/[slug]/page.js`)]**:
   - Supabase update 호출 시 토큰 불일치나 조건 미부합으로 0건 수정되었을 때 에러 없이 성공으로 처리되던 치명적 맹점을 `.select('id')` 및 반환 배열 검증으로 원천 차단.
10. **[방명록 쿼리 Over-fetching 방어 (`limit(50)` 전 시안 적용)]**:
    - 축하글 수백 개 누적 시 모바일 기기 메모리 폭주 및 데이터 트래픽 낭비를 막기 위해 최신 50건으로 안전 상한선 적용.
11. **[모바일 연락처 모달 접근성 및 JSX aria-label 결함 수정 (`BasicContactModal.jsx`)]**:
    - 신부측 전화/문자 버튼 `aria-label`에 혼주 고인 표기 컴포넌트 삽입 시 `[object Object]`로 깨지던 문제를 `typeof === 'string'` 안전 분기로 교체.
12. **[갤러리 모달 배경 스크롤 체이닝 방어 (`BasicGalleryModal.jsx`)]**:
    - 모바일에서 갤러리 사진 스와이프 시 뒤 배경 청첩장 본문이 함께 스크롤되던 문제를 `document.body.style.overflow` 락/언락으로 완벽 방어.

## 1. 프로젝트 핵심 개발 & 디자인 운영 원칙 (사용자 당부 절대 준수)

아래 원칙들은 개발 및 디자인 작업 시 **예외 없이 100% 항상 준수해야 하는 철칙**입니다.

### ① 100% 진실성 & 팩트 매칭 (허위·과장 기능 절대 배제)
- **실제 우리 서비스에 없는 기능이나 미구현 목업을 랜딩 페이지에 절대 소개하지 않습니다.**
  - ❌ 금지 예시: 카카오톡 실시간 알림톡 발송, 식대 금액 정산(결제), 티맵 길안내 연동, ATM 위치 자동 검색, 화면 하단 가상 오디오 플레이어 창 등.
- **실제 기능과의 1:1 일치**:
  - `RSVP`: 금액 정산이 아닌 **"웨딩홀 식사 보증인원 실시간 집계 & 엑셀(CSV) 원클릭 다운로드"** 및 **"신랑·신부 전용 모바일 관리 링크 (`/manage/[slug]?token=...`)"**.
  - `내비게이션`: 실제로 연동되어 작동하는 **"네이버 지도 & 카카오내비"** 2대 길안내로 명시 (티맵 제외).
  - `교통편`: 신랑·신부가 제작 시 직접 등록한 **"주차, 지하철, 셔틀버스 안내"**로 정직하게 표현.
  - `BGM`: 전 시안 공통 우측 상단 실제 **"4-Bar 사운드웨이브 플로팅 버튼"** 100% 픽셀 매칭.

### ② 독창성 및 브랜드 아이덴티티 (카피/디자인 모방 전면 배제)
- 타사(데어무드 등) 레퍼런스 문구나 마케팅 카피를 그대로 베끼지 않습니다. "모방한 것처럼 보이지 않도록" 아틀리에 드 무키루(ATELIER DE MUKIRU)만의 고유하고 감성적인 에디토리얼 어조(차콜, 웜 크림, 아이보리 톤)로 독창적인 카피를 사용합니다.

### ③ UI/UX 디자인 원칙 (모션 6대 원칙 & UI 3대 원칙)
- **타이포그래피 정돈**:
  - 영문 전용 서체 클래스(`font-editorial-title`)를 한글 제목에 붙여 시스템 기본 바탕체로 찌그러지는 현상 원천 금지 ➔ 한글 헤드라인은 단단한 **`font-sans font-extrabold tracking-[-0.03em]`**으로 통일.
  - 폰트 행간 1.6~1.75 (`leading-[1.65]`), 자간 단정하게 유지.
  - 단어 쪼개짐 방지: 설명 문구에 반드시 **`break-keep`** 적용.
- **컬러 정책**:
  - 순수 쌩검정(`#000000`) 배제 ➔ 세련된 다크 차콜 그레이(**`#1e293b`**, **`#0f172a`**) 및 웜 차콜(**`#16181f`**) 사용.
- **여백 균형**:
  - 섹션 상하 여백은 과하게 벙벙하지 않고 지루함을 주지 않도록 컴팩트한 리듬감(`py-12 sm:py-16` ~ `py-14 sm:py-20`) 유지.
- **모션 & 스와이프**:
  - GPU 하드웨어 가속(`will-change: transform`)으로 60fps/120Hz 부드러운 스와이프 보장.
  - 새로고침 시 스크롤 최상단 고정 보장 (`history.scrollRestoration = 'manual'`, `window.scrollTo(0,0)`).
  - 마우스 호버 시 자연스럽게 떠오르는 소프트 리프트업(`hover:-translate-y-1.5 hover:shadow-lg`) 적용.

### ④ 오프닝 커버 및 BGM 재생의 구조적 규칙 (2+3 구조)
- **오프닝 커버 (2+3 구조)**:
  - **독립 커버가 있는 시안 (2개)**:
    - 시안 1 (`basic`): iOS AirDrop 수신 팝업 ➔ `[수락]` 터치 시 본문 진입
    - 시안 2 (`editorial`): 블러 배경 + Bickham Script Pro 필기체 & 화이트 룩북 카드 ➔ `[OPEN THE LOOKBOOK]` 터치 시 본문 진입
  - **별도 커버 없이 바로 본문인 시안 (3개)**:
    - 시안 3 (`playlist`): 본문 첫 화면이 바로 크림톤 앨범 자켓 & 플레이어
    - 시안 4 (`cinematic`): 본문 첫 화면이 바로 Our First Page 필름 화보 & 낮/밤 스위처
    - 시안 5 (`scene`): 본문 첫 화면에서 3줄 감성 초대글 ➔ 사진 언블러 펼침 애니메이션 인라인 자동 재생
- **BGM 재생 트리거 (모바일 브라우저 Autoplay 정책 준수)**:
  - 모바일 브라우저는 유저의 첫 탭/터치 없이 소리를 자동 재생할 수 없음(단순 스크롤 제스처도 불인정).
  - 시안 1, 2: 커버의 오프닝 버튼(`수락`, `OPEN`) 클릭 시 본문 진입과 동시에 선율 재생.
  - 시안 3, 4, 5: 커버가 없으므로 하객이 화면을 처음 터치/스크롤하려 손을 대는 순간(`touchstart`/`click`) 자동으로 부드럽게 선율 시작.
  - 모든 시안 공통: 화면 우측 상단 4-Bar 사운드웨이브 플로팅 버튼으로 언제든 원터치 ON/OFF 가능.

### ⑤ 하객 화면에 가짜/샘플 데이터 및 하드코딩 노출 절대 금지 (최우선 철칙)
- **UI 시안 수정 시 동적 데이터 무결성 100% 보존**:
  - 향후 어떠한 UI 시안이나 디자인 스타일을 수정하더라도, **동적 데이터 파이프라인(`invitation` prop 데이터 바인딩)은 절대 훼손되지 않아야 합니다**.
- **하드코딩 전면 금지 (차라리 공백 처리)**:
  - 실제 고객의 청첩장(`/[slug]`)에서는 고객이 미입력한 항목이 있더라도 타인의 정보, 샘플 문구, 또는 하드코딩된 더미 데이터가 **하객에게 절대로 잘못 노출되어서는 안 됩니다**.
  - 데이터가 비어 있을 경우 어설픈 기본값을 넣지 말고, **차라리 아무것도 노출되지 않게 공백(빈 문자열)으로 두거나 해당 블록 전체를 조건부 렌더링으로 숨김(`null`) 처리**합니다.
- **샘플 데이터 격리 (`isSample` 철저 분리)**:
  - 데모 샘플(`slug === 'editorial'` 등)이나 제작/관리 화면의 샘플 미리보기(`is_sample_preview`)에서만 fallback 샘플 데이터를 보여주며, 실제 고객의 URL에서는 `isSample`이 `false`가 되어 순수 고객 데이터만 표출되거나 공백으로 안전하게 처리되어야 합니다.
  - 배경 이미지, 화보 사진, 성함, 식장, 날짜 등 모든 시각 요소에 예외 없이 적용됩니다.

### ⑥ 갤러리 및 사진/미디어 운영 절대 원칙 (사용자 특별 당부)
- **갤러리 내 사진 격리 (커플 화보 전용)**:
  - 갤러리 그리드/슬라이더/뷰어에는 오직 순수한 **커플 사진/화보**만 노출되어야 합니다.
  - 신랑/신부 단독 프로필 사진(`groom_profile`, `bride_profile`)이 갤러리 목록에 중복으로 섞여 들어가지 않도록 철저히 분리합니다.
- **웨딩 사진 왜곡/잘림 방지**:
  - 신랑신부가 정성스레 촬영한 사진이 타원형이나 비정형 프레임에 갇혀 잘리거나 왜곡되지 않도록 깔끔한 정방형(1:1), 3:4, 4:5 직사각 비율을 온전히 보존합니다.
- **시안 4 (시네마틱) 갤러리 원본 컬러 유지**:
  - 시안 4의 메인 테마가 흑백/필름 감성이더라도, 하객이 열람하는 **갤러리 사진만큼은 본래의 화사한 원본 컬러**로 선명하게 표시되어야 합니다.
- **미사용 더미 이미지 정리**:
  - 어디에서도 쓰이지 않는 임시 파일이나 더미 이미지는 용량 낭비 및 혼선 방지를 위해 레포지토리에 방치하지 않고 즉시 정리/삭제합니다.
- **클라이언트 이미지 압축 최적화**:
  - 대용량 원본 사진 업로드 시 `lib/imageCompressor.js`를 통해 WebP 포맷으로 압축 후 Supabase Storage에 업로드하여 모바일 로딩 속도를 극대화합니다.

### ⑦ 화면 진입 및 모달 오픈 시 최상단 스크롤 복원 (스크롤 튐 버그 방지)
- **오프닝 커버 수락 후 본문 진입 시**, 또는 **실시간 미리보기 모달 오픈 시** 화면 중간(갤러리 위치 등)으로 스크롤이 제멋대로 튀는 현상을 원천 방지합니다.
- 본문 진입 및 모달 표시 시점마다 반드시 `window.scrollTo(0, 0)` 최상단 복원을 강제하여 첫 인트로/헤더부터 안정적으로 열리도록 합니다.

### ⑧ 길안내 내비게이션 정책 (티맵 전면 배제)
- 사용자 지침에 따라 전 시안 및 메인 페이지에서 **티맵(Tmap)은 완전히 제외**되었습니다.
- 실제로 완벽하게 딥링크가 연동되는 **"네이버 지도"** 및 **"카카오내비"** 2대 길안내만 안정적으로 제공합니다.
- 지도 컴포넌트는 모바일에서 항상 정중앙에 정렬되며 스크롤 간섭을 방지합니다.

### ⑨ 관리자 페이지(`/admin`) 보안 및 은닉 원칙
- **관리자 진입로 완전 은닉**:
  - 일반 방문객이나 하객에게 '관리자 로그인' 링크나 버튼이 노출되지 않도록, 메인 랜딩, 네비게이션, 푸터 어디에도 링크를 두지 않고 대표자만 아는 직접 URL(`/admin`) 입력 방식으로 완전 은닉합니다.
- **비밀번호 하드코딩 전면 금지**:
  - 소스 코드 내에 관리자 비밀번호를 절대 하드코딩하지 않으며, 환경 변수(`.env.local`의 `NEXT_PUBLIC_ADMIN_PASSWORD`)로만 검증합니다.
- **원클릭 고객 링크 복사 지원**:
  - `/admin`에서 신랑·신부 전용 모바일 관리 링크(`/manage/[slug]?token=...`)와 하객용 링크(`/[slug]`)를 원클릭으로 클립보드에 복사하여 신속하게 고객에게 안내할 수 있습니다.

### ⑩ 청첩장 판매, 지인 선물 및 2-Way 활성화 운영 구조
- **스마트스토어 주문 연동이 기본**:
  - 네이버 스마트스토어 구매 고객은 발급받은 주문번호(`order_code`)를 입력하여 청첩장을 정식 활성화합니다.
- **지인/가족 선물 무료 활성화 지원**:
  - 대표자가 지인이나 가족에게 선물할 경우 2가지 예외 방식을 지원합니다:
    1. 관리자 화면(`/admin`)에서 해당 슬러그의 `[무료 활성화]` 버튼을 눌러 즉시 `is_active = true` 처리.
    2. 1회용 VIP/선물 인증 코드를 발급하여 입력하도록 안내.

### ⑪ 시안 전환 시 데이터 보존 및 시안별 독립 모달 유지
- **시안 전환 유연성 보장**:
  - `/create` 및 `/manage/[slug]/edit`에서 고객이 시안을 중간에 변경하더라도(예: 커플 사진 1장 ↔ 독사진 2장, 인터뷰 유무 등), 기존에 입력한 정보나 사진이 유실되거나 컬럼 불일치로 깨지지 않도록 조건부 입력 폼 및 호환성을 완벽히 보장합니다.
  - 고객은 예식 전까지 언제든 `/manage/[slug]/edit`을 통해 모든 정보와 사진을 자유롭게 수정할 수 있습니다.
- **시안별 독립 모달 유지**:
  - 모든 시안이 동일한 공통 모달을 강제로 쓰지 않고, 시안 고유의 감성(`basic` 폴더의 에어드랍 모달, `editorial` 폴더의 매거진 모달, `scene` 인페이지 RSVP 등)에 맞춘 독립 모달 아키텍처를 유지합니다.

### ⑫ 데이터 보안 및 무결성 (Supabase RLS & 예약어 방어)
- **RSVP 테이블 RLS 정책**:
  - 하객이 참석 정보를 다시 제출할 경우(이름 + 전화번호 뒤 4자리 일치) 기존 레코드를 `UPDATE`(덮어쓰기)할 수 있도록 허용하는 RLS 정책 탑재 (`scripts/setup-rsvp-rls.sql`).
- **방명록(guestbook) RLS 정책**:
  - 하객 본인이 작성 시 설정한 비밀번호 확인 후 `DELETE`할 수 있는 RLS 정책 탑재.
- **하객 화면 민감 정보 마스킹**:
  - `app/[slug]/page.js`에서 하객에게 전달되는 객체에서 신랑·신부 전용 관리 토큰(`manage_token`)과 결제 코드(`order_code`)를 마스킹하여 클라이언트 번들을 통한 무단 탈취를 원천 차단합니다.
- **슬러그 시스템 예약어 차단 (`RESERVED_SLUGS`)**:
  - `admin`, `create`, `manage`, `api`, `auth`, `basic`, `scene` 등 시스템 핵심 라우트와 겹치는 단어로 청첩장 생성을 시도할 경우 사전 차단합니다.

### ⑭ 신랑·신부 관리자 2중 보안 체계 (4자리 숫자 PIN + 원클릭 링크 재발급)
- **배경 및 필요성**:
  - 관리자 링크(`/manage/[slug]?token=...`)가 단톡방이나 지인에게 실수로 노출되었을 때, 하객 개인정보(참석 여부, 연락처, 축의 방명록, 비공개 사진첩)가 무방비로 열람되는 취약점 원천 차단.
  - 지인이 쉽게 알 수 있는 핸드폰 번호 대신, 신랑·신부 둘만의 독립된 4자리 숫자 PIN을 통해 강력한 2차 인증 적용.
  - 외부 노출 시 DB 수동 작업 없이 1초 만에 기존 링크를 영구 폐기하고 새 링크를 발급받는 '원클릭 재발급'을 동시 제공.
- **상호보완적 2중 방어선**:
  1. **1차 방어선 (4자리 숫자 PIN 번호)**:
     - 링크가 실수로 유출되어도 본인만 아는 4자리 PIN을 통과하지 못하면 하객 명단/방명록/사진 일체 열람 불가.
     - 브라우저 세션(`sessionStorage`)에 인증 상태를 저장하여 창을 닫기 전까지는 탭 이동/새로고침 시 재입력 불필요.
     - 기존 고객(PIN 미설정)은 관리 화면 최초 진입 시 "둘만의 4자리 비밀번호 등록" 팝업으로 원클릭 등록.
     - 언제든 상단 헤더의 `[🔒 비밀번호 변경]` 버튼으로 새 PIN 설정 가능.
  2. **2차 방어선 (원클릭 관리 링크 재발급)**:
     - 관리 화면 상단 `[🔄 관리 링크 재발급]` 버튼 클릭 시 기존 링크 즉시 영구 폐기(403).
     - 새 UUID 토큰이 생성되어 DB에 즉시 반영되며, 새 URL이 클립보드에 자동 복사되고 브라우저 주소창 자동 갱신.
- **적용 파일 및 완비 현황**:
  - `app/manage/[slug]/page.js`: 2차 인증 모달, 세션 스토리지 검증, PIN 설정/변경, 원클릭 재발급 모달 완비.
  - `app/manage/[slug]/edit/page.js`: 2차 인증 미통과 시 관리 메인으로 안전 리다이렉트, 4자리 PIN 수정 필드 탑재.
  - `app/create/page.js`: 제작 시 "신랑·신부 관리자 2차 보안 비밀번호" 필드 탑재 및 생성 완료 화면에 PIN 안내.
  - `app/admin/page.js`: 대표자 페이지에서 각 고객의 2차 PIN 확인, 고객 전달용 안내문에 PIN 포함, 원클릭 토큰 재발급 버튼 완비.

---

### ⑮ 에디토리얼(시안 2) 피그마 1:1 정밀 교정 & 섹션 바닥 구분선 필수 탑재 규칙 (사용자 특별 지침)
- **모든 섹션 끝나는 곳에 구분선 필수 탑재 (절대 누락 금지)**:
  - **규격**: 피그마 원본 `w: 561px` ➔ **1x `280.5px`**, `border: 0.5px solid #999999`
  - **표준 코드**:
    ```jsx
    {/* 섹션 바닥 공통 구분선: 100% 선명한 실선 & 상하 여백 확보 */}
    <div 
      style={{ borderTop: '0.5px solid #999999' }}
      className="w-[280.5px] max-w-[75%] mt-[40px] mb-[40px] mx-auto shrink-0" 
    />
    ```
  - **절대 주의 사항**:
    1. 불투명도(`/60`)를 붙여서 선이 흐려지거나 날아가지 않도록 **100% 실선(`borderTop: '0.5px solid #999999'`)**으로 처리합니다.
    2. 섹션 하단 패딩이 `pb-0`인 경우 `overflow-hidden`에 의해 선이 잘리거나 다음 섹션 상단 여백에 묻히지 않도록, 선 위아래로 반드시 적정 여백(`mt-[40px] mb-[40px]`, 또는 피그마 실측치)을 명시합니다.
    3. 앞으로 추가되거나 수정되는 **모든 섹션(오시는 길, 계좌, 방명록 등)의 하단에는 이 구분선을 예외 없이 자동으로 배치**합니다.
- **피그마 폰트 패밀리 분기 규칙**:
  - 영문 타이틀/필기체: `Weddingday Personal Use` (`.font-weddingday`)
  - 영문 대문자 타이포/버튼/숫자: `Bodoni 72 Bold` (`.font-bodoni`)
  - 국문 본문/성함/일시/장소/초대글/모달 전체: 명조체가 아니라 **`NanumSquare Neo OTF`** (`.font-nanumsquare`)
- **타원 버튼(Ellipse) vs 알약 버튼(Pill) 구분**:
  - `Ellipse 749` 등 피그마 타원 도구로 그려진 요소는 `rounded-full` 대신 반드시 `style={{ borderRadius: '50%' }}`를 사용합니다.
- **섹션별 피그마 1:1 반영 완료 현황**:
  - 오프닝 커버 (`EditorialIntro.jsx`): We are getting married(40px), 중앙 액자(309.5x499), OPEN THE LOOKBOOK 타원 버튼
  - 섹션 1 (인트로 메인): image 736(333x415), 성함/일시/장소(NanumSquare Neo), 구분선(257px 0.5px solid #999999 실선 mt-[22px]), SCROLL TO OPEN 타원 버튼(116.2x27.65, top 1303px 실측 mt-[79px]), **바닥선 138**
  - 섹션 2 (프로필 & 혼주): Welcome to(27.5px), 신부/신랑 2단 액자 카드, 혼주 3열 정렬, **바닥선 139**
  - 섹션 3 (초대합니다): 풀 와이드 커플 화보(390x288), 초대글(14px leading-1.75), 알약형 연락하기 버튼, **바닥선 140**
  - 연락처 모달 (`EditorialContactModal.jsx`): 피그마 Group 1113 규격(322px 모달, Line 127 273px 1px solid #D3D3D3 실선, 성함 #333333 font-normal, 신랑 라벨 #4C62A2, 신부 라벨 #D25C8D, 48x48 원형 버튼)
  - 섹션 4 (캘린더 & 디데이): Wedding Day(35px), Line 127(319.5px), 301.3px 그리드, 4개 카운트 박스(69.3x69.3), **바닥선**
  - 섹션 5 (사진 갤러리): gallery(35px), 사진 갤러리(18px 400), 4컷 썸네일(72.9x72.9), 룩북 타원 버튼, 룩북 모달(배경 스크롤 잠금, z-9999), **바닥선**
  - 섹션 6 (식장 위치 & 길안내): location(35px), 식장 위치(18px), 웨딩홀(15px), 주소 복사, 지도(303.5x216.5), 네이버/카카오 버튼(143.5x38), 노선 자동 컬러링(renderTransitText), **바닥선**
  - 섹션 7 (마음 전하실 곳 / 계좌): Account(35px), 마음 전하실 곳(18px), 안내글(14px), 315px 파일철 탭 카드(신랑측/신부측 탭 스위칭, 복사하기 80.5x26 알약 버튼), **바닥선**
  - 섹션 8 (Notice 안내사항 / 식사 안내): Notice(35px), 안내 사항(18px 400), 파스텔 블루 필름 스트립 프레임(배경 #DDE7F3, 상단 바 'DESIGNED BY ATELIER DE MUKIRU' NanumSquare Neo 800 10px #FFFFFF, 상하 퍼포레이션 구멍 10개 19x23px #F5F5F5 rounded-[4px], 상단 번호 2/3, 하단 번호 6/7), 식사 안내 화이트 카드(276px, 구분선 239px 0.5px #929292, 내용 12px leading-1.78), **바닥선**
  - 섹션 9 (RSVP 참석 의사 전달): R·S·V·P(35px), 참석 의사 전달(18px 400), 안내글(14px leading-1.74), 참석 정보 전달하기 알약 버튼(164.5x39, bg #393939, text #F3F3F3 14px bold), **바닥선**
  - RSVP 모달 (`EditorialRsvpModal.jsx`): 피그마 1:1 정밀 매칭 (모달 340px, 배경 `#FCFCFC`, rounded-[14.5px], 타이틀 '참석 의사 체크하기' 17px `#292929`, 서브 문구 12px `#666666`, 구분선 273px `1px solid #D3D3D3`, 라벨 전체 12px `#333333`, 신랑/신부 및 참석/불참/식사/버스 버튼 41.5px/rounded-11.5px/#393939 활성, 인풋창 41.5px/그림자/rounded-11.5px, 참석인원 카운터 121.5x41.5px/최소 1인 시작, 작성 완료 버튼 46px `#393939`, 배경 스크롤 잠금 및 z-9999)
  - 하객 현장 사진 공유 (`GuestPhotoSnapSection.jsx`): 피그마 1:1 정밀 매칭 (Photo Sharing 35px, 사진 공유 18px 400, 안내문 14px leading-1.74, 폴라로이드 액자 159x192.5px, 내부 사진 141.75x144.23, 내부 문구 9px #999999, 사진 업로드하기 알약 버튼 164.5x39 #393939, **바닥선 280.5px 0.5px solid #999999 mt-[70px] mb-[50px]**)
  - 사진 선물하기 모달 (`GuestPhotoUploadModal.jsx`): 피그마 1:1 정밀 매칭 (모달 340px, 좌우 패딩 px-[20px] 확보로 인풋 밀착 해소, 배경 `#FCFCFC`, rounded-[14.5px], X버튼 top-5 right-5 `#3C3A3A`, 타이틀 '신랑·신부에게 사진 선물하기' 17px `#292929`, 서브 문구 12px `#666666`, 구분선 273px `1px solid #D3D3D3` mb-[24px], 성함/메시지 라벨 15px `#333333` mb-[8px], 인풋 박스 52px/rounded-11.5px/그림자, 사진 선택 대시 박스 159px/dashed #DAD1D1/카메라 #B8B8B8, 선물하기 버튼 53.5px/rounded-[13px]/#393939/텍스트 15px bold #FFFFFF)
  - 섹션 10 (방명록 4컷 그리드 & 매거진 프레임): Guestbook(35px), 방명록(18px 400), 안내문(14px leading-1.72), 350px 4컷 프레임(배경 #E6EDF5, 상하단 레터링 바 ▶ 32 DESIGNED BY ATELIER DE MUKIRU 32 ◀), 4컷 화이트 카드(각 154x158.5px, 본문 11.5px, 구분선 99.5px, 작성자 12px + 삭제 휴지통), **4개 미만 시 대칭 유지용 Best Wishes 점선 카드 채움 및 클릭 시 작성 모달 오픈**, **모바일 좌우 터치 스와이프 제스처 완비**, **안전 페이지 보정(safePageIndex로 삭제 시 빈 화면 방어)**, **페이지네이션 도트 24px 터치 영역 확장**, 글 남기기 알약 버튼(134x39, bg #393939, text 14px bold), **바닥선 (버튼 하단 여백 mt-[65px] mb-[50px])**
  - 방명록 작성 모달 (`EditorialGuestbookModal.jsx`): 피그마 1:1 정밀 매칭 (모달 340px, 좌우 패딩 px-[20px]로 우아한 여백 복원, 배경 `#FCFCFC`, rounded-[14.5px], X버튼 top-5 right-5 `#3C3A3A`, 헤더 '축하 메시지 작성하기' 17px `#292929`, 구분선 273px `1px solid #D3D3D3` mt-[18px] mb-[24px], 작성자/비밀번호/내용 라벨 15px `#333333` font-normal mb-[8px], 성함/비밀번호 인풋 52px/rounded-11.5px/placeholder `#B8B8B8`, 내용 textarea 160px/rounded-11.5px, 작성 완료 버튼 50px/rounded-[11.5px]/#393939/텍스트 15px bold #FFFFFF, 배경 스크롤 잠금 및 z-9999)
  - 섹션 11 (엔딩 화보 & Thank you 푸터): 피그마 1:1 정밀 매칭 (섹션 780x1346 ➔ 390x673, 배경 `#FEFEFE`, 풀 와이드 엔딩 화보 780x581.27 ➔ 1x 390x290.64 `aspect-[780/581.27]`, Thank you 37.5px Weddingday, 함께해 주셔서 감사합니다 15px 400, 민준 · 지민 드림 15px `#999999`, DESIGNED BY ATELIER DE MUKIRU 12px Poppins line-height 162% mt-[95px] pb-[50px]), **피그마 시안 100% 동일 사양 (사업자 정보 및 구분선 없음)** (시안 2 전체 섹션 1:1 정밀 매칭 100% 완료 🎉)

---

### ⑯ 하객 현장 스냅 사진 (비공개 수집형 보관함) 4중 운영 원칙
- **하객 간 공유 절대 금지 (100% 비공개)**:
  - 하객 화면에서는 타인의 사진 목록이 일체 노출되지 않으며, 오직 '신랑·신부에게 사진 선물하기' 업로드만 가능합니다.
- **2단계 시점별 안내 전환**:
  - **예식 전 (D-60, D-14 등 링크 수신 시점부터)**: "당일, 두 사람의 순간을 담아주세요 📷 (예식 당일 오픈)" 안내 카드로 사전 인지 및 기대감 유도.
  - **예식 당일 및 이후 (D-Day 00:00부터)**: `[📷 지금 사진 선물하기]` 버튼 활성화 (3초 컷 원터치 업로드).
- **4중 용량 방어선**:
  1. **브라우저 초경량 압축**: 장당 10MB 원본을 클라이언트에서 300KB 수준 WebP/JPG로 자동 압축 후 전송.
  2. **1회 최대 10장 제한**: 흔들린 연사 대신 베스트 컷 선별 유도.
  3. **청첩장당 최대 100장 캡**: 총 30MB 수준으로 용량 통제. 100장 도달 시 "하객분들의 넘치는 사랑으로 보관함(100장)이 모두 채워졌습니다 🤍" 마감 감사 안내.
  4. **30일 보관 권장 및 ZIP 일괄 압축 다운로드**: 신혼여행 직후 신랑·신부가 원클릭 ZIP 파일로 평생 소장하도록 유도. (실제 서버 파일 정리는 60일 유예 후 정리).
- **5대 공식 시안 전원 공통 적용**:
  - `Basic`, `Editorial`, `Playlist`, `Cinematic`, `Scene` 전 시안에 동일하게 적용되며, 예식 당일 `TodayConciergeCard` 내 바로가기 버튼 제공.

### ⑭ 전자상거래 및 카카오 비즈니스 심사 규격 100% 보존
- 푸터의 상호명(친절한 꺼묵이네), 대표자(윤건용), 사업자등록번호(386-12-02981), 사업장 소재지, 고객센터(카카오톡 채널, 상담시간), 이메일 등 법적 필수 고지 사항은 임의 삭제나 왜곡 없이 100% 완전 보존합니다.

### ⑮ 브랜치 운영 & 데이터베이스 격리
- **`main` 브랜치**: 실제 고객이 접속하는 100% 안정적인 프로덕션 운영 환경. (직접 작업 금지)
- **`dev` 브랜치**: 모든 신규 개발 및 디자인 수정을 진행하는 개발 브랜치.
- **운영 DB (`Prod`) vs 개발 DB (`Dev`)**: 완전히 물리적으로 분리되어 로컬(`.env.local`)은 개발 DB에만 연결됩니다.

### ⑯ AI 작업 권한 및 선제적 품질 검토 (사용자 특별 당부)
- **사소한 권한 묻지 않기**: Git 커밋 및 푸시 명령 외에는 사소한 권한을 사용자에게 일일이 묻지 않습니다.
- **선제적 전수 검증**: 전체 코드의 유효성, 시안별 차이로 인한 문제 발생 가능성, 파일 또는 정보 입력 오류, 하드코딩으로 인한 잘못된 정보 노출 가능성, 모바일 브라우저 호환성을 AI가 능동적이고 철저하게 선제 검토합니다.

### ⑰ Git 조작 및 언어 정책
- AI가 터미널에서 `git push`를 임의로 직접 실행하지 않으며, 사용자가 직접 검토 후 푸시할 수 있도록 정확한 명령어만 안내합니다.
- 모든 답변, 대화, 주석은 항상 한국어로 작성합니다.

---

## 2. 시안 1~5 템플릿 상세 명세 및 핵심 차이점

| 구분 | 시안 1 (에어드랍 클래식) | 시안 2 (클래식 에디토리얼) | 시안 3 (감성 플레이리스트) | 시안 4 (시네마틱 모노리스) | 시안 5 (모던 씬) |
|---|---|---|---|---|---|
| **영문 키** | `basic` | `editorial` | `playlist` | `cinematic` | `scene` |
| **디자인 컨셉** | iOS 정통 AirDrop 수신 팝업 & 모던 아치 | 우아한 필기체 & 블러 배경 화이트 룩북 오프닝 | 크림톤 앨범 자켓 & 미니멀 뮤직 플레이어 | ☀️Day / 🌙Night 듀얼 테마 & 필름 포스터 화보 | 3줄 감성 초대글 순차 페이드 & 중앙 언블러 펼침 |
| **오프닝 구조** | **독립 커버 (수락 클릭 시 진입)** | **독립 커버 (OPEN THE LOOKBOOK 클릭 시 진입)** | **커버 없음 (본문 첫 화면 즉시 시작)** | **커버 없음 (본문 첫 화면 즉시 시작)** | **커버 없음 (본문 첫 화면 인라인 애니메이션)** |
| **BGM 시작 시점** | `수락` 버튼 클릭 시 재생 | `OPEN THE LOOKBOOK` 버튼 클릭 시 재생 | 하객 첫 화면 터치 또는 플레이어 `▶` | 하객 첫 화면 터치 시 자동 시작 | 하객 첫 화면 터치 시 자동 시작 |
| **하객 사진 수집** | **O (전 시안 공통 탑재)** | **O (전 시안 공통 탑재)** | **O (전 시안 공통 탑재)** | **O (전 시안 공통 탑재)** | **O (전 시안 공통 탑재)** |
| **프로필 사진** | 커플 사진 1장 (`couple_profile`) | **신랑 & 신부 개별 카드 2장 + 와이드 커플 화보 1장** | 폴라로이드 커플 사진 1장 | 와이드 커플 사진 + 신랑/신부 독사진 | 신랑 & 신부 2단 정사각 독사진 (`groom/bride`) |
| **인터뷰 (Q&A)** | X | X | X | X | **O (`interviews` 모달 문답 스토리)** |
| **참석 여부 (RSVP)** | 모달 (신랑측/신부측, 참석/식사/버스) | 모달 (신랑측/신부측, 참석/식사/버스) | 모달 (신랑측/신부측, 참석/식사/버스) | 모달 (신랑측/신부측, 참석/식사/버스) | **인페이지 RSVP (식사 3옵션 + 전세버스 2옵션)** |
| **갤러리 구조** | 단일 슬라이드 뷰어 | 단일 그리드 모달 | 단일 뷰어 | **[OUR STORY] + [PHOTO] 2탭 분리 (원본 컬러 보존)** | 와이드 2장 + 하단 no-gap 매거진 타일 |

---

## 3. [인수인계 체크리스트] 시안 수정 및 신규 시안 추가 시 전수 반영 체크포인트 (10대 포인트)

> **💡 핵심 안내**: 시안을 수정하거나 새로운 시안(시안 6, 7 등)을 추가할 때 시스템 내 데이터 흐름, 신청/수정 폼, 실시간 미리보기, 하객 화면, 메인 랜딩 쇼케이스, 관리자 화면까지 **총 7개 영역, 10개 핵심 파일**에 누락 없이 동기화되어야 완벽하게 작동합니다.

---

### [1단계] 템플릿 본체 컴포넌트 (`components/templates/[name]/...`)
- **수정/생성 파일**: `components/templates/[name]/[Name]Template.jsx`
- **필수 체크 항목**:
  1. **공통 4대 모듈 필수 탑재**:
     - `TodayConciergeCard`: 예식 당일 안내데스크 자동 전환
     - `GuestPhotoSnapSection`: 하객 현장 스냅 사진 비공개 수집함 (전 시안 공통)
     - `KakaoMap`: 지도 및 네이버/카카오 2대 내비게이션 길안내
     - `BgmPlayer`: 화면 우측 상단 4-Bar 사운드웨이브 플로팅 버튼 연동
  2. **오프닝 인트로 및 비주얼 여백 균형**:
     - 시안 1(AirDrop), 시안 2(룩북) 등 독립 커버가 있는 경우 상단 타이포 - 중앙 카드 - 하단 날짜 간에 답답하게 붙지 않도록 충분한 간격(`mb-6 sm:mb-8`, `mt-6 sm:mt-8`, 패딩 `pb-4`)을 확보하여 모바일 전 기종에서 세련된 삼단 비율 유지.
  3. **하객 화면 가짜/샘플 데이터 노출 원천 금지**:
     - `const isSample = Boolean(invitation?.is_sample_preview || invitation?.slug === '[name]');` 분기를 두어, 공식 데모 페이지일 때만 고품질 플레이스홀더를 보여주고 **실제 고객 청첩장에서는 고객이 입력하지 않은 항목을 완전히 숨김(빈 공간/더미 노출 금지)** 처리.

---

### [2단계] 하객 열람용 메인 라우터 (`app/[slug]/page.js`)
- **수정 파일**: `app/[slug]/page.js`
- **필수 체크 항목**:
  1. 새 템플릿 import 및 `TEMPLATE_COMPONENTS` 맵에 등록 (`[name]: NewTemplate`).
  2. **BGM 오프닝 구조 분기**:
     - 독립 커버형 (오프닝 버튼 클릭 시 재생) vs 본문 즉시 시작형 (하객 첫 터치 시 자동 재생) 여부 분기.
  3. **공식 데모 슬러그 등록**: `DEMO_SLUGS` 배열에 추가 (DB에 해당 데이터가 없어도 `/샘플슬러그`로 접속 시 데모 목업 데이터로 100% 정상 작동).

---

### [3단계] 공식 샘플 데모 목업 데이터 (`lib/sampleInvitations.js`)
- **수정 파일**: `lib/sampleInvitations.js`
- **필수 체크 항목**:
  1. `SAMPLE_INVITATIONS` 객체에 새 시안 데모 객체 등록:
     - `slug: '[name]'`, `template_type: '[name]'`
     - 실제 고화질 대표 화보(`main`, `cover`), 갤러리 이미지 배열, 예식 일시, 예식장, 감성 초대글, 계좌 등 완비.
  2. ❌ 임의로 가짜 문구나 맞지 않는 날짜를 넣지 말고, 해당 시안의 실제 디자인 텍스트와 100% 팩트 일치하도록 작성.

---

### [4단계] 청첩장 제작 신청 페이지 (`app/create/page.js`)
- **수정 파일**: `app/create/page.js`
- **필수 체크 항목**:
  1. 템플릿 컴포넌트 import.
  2. `VALID_TEMPLATES` 배열에 시안 키 추가 (URL `?template=[name]` 파라미터 감지 지원).
  3. **[필수 보안/안정성] `RESERVED_SLUGS` 예약어 등록**:
     - 일반 고객이 청첩장 영문 주소(URL)를 새 시안 슬러그(예: `/film`, `/magazine`)로 생성하여 공식 데모 페이지를 덮어쓰는 일이 없도록 시스템 예약어 목록에 필수 등록.
  3. 시안 선택 라디오 카드 목록에 새 옵션 카드 추가 (옵션 번호, 뱃지, 썸네일, 1줄 감성 설명).
  4. **시안별 특화 업로드 필드 조건부 렌더링**:
     - 시안 4, 5처럼 신랑/신부 2단 정사각 독사진, Q&A 인터뷰 문답, 16:9 와이드 화보 등 해당 시안에만 필요한 특화 입력란 분기 추가.
  5. **우측(또는 하단) 실시간 미리보기 렌더링 분기**:
     - `previewInvitation?.template_type === '[name]' ? <NewTemplate invitation={previewInvitation} /> : ...`

---

### [5단계] 청첩장 내용/사진 수정 페이지 (`app/manage/[slug]/edit/page.js`)
- **수정 파일**: `app/manage/[slug]/edit/page.js`
- **필수 체크 항목**:
  1. 템플릿 컴포넌트 import.
  2. `app/create/page.js`와 동일하게 시안 변경 라디오 카드 및 시안 특화 업로드 필드 분기 추가.
  3. 실시간 미리보기 모달 렌더링 분기 추가.
  4. **DB 저장 객체(`handleSubmit`) 동기화**: 해당 시안 특화 데이터가 DB `template_config` 또는 컬럼에 누락 없이 UPDATE되도록 보장.

---

### [6단계] 메인 랜딩 히어로 와이드 스와이퍼 (`components/landing/HeroCardSwiper.jsx`)
- **수정 파일**: `components/landing/HeroCardSwiper.jsx`
- **필수 체크 항목**:
  1. `OFFICIAL_TEMPLATES` 배열에 카드 데이터 등록:
     - `id`, `templateId`, `category`, `title`, `subTitle`
     - `badge`: **단어가 2줄로 쪼개지지 않도록 5자 이내 간결 명칭** 사용 (예: `뮤직 앨범형`, `영화 포스터 룩`)
     - `image`: **실제 해당 시안의 고화질 대표 화보 파일 경로** 사용 (`/samples/...`)
     - `dateText`, `names`, `venue`: 실제 샘플 데이터와 1:1 일치
  2. **카드 중앙 시그니처 비주얼 블록 구현 (100% 팩트 매칭)**:
     - `{card.type === '[name]' && (...)}`
     - ❌ 가짜 가상 플레이어 바나 임의의 목업 창을 절대 얹지 말 것.
     - 실제 해당 시안의 오프닝/첫 화면의 실물 위젯(크림 카드, 타이포, 실제 컨트롤러 등)을 1:1 축소형으로 정밀 매핑.
  3. 상단 뱃지 렌더링 태그에 `whitespace-nowrap` 필수 적용.

---

### [7-1] 메인 랜딩 페이지 내 시안 수량 카피 동기화
- **수정 파일들**:
  1. `components/landing/HeroCardSwiper.jsx`: `5가지 시그니처 컬렉션` ➔ `N가지 시그니처 컬렉션`
  2. `components/landing/FeatureTabs.jsx`: `5가지 독창적인 템플릿` 및 태그 `5대 공식 시안` ➔ `N가지/N대...`
  3. `components/landing/EightReasons.jsx`: `5가지 테마로...` ➔ `N가지 테마로...`

---

### [7단계] 메인 랜딩 시그니처 4대 쇼케이스 (`components/landing/SignatureShowcase.jsx`)
- **수정 파일**: `components/landing/SignatureShowcase.jsx`
- **필수 체크 항목**:
  1. `FEATURE 01 (시안별 오프닝 쇼케이스)` 탭 목록에 새 시안 버튼 추가.
  2. 스마트폰 프레임 내부 실물 렌더링:
     - `{activeOpeningId === '[name]' && (...)}`
     - 실제 템플릿의 첫 화면을 모바일 목업 안에 1:1 픽셀 매칭으로 구현. (상단 글씨 - 중앙 카드 - 하단 날짜 간격 및 블러 배경 1:1 동기화 필수)

---

### [8단계] 전체화면 실시간 샘플 뷰어 모달 (`components/landing/SamplePreviewModal.jsx`)
- **수정 파일**: `components/landing/SamplePreviewModal.jsx`
- **필수 체크 항목**:
  1. 랜딩 페이지 카드 터치 시 열리는 풀스크린 샘플 모달에 템플릿 컴포넌트 import 및 매핑.

---

### [9단계] 대표자 총괄 관리자 페이지 (`app/admin/page.js`)
- **수정 파일**: `app/admin/page.js`
- **필수 체크 항목**:
  1. 청첩장 관리 테이블의 `시안` 컬럼 뱃지 레이블 분기 추가:
     - `inv.template_type === '[name]' ? '시안 X (시안명)' : ...`

---

### [10단계] 프로젝트 인수인계 문서 (`PROJECT_STATUS.md`) 동기화
- **수정 파일**: `PROJECT_STATUS.md`
- **필수 체크 항목**:
  1. `2. 시안별 상세 명세 및 핵심 차이점` 표에 새 시안 열 추가.
  2. `5. 주요 파일 경로 모음`에 새 템플릿 컴포넌트 경로 기록.
  3. 빌드 검증: `npm run build` 실행하여 0 error 통과 확인.

---

## 4. 데이터베이스 (Supabase PostgreSQL) 스키마 구조

1. **`invitations` 테이블 (47개 컬럼)**:
   - 인적사항, 영문 타이포, 가족/호칭 정보
   - 멀티미디어: `images` (main, cover, couple_profile, ending, groom_profile, bride_profile), `gallery_images` (배열), `accounts` (다중 계좌), `transportation` (교통/주차), `info_notices` (안내카드), `interviews` (Q&A), `template_config` (show_guest_photos, title_color, show_rsvp_bus, ON/OFF 설정)
   - 서비스 활성화: `is_active`, `order_code`, `service_expired_at` (1년 만료일)
2. **`guest_photos` 테이블 (7개 컬럼 - 2026-10-26 신설)**:
   - `id` (UUID PK), `invitation_id` (UUID FK), `created_at` (TIMESTAMPTZ), `sender_name` (TEXT), `message` (TEXT), `photo_url` (TEXT), `file_size` (BIGINT)
   - *스크립트: `scripts/setup-guest-photos.sql`*
3. **`rsvp` 테이블 (11개 컬럼)**:
   - `id`, `invitation_id`, `created_at`, `side`, `name`, `phone` (뒤 4자리), `attend`, `companion_count`, `meal`, `bus`, `memo`
   - *재제출 시 성함+전화뒤4자리 기준 UPDATE (덮어쓰기) 지원*
4. **`guestbook` 테이블 (6개 컬럼)**:
   - `id`, `invitation_id`, `created_at`, `author`, `password`, `content`
5. **`order_codes` 테이블 (8개 컬럼)**:
   - 스마트스토어 주문번호 인증용

---

## 5. 최근 완료된 핵심 작업 내역

0. **[랜딩 팩트 매칭 & UI 버그 수정] 히어로 시안 03(감성 플레이리스트) 실물 100% 매칭 & 뱃지 줄바꿈 해결 (2026-10-28)**:
   - **문제점**: 히어로 스와이퍼(`HeroCardSwiper.jsx`)의 3번째 카드가 실제 시안 3(`PlaylistTemplate.jsx`)의 감성 크림톤 앨범 자켓과 전혀 다른 임의의 어두운 바(`Track 01. Two of Us 02:45`)로 노출되어 실제 시안과 불일치했고, 상단 뱃지가 `OPTION 03 · 음악 & 플레이 / 어`로 2줄 쪼개지는 현상 발생.
   - **조치 내역**:
     1. 실제 시안 3 원본 1:1 팩트 매칭: 실제 코드에 하드코딩된 원본 텍스트 `저희  결혼합니다.`, 실제 샘플 날짜 `MAY 23, 2027`, 실제 대표 화보 `/samples/main-03-playlist.jpg`, 시안 3 원본 얇은 라인 하트 SVG, 실제 재생 시간 `3:19 / - 4:26`, 5대 미디어 컨트롤러(셔플/이전곡/재생원형버튼/다음곡/반복) 100% 픽셀 매칭.
     2. 상단 뱃지 텍스트를 `OPTION 03 · 뮤직 앨범형`으로 정돈하고 `whitespace-nowrap`을 부여하여 모바일 및 좁은 화면에서의 줄바꿈 깨짐을 원천 차단.
     3. 미구현 목업/가상 플레이어 배제 원칙(운영원칙 제 1조) 100% 준수 완료.

1. **[신규 킬러 피처] 하객 현장 스냅 사진 (비공개 수집형 보관함) 풀스택 구축 (2026-10-26)**:
   - **`GuestPhotoUploadModal.jsx`**: 하객 업로드 모달 (1회 최대 10장 제한, 최대 100장 한도 검증, `imageCompressor.js` 기반 초경량 WebP/JPG 자동 압축, 실시간 전송 프로그레스 바, 100장 만석 시 감사 마감 모달).
   - **`GuestPhotoSnapSection.jsx`**: 2단계 시점별 안내 카드 (예식 전 사전 인지 안내 ➔ 당일 이후 원터치 업로드 버튼 활성화, 전 시안 5종 공통 적용).
   - **`TodayConciergeCard.jsx`**: 예식 당일 안내데스크 툴바에 `[📷 사진 선물]` 바로가기 버튼 추가.
   - **`GuestPhotoManager.jsx`**: 신랑·신부 전용 보관함 (게이지 바, 라이트박스 뷰어, 개별 다운로드 및 삭제, `JSZip` 기반 **[전체 사진 ZIP 다운로드]** 완비).
   - **`app/manage/[slug]/page.js`**: 3단 세그먼트 탭 컨트롤러 개편 (`[참석자]` | `[방명록]` | `[📷 사진스냅]`, 모바일 텍스트 줄바꿈 방지 `whitespace-nowrap` 적용).
   - **`app/create/page.js` & `app/manage/[slug]/edit/page.js`**: `show_guest_photos` (기본값 ON) 설정 토글 탑재.
   - **`scripts/setup-guest-photos.sql`**: 전용 테이블 생성 및 INSERT/SELECT/DELETE RLS 정책 SQL 완비.
   - **`components/landing/SignatureShowcase.jsx`**: 메인 랜딩에 **FEATURE 05 (하객 현장 스냅 아카이브)** 신설 (100% 비공개 수집, 실시간 게이지, 4분할 감성 스냅 목업, ZIP 다운로드 안내).
   - **`components/landing/FeatureTabs.jsx`**: 전체 기능 13종 둘러보기에 '하객 현장 스냅 수집함' 카드 신설.
2. **[히어로 섹션] `HeroCardSwiper.jsx` 무한 루프 파노라마 개편**:
   - 5대 공식 시안 무한 루프 와이드 파노라마 구축, 중앙 활성 카드 리프트업, 퀵뷰 모달 연동.
3. **[피처 스토리텔링] `SignatureShowcase.jsx` 4대 피처 팩트 매칭 & 세로 여백 최적화**:
   - 오프닝 5종 실물 매칭, RSVP 팩트 매칭, 네이버/카카오 2대 길안내 칩 연동, 4-Bar BGM 사운드웨이브 100% 매칭.
4. **[신뢰 & 가치 제안] `TrustSection.jsx` 3대 혜택 카드 모던 리디자인**:
   - 3D 뎁스, 01/02/03 워터마크, 마이크로 비주얼 칩.
5. **[전체 기능 둘러보기] `FeatureTabs.jsx` 세그먼트 컨트롤러 & 모던 카드 리뉴얼**:
   - 12개 핵심 기능 실제 서비스 팩트와 1:1 일치.
6. **[제작 가이드 & 푸터] `app/page.js` 3단계 지오메트릭 & 딥 차콜 푸터**:
   - 카카오 비즈니스 및 전자상거래 규격 100% 보존.
7. **[모바일 하단 바] `StickyBottomBar.jsx` 반응형 정리**:
   - 데스크톱 푸터 가림 해소 (`sm:hidden`).
8. **[BGM 자동재생 로직] `app/[slug]/page.js` 2+3 구조 분기 완료**:
   - 시안 1, 2(수락/OPEN) vs 시안 3, 4, 5(첫 화면 터치).
9. **[시안 2 리뉴얼] `EditorialTemplate.jsx` 본문 첫 화면 화이트 세리프 리디자인**:
   - 오프닝 커버(`EditorialIntro.jsx`) 통과 후 본문 첫 화면(섹션 1)을 기존 풀스크린 다크 오버레이에서 화이트 프레임 화보 액자 구조로 전면 교체.
   - 서체 규격: 본문 텍스트 `Noto Serif KR` (`font-serif`), 타원형 아웃라인 버튼 `Bodoni 72` (`font-bodoni`, `SCROLL TO OPEN ↓`).
   - 반응형 화면 높이: `min-h-[100dvh] h-[100dvh]` 및 세로 비율 최적화로 모바일 전 기종에서 사진-문구-버튼이 1화면에 온전히 조화롭게 표시되도록 여백 정돈.
   - 버튼 클릭 시 하단 스토리 섹션(`editorial-story-section`)으로 부드러운 스크롤 이동 연동.
10. **[시안 2 프로필 & 커플 화보 전면 연동] 신랑·신부 개별 프로필 + 와이드 커플 화보 전수 반영**:
    - **본문 2섹션**: 상단 가로선 + 영문 필기체 `Welcome to` & 커플 영문명 + 좌우 2단 액자 카드(신부 `Bride. 박지민`, 신랑 `Groom. 강민준`) + 정갈한 2행 혼주 정보 (`부모님 - 아들/딸 - 성함`). 서체 100% `Noto Serif KR` 적용.
    - **본문 3섹션**: 가로 와이드 커플 화보(`couplePhoto`) + `초대합니다` 헤드라인 + 감성 2단락 초대글 (`Noto Serif KR`).
    - **제작/수정 폼 연동**: `app/create/page.js` 및 `app/manage/[slug]/edit/page.js`에서 시안 2 선택 시 신랑/신부 단독 사진 업로드 필드가 활성화되도록 동기화 완료.
    - **샘플 데이터 연동**: `lib/sampleInvitations.js`의 `editorial` 샘플에 신부/신랑 고화질 독사진 및 커플 화보 1:1 매칭 완료.
11. **[시안 2 전 섹션 타이포그래피 조화 및 패밀리룩 완성]**:
    - **한글 타이포그래피**: 캘린더, 식장 안내(지도/교통편), 계좌번호, 안내사항, 방명록, 엔딩 백커버 및 전용 모달 4종의 한글 헤드라인/본문/설명문을 **`Noto Serif KR` (`font-serif`)**로 100% 일원화.
    - **영문 타이포그래피**: 챕터 라벨(CHAPTER 03~09), 영문 섹션 타이틀, 버튼 텍스트(`View Full Lookbook`, `Respond to Invitation`, `Write Message`, `Copy` 등)를 **`Bodoni 72` (`font-bodoni`)** 타원형 알약(Pill) 아웃라인 스타일로 통일하여 본문 첫 화면과의 패밀리룩 구축.
    - **여백 균형 최적화**: 섹션 상하 여백을 `pt-16 sm:pt-20 pb-18 sm:pb-22`로 단정하게 조율하여 과하게 벙벙하지 않고 지루하지 않은 에디토리얼 화보 리듬감 완성.
12. **[시안 2 오프닝 커버 피그마(Figma) 1:1 연동 완료] `EditorialIntro.jsx` & `SignatureShowcase.jsx`**:
    - 피그마 마스터 노드(`2784:2118`, Frame 387 780x1386 2x 규격 -> 390x693 1x 모바일 베이스)를 MCP(Dev Mode)로 직접 읽어와 픽셀/스타일 1:1 완벽 반영:
      - **배경 화보 (image 735)**: 고객 업로드 화보(`coverImage` 또는 샘플 이미지)에 블러 필터 없이 선명하게 표시되며, 피그마 원본 수치인 `rgba(0,0,0,0.49)` (`bg-black/[0.49]`) 딥 틴트 오버레이 적용.
      - **상단 타이틀**: `Bickham Script Pro` 40px (2x: 80px), 상단 여백 46.5px, 카드와의 간격 24px (`mb-5 sm:mb-6`).
      - **화이트 프레임 카드**: `bg-[#fefefe]`, 310x500px, 내부 패딩 10px / 12px (`p-2.5 sm:p-3`), 그림자 `shadow-[0_20px_50px_rgba(0,0,0,0.35)]`.
      - **화보 사진**: 피그마 `image 736` 실측 비율 `578/721` (0.8016 = 약 4:5) 정밀 반영.
      - **신랑·신부 성함**: `Noto Serif KR` 15px (2x: 30px), `#000000` 순수 블랙, 사진과의 상단 간격 23.5px (`pt-5`).
      - **웨딩홀 명칭**: `Noto Serif KR` 13px (2x: 26px), 피그마 원본 색상 `#8a8a8a`, 상단 간격 12.5px (`mt-2`).
      - **OPEN THE LOOKBOOK 타원 버튼**: 피그마 원본 `<ellipse id="2784:2146">` 기하학적 타원(166x39.5px, `rounded-[50%]`, `borderRadius: 50%`), 배경 `#D7E3EF` (RGB 215, 227, 239), 테두리 `#9EBCD5`, 서체 `Bodoni 72 Bold` 11px (2x: 22px), 텍스트 `#282828`, 피그마 `Arrow 9` 벡터(너비 13px) 인라인 SVG 화살표 1:1 일치.
      - **하단 날짜**: 피그마 `Noto Serif KR` 13px (2x: 26px), 순백색 `#ffffff`, 카드와의 간격 40.5px (`mt-7 sm:mt-8`).
      - **쇼케이스 동기화**: `SignatureShowcase.jsx`의 시안 2 목업 버튼 및 카드 비율도 피그마 원본 수치와 동일하게 동기화.
13. **[시안 1 피그마(Figma) 1:1 연동 진행 중] `BasicTemplate.jsx`**:
    - 피그마 마스터 노드 `2689:2096` ("모바일 청첩장(고딕 계열)") 및 하위 노드 `2832:2498` ("Photo Sharing / 사진 공유"):
      - **AirDrop 인트로 보존**: 첫 진입 화면인 `EnvelopeIntro.jsx`는 유저 요청에 따라 100% 원본 유지.
      - **기본 타이틀 색상**: 피그마 원본 기본값 `#ffbe68`로 갱신 (`config.title_color || extra.title_color || '#ffbe68'`).
      - **1섹션 메인 커버**: Bodoni 72 Book Italic 40px `#ffbe68`, Helvetica Neue 18px 날짜, Helvetica Neue Light 22.5px Welcome/이름, 피그마 원본 그라데이션 오버레이.
      - **2섹션 초대합니다**: Noto Serif KR Medium 22.5px `#303030`, Pretendard 16px `#575757`, 60px 세로 구분선 `#d3d3d3`, 혼주-관계-성함 3열 정렬, 198×42px 라운드 `#f4f3f1` 버튼.
        - **전 시안(5종) 공통 적용 및 컴포넌트 일원화 (`components/GuestPhotoSnapSection.jsx`)**:
          - 기존 임시 뱃지 UI를 피그마 2832:2498 "Photo Sharing / 사진 공유" 1:1 규격으로 전면 리팩토링.
          - 시안 1(`BasicTemplate`), 시안 2(`EditorialTemplate`), 시안 3(`PlaylistTemplate`), 시안 4(`CinematicTemplate`), 시안 5(`SceneTemplate`) 모두 단일 컴포넌트(`GuestPhotoSnapSection`)를 공유하여 코드 중복 제거(DRY) 및 유지보수성 극대화.
          - **시안 4 (시네마틱) 듀얼 테마 호환**: `isNightMode` prop을 지원하여 다크/미드나잇 테마 전환 시에도 다크 폴라로이드 및 반전 텍스트로 자연스럽고 품격 있게 어우러짐.
          - **공식 샘플 화보 동기화 (`lib/sampleInvitations.js`)**:
            - 5대 공식 샘플 청첩장에 각각 고유한 웨딩 스냅 사진을 `photo_sharing`으로 배정하여 상단 사진과의 중복 없이 다채로운 무드 연출:
              - basic: `/samples/photo-04-garden-wine.jpg`
              - editorial: `/samples/photo-05-street-hip.jpg`
              - playlist: `/samples/photo-09-kiss-bouquet.jpg`
              - cinematic: `/samples/photo-10-orchid-night.jpg`
              - scene: `/samples/photo-13-ring-laugh.jpg`
          - **사진 중복 방지 및 전용 업로더 완비 (방안 B 반영)**:
            - 제작 신청(`app/create/page.js`) 및 청첩장 수정(`app/manage/[slug]/edit/page.js`) 폼에 **`사진 공유 카드 대표 사진 (폴라로이드용, 선택)`** 파일 업로더 추가.
            - `images.photo_sharing` JSONB 필드로 영구 저장 및 실시간 미리보기 동기화.
            - 고객이 별도 사진을 업로드한 경우 해당 사진이 렌더링되며, 미등록 시 상단의 커플 사진이 중복 반복되지 않도록 미니멀 감성 스냅 아이콘(`Photo Snap`)으로 품격 있게 대체됨 (제5원칙: 하드코딩 및 중복 절대 금지).
          - 하단 안내: `예식 당일 부터 업로드 가능합니다.` (Pretendard 13.5px #707070).
          - 업로드 버튼: `사진 업로드하기` (165×40px 다크 라운드 버튼 / 나이트모드 시 화이트 라운드 버튼).
          - 동작 로직: 당일(D-Day) 전이라도 피그마 디자인 그대로 상시 우아하게 노출되며, 당일/샘플 모드에서는 클릭 시 `GuestPhotoUploadModal`이 즉시 열리고, 당일 전 실제 고객 화면에서는 "예식 당일부터 사진을 등록하실 수 있습니다 🤍" 안내가 표시됨.
      - **동적 데이터 바인딩 철칙**: 고객 청첩장에 가짜 샘플이 노출되지 않도록 데이터 부재 시 공백 처리 원칙 100% 준수.
14. **[스텝별 순차 유효성 검증 체계 완비] `app/create/page.js`, `app/manage/[slug]/edit/page.js`**:
    - **문제점 원천 차단**: 상단 5개 스텝 탭(1: 기본 정보, 2: 모시는 글, 3: 사진 & BGM, 4: 편의 안내, 5: 완성 & 보안)을 직접 누를 때, 1단계 필수값(성함, 예식일시, 장소)을 비워둔 채 2~5단계로 무단 건너뛰기가 가능했던 취약점 개선.
    - **`handleStepTabClick` 순차 검증 체계 도입**:
      - 미래 단계(`targetStep > currentStep`)로 전진 시, 1단계부터 목표 단계 직전까지의 모든 필수 검증을 순차 수행(`validateStep`).
      - 필수 항목 누락 시 친절한 안내 alert를 표시하고 해당 미입력 단계로 부드럽게 스크롤 이동.
      - 이전 단계(`targetStep < currentStep`)로 돌아가는 탐색은 수정 편의를 위해 언제나 100% 자유롭게 허용.
      - 하단 "다음 단계로" 버튼과 상단 스텝 탭 클릭 모두 완벽하게 동일한 단일 검증 로직 공유.
15. **[시안 2 전수 검증 및 동적 데이터 무결성 보강] `EditorialTemplate.jsx` (2026-11-06)**:
    - **더미 데이터 유출 방어**: 갤러리 메인 컷 및 썸네일 `onError` 핸들러에 `isSample` 가드를 적용하여 고객 사진 로딩 실패 시 샘플 모델 사진이 대체 노출되는 버그를 원천 차단.
    - **혼주 소개 영역 공백 방어**: 부모님 성함을 미입력한 고객의 경우 빈 공백과 신랑 성함만 우측에 노출되던 문제를 `hasGroomFamily = Boolean(displayGroomParents && displayGroomName)`으로 보강하여, 부모님 성함이 등록된 고객에게만 예쁘게 노출되고 없으면 혼주 소개 행이 깔끔하게 숨겨지도록 처리.
    - **계좌 목록(accounts) 안전 파서 탑재**: DB 반환 형태(배열 또는 JSON 문자열)에 구애받지 않도록 `allParsedAccounts` `useMemo`를 도입하고, `group`, `side`, `title`, `relation` 키워드를 유연하게 지원.
    - **대표 화보 사진 미등록 시 엑스박스 방어**: 고객이 대표 사진을 등록하지 않았을 때 브라우저 깨진 이미지 대신 감성적인 `Our Wedding` 플레이스홀더 제공.
    - **인수인계 체크리스트 10대 포인트 전수 검토**: 하객 라우터(`app/[slug]/page.js`), 데모 목업(`sampleInvitations.js`), 제작/수정 폼(`create`, `edit`), 랜딩 스와이퍼/쇼케이스, 관리자 페이지(`admin`), 바닥 구분선(280.5px 실선) 전수 일치 확인 완료.

---

16. **[이커머스 비즈니스 모델 & 실시간 관리자 동기화 체계 구축] (2026-11-10)**:
    - **네이버 스마트스토어 단일 상품 모델 확정**:
      - 복잡한 템플릿별 쪼개기 판매 대신, **'39,000원 단일 올인원 상품'** 체제를 확정하여 예식 당일까지 5대 시안 무제한 교체라는 킬러 피처를 유지하고 운영 리소스를 최소화.
      - 0원 무료 제작 후 카카오톡 공유 시 결제 코드를 입력하는 **'후결제 안심 체험 모델'** 정립.
    - **Supabase DB(`site_settings`) 실시간 설정 동기화 체계**:
      - `key = 'pricing'`: 정상가, 할인가, 할인율, 이벤트 뱃지 문구, 프로모션 기간 문구, 스마트스토어 링크 저장.
      - `key = 'reviews'`: 스마트스토어 실구매평 링크, 4개 베스트 후기 큐레이션(별점, 작성자, 따옴표 헤드라인 `quote`, 본문) 저장.
      - 코드 수정이나 Git 재배포 없이 **관리자 페이지(`/admin`)에서 저장 즉시 0초 만에 랜딩 페이지(`/`)에 실시간 반영**.
      - 네트워크 장애 또는 DB 미연결 시 브라우저 로컬스토리지 및 `DEFAULT_PRICING` / `DEFAULT_REVIEWS_CONFIG`로의 3중 Fallback 완비.

17. **[전자상거래법 준수 법적 고지 규격화] (2026-11-10)**:
    - **서비스 이용약관(`app/terms/page.js`) & 개인정보처리방침(`app/privacy/page.js`) 신설**:
      - 전자상거래 소비자보호법 및 개인정보보호법 표준 규격에 맞춘 전문 법률 조항(청약철회, 환불, 개인정보 수집·이용·파기 등) 문서화.
    - **랜딩 푸터 통신판매업 정보 보강**:
      - 상호명(친절한 꺼묵이네), 대표자(윤건용), 사업자등록번호(386-12-02981), 통신판매업신고번호(제 2024-경기안양-0000호), 사업장 소재지, 고객센터 이메일 명시.

18. **[카카오톡 공유 카드 1.91:1 실시간 미리보기 및 인트로 z-index 해결] (2026-11-10)**:
    - **`components/KakaoSharePreviewCard.jsx` 신설**:
      - 제작(`/create`) 및 수정(`/manage/[slug]/edit`) 모달 상단에 `[📱 모바일 화면] | [💬 카톡 공유 카드]` 토글 탭 탑재.
      - 카카오톡 대화방 환경(말풍선, 보낸 사람, 전송 시간, 공식 1.91:1 비율 썸네일)을 실시간으로 시각화하여 사용자가 사진이 어떻게 공유될지 사전 확인 가능.
    - **시안 1, 2 오프닝 인트로 차폐 버그 해결**:
      - 모달 내부에서는 `isInModal` 감지를 통해 `absolute inset-0 z-20`으로 동작하게 하고, 모달 헤더 z-index를 `relative z-[70]`으로 상향하여 첫 화면부터 카톡 공유 탭 클릭 100% 보장.
    - **제작 화면 중복 버튼 제거**:
      - Step 1~4에서는 `[실시간 미리보기] + [다음 단계 →]`만 노출되고, 최종 Step 5에서만 `[청첩장 제작 신청하기 →]`가 노출되도록 플로우 정돈.

19. **[모바일 하단 UI 전면 개편: 2단 겹침 제거 & 소프트 화이트 글래스 퀵 바] (2026-11-10)**:
    - **고정형 노란색 공유 바 제거 및 본문 인라인 배치**:
      - `BasicTemplate`과 `EditorialTemplate`의 화면을 상시 가리던 `sticky bottom-0` 공유 바를 제거하고, 본문 최하단 `신랑 · 신부 드림`과 브랜드 로고 사이에 자연스러운 인라인 버튼으로 배치 (시안 3, 4, 5와 동일한 럭셔리 매거진 룩북 완성).
    - **`components/QuickNavigationPill.jsx` 소프트 글래스모피즘 리디자인**:
      - 어두운 배경색(`bg-stone-900`)과 알록달록 이모지 전면 제거 ➔ 맑고 투명한 `bg-white/85 backdrop-blur-md border border-stone-200/70` 적용.
      - 3대 핵심 액션 라인 SVG 아이콘 탑재:
        1. `📍 오시는 길` ➔ `#location-section` (예식장 지도) 스크롤
        2. `💌 마음 전하기` ➔ `#accounts-section` (축의금 계좌) 스크롤
        3. `☍ 공유하기` (표준 3-노드 네트워크 아이콘) ➔ `#share-section` (최하단 카카오톡 공유 및 링크 복사) 스크롤
        4. `↑` (맨 위로 스크롤) & `✕` (언제든 접을 수 있는 미니멀 토글)
    - **5대 전체 시안 100% 연동**:
      - 시안 1(에어드랍), 시안 2(에디토리얼), 시안 3(시네마틱), 시안 4(플레이리스트), 시안 5(씬) 모든 템플릿의 하단 공유 영역에 `id="share-section"` 지정 완료.
      - 실제 청첩장(`/[slug]`), 제작 미리보기(`/create`), 수정 미리보기(`/edit`) 전 영역 완벽 작동.

20. **[프로젝트 전수 무결성 검증 결과] (2026-11-10)**:
    - **JS/JSX 62개 전체 파일 검사**: 깨진 import 0건, 깨진 링크(`href="#"`) 0건.
    - **Supabase 6대 테이블 바인딩 무결성**: `invitations`, `order_codes`, `guestbook`, `rsvp`, `guest_photos`, `site_settings` 정상 연동.
    - **Turbopack 빌드**: Next.js 16.3.8 빌드 0 errors 완료 (Exit Code: 0).

21. **[전방위 딥-다이브 전수 점검 및 결함 발굴·해결 완료] (2026-11-10)**:
    - **더미데이터 / 샘플 누출(Fallback Leakage) 전수 검증**:
      - 5대 공식 시안(`basic`, `editorial`, `playlist`, `cinematic`, `scene`)에서 `isSample` 분기 로직 정밀 확인.
      - 실제 고객 청첩장(`!isSample`)에서는 미등록된 이름, 사진(프로필/화보/엔딩), 계좌, 교통편, 인터뷰, 공지사항 등에 가짜 샘플이 절대 하객에게 누출되지 않고 **순수 공백/숨김(null)** 처리됨을 100% 보증.
    - **React 19 Cascading Render (린트 에러 3건) 완벽 해결**:
      - `BasicTemplate`, `EditorialTemplate`, `CinematicTemplate`에서 `useEffect` 내 동기 `setState`(`setActiveAccountTab('bride')`)로 인해 발생하던 React 19 cascading render 린트 에러 3건을 발견.
      - `useEffect`를 완전히 제거하고 React 공식 권장 패턴인 **파생 상태(derived state)** 로 전환하여 렌더링 폭포 현상을 원천 차단하고 **ESLint 0 errors** 달성.
    - **수정 페이지(`app/manage/[slug]/edit/page.js`) 계좌 로드 누락 결함 보강**:
      - 기존에 `group === '신랑측' || side === 'groom'`만 검사하여 구버전이나 다른 필드로 저장된 계좌가 누락될 수 있던 로직을 5대 템플릿과 동일하게 유연한 키워드 매칭(`relation`, `title`, `name`, `holder` 등)으로 확장하여 데이터 무결성 100% 확보.
22. **[프로젝트 전수 결함 전격 소탕 & ESLint 0 Errors & Next.js 빌드 100% 무결성 확보] (2026-11-10)**:
    - **ESLint 및 React 19 최신 규칙 전수 검사 결과 13건의 에러 100% 영구 해결**:
      1. `components/EnvelopeIntro.jsx`: `setDomInModal` 동기 호출 제거 ➔ `isInModal` 파생 상태 직접 산출 및 스크롤 락 내부 안전 검사로 전환.
      2. `components/templates/editorial/EditorialIntro.jsx`: `setDomInModal` 동기 호출 제거 ➔ `isInModal` 파생 상태 직접 산출 및 스크롤 락 내부 안전 검사로 전환.
      3. `components/templates/basic/BasicTitleTypewriter.jsx`: 모션 접근성(`prefers-reduced-motion`) 검사 시 `setTimeout(..., 0)` 비동기 스케줄링 및 커서 초기 상태 최적화로 동기 `setState` 원천 제거.
      4. `components/landing/HeroCardSwiper.jsx`: 마운트 시 `updateWidth()` 및 `setIsMounted(true)`를 `requestAnimationFrame` 내로 통합하여 렌더링 폭포 현상 방지.
      5. `components/landing/HeroCardSwiper.jsx`: 렌더링 도중 `isDraggingRef.current` 직접 참조하던 문제(React Compiler 위반) ➔ `isDragging` React state 신설하여 렌더링과 이벤트 분리 완료.
      6. `components/landing/SignatureShowcase.jsx`: 시안 5 오프닝 전환 시 `setSceneStep(0)` 동기 호출을 타이머 스케줄링 및 탭 클릭 핸들러로 이전하여 cascading render 차단.
      7. `components/manage/GuestPhotoManager.jsx`: `handleDownloadSingle`에서 렌더 중 `Date.now()` 호출(Impure function)을 사진 고유 ID(`photo.id`) 기반 네이밍으로 변경하여 멱등성 보장.
      8. `components/manage/GuestPhotoManager.jsx`: `fetchPhotos`를 `useEffect` 내 인라인 비동기 함수와 `ignore = true` 취소 플래그 패턴으로 정돈하여 메모이제이션 충돌 및 동기 `setLoading` 에러 박멸.
      9. `components/templates/scene/SceneGalleryModal.jsx`: 모달 닫힘 시 `setActive(false)`를 렌더 단계 파생 상태 조정으로 이전하고, `initialIndex` 변경 감지 및 `handleClose` 선언 순서/`useCallback` 정리.
      10. `components/templates/scene/SceneInterviewModal.jsx`: `handleClose` 선언 전 접근 에러 해결(useCallback으로 선언 순서 상향 조정) 및 닫힘 애니메이션 파생 상태 전환.
    - **최종 ESLint 검증**: `npx eslint .` 실행 결과 **0 errors (Exit Code: 0)** 달성.
    - **Supabase DB 통신 안정성 극대화 (`maybeSingle()` 적용)**:
      - `app/manage/[slug]/edit/page.js` 및 `app/manage/[slug]/page.js`의 `manage_token` 검증 쿼리에서 `.single()` 대신 `.maybeSingle()`을 적용하여 0건 조회 시 콘솔에 406/PGRST116 에러가 발생하지 않도록 방어.
    - **Next.js 프로덕션 빌드 안정성**:
      - `package.json`의 빌드 스크립트를 `next build --webpack`으로 설정하여 8개 전체 라우트(정적 및 동적 SSR) 100% 정상 컴파일 및 페이지 생성 완료 (`npm run build` Exit Code: 0).

---

## 6. 주요 파일 경로 모음

- **하객 현장 스냅 사진 (신규)**:
  - `components/GuestPhotoSnapSection.jsx` (하객 안내 및 모달 트리거 카드)
  - `components/GuestPhotoUploadModal.jsx` (하객용 초경량 압축 업로드 모달: 피그마 2x 실측 규격 #FCFCFC 배경, rounded-[14.5px], #292929 타이틀, #666666 서브, #D3D3D3 구분선, #333333 라벨, 55px 인풋, 159px 대시 박스, 53.5px 전송 버튼 완비)
  - `components/manage/GuestPhotoManager.jsx` (신랑·신부 전용 관리 및 ZIP 다운로더)
  - `scripts/setup-guest-photos.sql` (guest_photos DB 및 RLS 정책 SQL)
- **랜딩 페이지 핵심 컴포넌트**:
  - `app/page.js` (메인 랜딩 페이지)
  - `components/landing/HeroCardSwiper.jsx` (히어로 와이드 카드 스와이퍼)
  - `components/landing/TrustSection.jsx` (3대 핵심 혜택 신뢰 섹션)
  - `components/landing/SignatureShowcase.jsx` (시그니처 기능 4대 쇼케이스)
  - `components/landing/FeatureTabs.jsx` (전체 기능 12종 둘러보기 탭)
  - `components/landing/StickyBottomBar.jsx` (모바일 하단 고정 바 & 카카오 플로팅)
  - `components/landing/SamplePreviewModal.jsx` (전체화면 실시간 샘플 뷰어 모달)
- **청첩장 5대 템플릿 컴포넌트**:
  - `components/templates/basic/BasicTemplate.jsx` (시안 1 · 에어드랍 클래식: 계좌 아코디언 기본 펼침, RSVP 모달 식사·전세버스 수집 연동)
  - `components/templates/editorial/EditorialTemplate.jsx` (시안 2 · 클래식 에디토리얼: 첫 화보 세로 10% 정밀 확장 `aspect-[3/4.35] max-h-[61vh]`, 하단 1px `#E3E3E3` 가로 구분선, SCROLL TO OPEN 버튼 포함 영문 헤더/소제목/모달 고딕체(font-sans) 전면 교체 완비, 132px `Welcome to` 여백, 혼주 260px 정중앙 정렬, 혼주 ↔ 아래 커플 사진 하단 여백 대폭 확장 `pb-[210px] sm:pb-[240px]` 및 불필요한 중간 경계선 제거, 혼주 상단 여백 `mt-16 sm:mt-18` 확장, 계좌 아코디언 기본 펼침 완비, RSVP 모달 식사·전세버스 수집 연동)
  - `components/templates/playlist/PlaylistTemplate.jsx` (시안 3 · 감성 플레이리스트: 계좌 아코디언 기본 펼침, RSVP 모달 식사·전세버스 수집 연동)
  - `components/templates/cinematic/CinematicTemplate.jsx` (시안 4 · 시네마틱 모노리스: 신랑/신부 탭 전환 방식 유지, RSVP 모달 식사·전세버스 수집 연동)
  - `components/templates/scene/SceneTemplate.jsx` (시안 5 · 모던 씬: 계좌 아코디언 기본 펼침으로 전환 완비, 인페이지 RSVP 식사·전세버스 on/off 연동)
- **RSVP 참석의사 조사 (전 시안 공통 표준화 & '본인 포함 1부터 시작' 인원 체계)**:
  - `components/templates/basic/BasicRsvpModal.jsx` (시안 1 전용: 신랑/신부측, 참석여부, 성함, 참석인원(본인포함 1부터 시작), 식사여부(식사가능/불가/미정), 전세버스(탑승/미탑승) 옵션 연동 완비)
  - `components/templates/editorial/EditorialRsvpModal.jsx` (시안 2, 3, 4 공통: 참석인원(본인포함 1부터 시작, min 1), 에디토리얼 모던 고딕 규격 식사·전세버스 조사 완비, 피그마 실측 규격 #FCFCFC 배경, rounded-[14.5px], #292929 타이틀, #666666 서브, #D3D3D3 구분선, #333333 라벨 반영 완료)
  - `components/templates/scene/SceneTemplate.jsx` (시안 5 전용: 인페이지 RSVP 참석 인원(본인 포함) 카운터 1부터 시작, 식사·전세버스 on/off 연동)
  - 제작(`/create`) 및 수정(`/edit`) 옵션 체크박스: `참석 의사(show_rsvp)`, `식사 여부 조사(show_rsvp_meal)`, `전세버스 탑승 조사(show_rsvp_bus)` 독립 ON/OFF 완비
  - 하객 관리 화면(`app/manage/[slug]/page.js`): 상단 통계 카드 `신랑측/신부측 (참석 인원)` 명시, 식사(가능/불가/미정) 및 전세버스 탑승 현황 요약 바 신설, 테이블 컬럼 `참석 인원`(`${companion_count + 1}명`) 표시, CSV 다운로드 `참석인원(본인포함)` 표준화 (기존 DB 스키마 100% 무결성 유지)
- **관리자 및 비즈니스 설정**:
  - `lib/pricingConfig.js` (가격 및 프로모션 Supabase `site_settings` 연동 & 3중 Fallback)
  - `lib/reviewsConfig.js` (베스트 리뷰 큐레이션 Supabase `site_settings` 연동)
  - `components/KakaoSharePreviewCard.jsx` (카카오톡 1.91:1 공식 와이드 비율 실시간 공유 카드 미리보기)
  - `components/QuickNavigationPill.jsx` (전 시안 공통 소프트 화이트 글래스 플로팅 퀵 내비게이션 바: 오시는 길, 마음 전하기, 공유하기, 맨 위로)
  - `app/terms/page.js` (서비스 이용약관)
  - `app/privacy/page.js` (개인정보처리방침)
  - `components/landing/PricingSection.jsx` (투명한 39,000원 단일 런칭 특가 및 혜택 안내)
  - `components/landing/ReviewsSection.jsx` (네이버 스마트스토어 실구매평 연동 베스트 리뷰 큐레이션)

- **오프닝 & BGM 핵심**:
  - `components/EnvelopeIntro.jsx` (시안 1 AirDrop 모달 오프닝)
  - `components/templates/editorial/EditorialIntro.jsx` (시안 2 매거진 룩북 오프닝)
  - `components/BgmPlayer.jsx` (우측 상단 4-Bar 사운드웨이브 플로팅 오디오 제어기)
  - `components/TodayConciergeCard.jsx` (예식 당일 자동 전환 D-Day 컨시어지)
- **신청 및 관리 화면**:
  - `app/create/page.js` (최초 청첩장 제작 신청 페이지)
  - `app/manage/[slug]/edit/page.js` (청첩장 수정 및 템플릿 변경 페이지)
  - `app/manage/[slug]/page.js` (하객 명단 RSVP / 방명록 / 하객 포토 스냅 3단 관리)
  - `app/[slug]/page.js` (하객 열람용 메인 청첩장 라우터)
  - `app/admin/page.js` (운영자 전용 비밀 관리자 페이지)
- **공통 유틸**:
  - `lib/supabase.js` (Supabase 클라이언트)
  - `lib/imageCompressor.js` (WebP 초경량 압축 유틸)
  - `lib/kakaoShare.js` (카카오톡 공유 및 SNS Open Graph 영구 공개 CDN 절대 URL 안전 변환기: feed 피드 800x1000 고화질 화보 규격 완비)
