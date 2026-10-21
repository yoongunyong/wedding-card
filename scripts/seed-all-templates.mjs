import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. .env.local 로드
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split(/\r?\n/);
let url = '', key = '';
for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
}

if (!url || !key) {
  console.error('Supabase 환경 변수가 없습니다.');
  process.exit(1);
}

const supabase = createClient(url, key);

// 공통 고화질 AI 갤러리 프리셋 (총 8~10장)
const SHARED_GALLERY = [
  '/samples/editorial-cover.jpg',
  '/samples/garden-couple.jpg',
  '/samples/veil-kiss-bw.jpg',
  '/samples/ring-detail.jpg',
  '/samples/bride-solo.jpg',
  '/samples/groom-solo.jpg',
  '/samples/scene-cover.jpg',
  '/samples/cinematic-cover.jpg',
  '/airdrop-couple.png',
  '/playlist-couple.png',
];

const DEFAULT_INTERVIEWS = [
  {
    id: 1,
    question: '서로의 첫인상은 어땠나요?',
    groom_answer: '처음 만난 순간 따뜻하고 환하게 웃어주던 모습이 가장 기억에 남아요. 이야기를 나눌수록 배려심 깊은 사람이라는 걸 느꼈습니다.',
    bride_answer: '조용하지만 듬직하고, 한마디 한마디 진심이 느껴지는 사람이었어요. 편안하게 제 이야기를 들어주던 모습에 호감을 가졌습니다.',
  },
  {
    id: 2,
    question: '결혼을 결심하게 된 특별한 계기가 있나요?',
    groom_answer: '함께 있으면 사소한 일상도 특별해지고, 어떤 힘든 일도 이 사람과 함께라면 이겨낼 수 있겠다는 확신이 들었습니다.',
    bride_answer: '언제나 변함없이 제 편이 되어주고, 서로에게 가장 좋은 영향을 주는 모습을 보며 평생을 함께하고 싶어졌어요.',
  },
  {
    id: 3,
    question: '어떤 부부가 되고 싶으신가요?',
    groom_answer: '서로에게 늘 쉼터가 되어주고, 함께 늙어가는 시간이 늘 설레고 따뜻한 친구 같은 부부가 되고 싶습니다.',
    bride_answer: '기쁨은 두 배로 나누고 슬픔은 함께 보듬으며, 늘 감사하고 사랑하는 마음을 잊지 않는 단단한 가정을 이루겠습니다.',
  },
];

const TEMPLATES_DATA = [
  // 1. 에어드랍 클래식 (basic)
  {
    slug: 'basic',
    template_type: 'basic',
    groom_name: '김도현',
    bride_name: '이서연',
    groom_name_en: 'Dohyun Kim',
    bride_name_en: 'Seoyeon Lee',
    groom_first_name_en: 'Dohyun',
    groom_last_name_en: 'Kim',
    bride_first_name_en: 'Seoyeon',
    bride_last_name_en: 'Lee',
    main_names_en: 'Dohyun & Seoyeon',
    groom_relation: '장남',
    bride_relation: '차녀',
    groom_father: '김태호',
    groom_mother: '박선영',
    bride_father: '이민규',
    bride_mother: '정미라',
    groom_phone: '010-1234-5678',
    bride_phone: '010-9876-5432',
    wedding_date: '2026-12-05T12:30:00',
    venue_name: '그랜드 힐튼 서울',
    venue_hall: '그랜드볼룸 2층',
    venue_address: '서울 서대문구 연희로 353',
    venue_detail: '홍제역 4번 출구에서 무료 셔틀버스 상시 운행',
    message: '곁에 있을 때 가장 나다워지는 사람을 만났습니다.\n\n눈빛만 보아도 서로의 마음을 알고,\n함께하는 것만으로도 온 세상이 따뜻해집니다.\n\n평생을 함께 걸어가기로 약속하는 날,\n소중한 분들을 모시고 새로운 시작을 다짐하고자 합니다.\n\n따뜻한 축복으로 저희의 첫걸음을 밝혀주세요.',
    quote_content: '우리의 연애는 지루하고 힘들었다.\n하지만 그 순간 우리의 마음만은 진심이었다.\n그래서 내겐 인생에서\n가장 영화 같은 순간이 되었다.',
    quote_source: '영화 <연애의 온도>',
    images: {
      cover: '/airdrop-bg.jpg',
      couple_profile: '/airdrop-couple.png',
      main: '/samples/garden-couple.jpg',
      bride_profile: '/samples/bride-solo.jpg',
      groom_profile: '/samples/groom-solo.jpg',
      ending: '/samples/scene-cover.jpg',
    },
    gallery_images: [
      '/samples/garden-couple.jpg',
      '/samples/veil-kiss-bw.jpg',
      '/samples/ring-detail.jpg',
      '/samples/bride-solo.jpg',
      '/samples/groom-solo.jpg',
      '/samples/editorial-cover.jpg',
      '/samples/scene-cover.jpg',
      '/airdrop-couple.png',
    ],
    accounts: [
      { group: '신랑측', title: '신랑', bank: '국민', number: '123-456-789012', holder: '김도현', name: '신랑 김도현' },
      { group: '신랑측', title: '아버지', bank: '신한', number: '110-123-456789', holder: '김태호', name: '혼주 김태호' },
      { group: '신부측', title: '신부', bank: '카카오뱅크', number: '3333-01-2345678', holder: '이서연', name: '신부 이서연' },
      { group: '신부측', title: '어머니', bank: '우리', number: '1002-123-456789', holder: '정미라', name: '혼주 정미라' },
    ],
    transportation: [
      { type: 'subway', title: '지하철', content: '3호선 홍제역 4번 출구 (도보 10분, 셔틀버스 10분 간격 운행)' },
      { type: 'bus', title: '버스', content: '그랜드힐튼호텔 앞 하차 (간선 110A, 153, 567번)' },
      { type: 'car', title: '자가용', content: '네비게이션에 "그랜드 힐튼 서울" 또는 "서울 서대문구 연희로 353" 검색' },
      { type: 'parking', title: '주차안내', content: '호텔 지하 주차장 및 옥외 주차장 이용 (하객 3시간 무료 주차)' },
    ],
    info_notices: [
      { title: '식사 안내', subtitle: '그랜드볼룸 연회장', content: '정성껏 준비한 프리미엄 코스 요리가 제공됩니다.\n식사는 본식 진행과 함께 진행됩니다.' },
      { title: '화환 안내', subtitle: '', content: '축하의 마음만 감사히 받겠습니다.\n화환은 정중히 사양하오니 양해 부탁드립니다.' },
    ],
    bgm_url: 'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/bgm/presets/piano-01.mp3',
    bgm_mode: 'preset',
    is_active: true,
    template_config: {
      message_title: '새로운 계절의 시작',
      title_color: '#E5A866',
      show_intro: true,
      show_countdown: true,
      show_gallery: true,
      show_accounts: true,
      show_rsvp: true,
      show_guestbook: true,
      show_quote_section: true,
      is_active: true,
    },
    interviews: [],
  },

  // 2. 클래식 에디토리얼 (editorial)
  {
    slug: 'editorial',
    template_type: 'editorial',
    groom_name: '강민준',
    bride_name: '박지민',
    groom_name_en: 'Minjun Kang',
    bride_name_en: 'Jimin Park',
    groom_first_name_en: 'Minjun',
    groom_last_name_en: 'Kang',
    bride_first_name_en: 'Jimin',
    bride_last_name_en: 'Park',
    main_names_en: 'Minjun & Jimin',
    groom_relation: '장남',
    bride_relation: '장녀',
    groom_father: '강성훈',
    groom_mother: '조은숙',
    bride_father: '박동원',
    bride_mother: '최수진',
    groom_phone: '010-2345-6789',
    bride_phone: '010-8765-4321',
    wedding_date: '2027-05-15T14:00:00',
    venue_name: '반얀트리 클럽 앤 스파 서울',
    venue_hall: '크리스탈볼룸 1층',
    venue_address: '서울 중구 장충단로 60',
    venue_detail: '동대입구역 6번 출구 (호텔 전용 셔틀 수시 운행)',
    message: '서로를 만나 평범했던 하루가\n조금 더 따뜻하고 특별해졌습니다.\n\n이제 두 사람이 한마음으로\n새로운 계절을 시작하려 합니다.\n\n소중한 분들과 함께\n그 순간을 나누고 싶습니다.\n저희의 첫 걸음에 따뜻한 축복을 보내주세요.',
    quote_content: '우리가 함께한 시간은\n내 인생에서 가장 찬란한 봄이었습니다.\n이제 서로의 손을 꼭 잡고\n평생의 모든 계절을 함께 걸어가려 합니다.',
    quote_source: '두 사람의 이야기',
    images: {
      cover: '/samples/editorial-cover.jpg',
      main: '/samples/editorial-cover.jpg',
      couple_profile: '/samples/editorial-cover.jpg',
      bride_profile: '/samples/bride-solo.jpg',
      groom_profile: '/samples/groom-solo.jpg',
      ending: '/samples/cinematic-cover.jpg',
    },
    gallery_images: [
      '/samples/editorial-cover.jpg',
      '/samples/veil-kiss-bw.jpg',
      '/samples/garden-couple.jpg',
      '/samples/ring-detail.jpg',
      '/samples/bride-solo.jpg',
      '/samples/groom-solo.jpg',
      '/samples/scene-cover.jpg',
      '/samples/cinematic-cover.jpg',
    ],
    accounts: [
      { group: '신랑측', title: '신랑', bank: '하나', number: '245-910123-45678', holder: '강민준', name: '신랑 강민준' },
      { group: '신부측', title: '신부', bank: '토스뱅크', number: '1000-1234-5678', holder: '박지민', name: '신부 박지민' },
    ],
    transportation: [
      { type: 'subway', title: '지하철', content: '3호선 동대입구역 6번 출구 (호텔 셔틀버스 탑승 5분)' },
      { type: 'bus', title: '버스', content: '국립극장 정류장 하차 (순환 01번, 간선 420번)' },
      { type: 'car', title: '자가용', content: '네비게이션에 "반얀트리 클럽 앤 스파 서울" 검색' },
      { type: 'parking', title: '주차안내', content: '호텔 야외 및 지하 주차장 (하객 무료 발렛 & 3시간 무료 주차)' },
    ],
    info_notices: [
      { title: '식사 안내', subtitle: '크리스탈 연회장', content: '정성스런 프렌치 파인다이닝 코스가 준비되어 있습니다.' },
    ],
    bgm_url: 'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/bgm/presets/piano-01.mp3',
    bgm_mode: 'preset',
    is_active: true,
    template_config: {
      message_title: '함께 걷는 첫걸음',
      show_intro: true,
      show_countdown: true,
      show_gallery: true,
      show_accounts: true,
      show_rsvp: true,
      show_guestbook: true,
      show_quote_section: true,
      is_active: true,
    },
    interviews: [],
  },

  // 3. 감성 플레이리스트 (playlist)
  {
    slug: 'playlist',
    template_type: 'playlist',
    groom_name: '강민우',
    bride_name: '서유진',
    groom_name_en: 'Minwoo Kang',
    bride_name_en: 'Yujin Seo',
    groom_first_name_en: 'Minwoo',
    groom_last_name_en: 'Kang',
    bride_first_name_en: 'Yujin',
    bride_last_name_en: 'Seo',
    main_names_en: 'Minwoo & Yujin',
    groom_relation: '장남',
    bride_relation: '차녀',
    groom_father: '강대현',
    groom_mother: '문영희',
    bride_father: '서병철',
    bride_mother: '한정숙',
    groom_phone: '010-3456-7890',
    bride_phone: '010-7654-3210',
    wedding_date: '2026-04-26T14:00:00',
    venue_name: '빌라드지디 청담',
    venue_hall: '르씨엘홀 단독홀',
    venue_address: '서울 강남구 학동로 519',
    venue_detail: '청담역 12번 출구 도보 1분',
    message: '어느 따스한 봄날,\n서로의 멜로디가 어우러져 하나의 화음이 되었습니다.\n\n기쁨은 함께 나누고 슬픔은 다정히 보듬으며\n평생 아름다운 노래처럼 살아가겠습니다.\n\n저희가 시작하는 첫 소절에\n귀한 걸음으로 따뜻한 축복을 더해주세요.',
    quote_content: '내가 그의 이름을 불러주었을 때,\n그는 나에게로 와서\n꽃이 되었다.',
    quote_source: '김춘수 <꽃>',
    images: {
      cover: '/playlist-couple.png',
      main: '/playlist-couple.png',
      couple_profile: '/playlist-couple.png',
      bride_profile: '/samples/bride-solo.jpg',
      groom_profile: '/samples/groom-solo.jpg',
      ending: '/samples/scene-cover.jpg',
    },
    gallery_images: [
      '/playlist-couple.png',
      '/samples/veil-kiss-bw.jpg',
      '/samples/garden-couple.jpg',
      '/samples/ring-detail.jpg',
      '/samples/bride-solo.jpg',
      '/samples/groom-solo.jpg',
      '/samples/editorial-cover.jpg',
      '/samples/cinematic-cover.jpg',
    ],
    accounts: [
      { group: '신랑측', title: '신랑', bank: '카카오뱅크', number: '3333-02-9876543', holder: '강민우', name: '신랑 강민우' },
      { group: '신부측', title: '신부', bank: '신한', number: '110-456-789012', holder: '서유진', name: '신부 서유진' },
    ],
    transportation: [
      { type: 'subway', title: '지하철', content: '7호선 청담역 12번 출구 바로 앞 (도보 1분)' },
      { type: 'bus', title: '버스', content: '청담역.경기고교 정류장 하차 (간선 143, 301, 362번)' },
      { type: 'car', title: '자가용', content: '네비게이션에 "빌라드지디 청담" 검색' },
      { type: 'parking', title: '주차안내', content: '건물 내 기계식 주차 및 전용 외부 주차장 (하객 2시간 무료)' },
    ],
    info_notices: [
      { title: '식사 안내', subtitle: '단독 연회장', content: '정갈하고 풍성한 호텔식 세미 뷔페가 준비되어 있습니다.' },
    ],
    bgm_url: 'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/bgm/presets/piano-01.mp3',
    bgm_mode: 'preset',
    is_active: true,
    template_config: {
      message_title: '저희의 작은 음악회에 초대합니다',
      show_intro: false,
      show_countdown: true,
      show_gallery: true,
      show_accounts: true,
      show_rsvp: true,
      show_guestbook: true,
      show_quote_section: true,
      is_active: true,
    },
    interviews: [],
  },

  // 4. 시네마틱 모노리스 (cinematic)
  {
    slug: 'cinematic',
    template_type: 'cinematic',
    groom_name: '이진호',
    bride_name: '김나은',
    groom_name_en: 'Jinho Lee',
    bride_name_en: 'Naeun Kim',
    groom_first_name_en: 'Jinho',
    groom_last_name_en: 'Lee',
    bride_first_name_en: 'Naeun',
    bride_last_name_en: 'Kim',
    main_names_en: 'Jinho & Naeun',
    groom_relation: '장남',
    bride_relation: '장녀',
    groom_father: '이상엽',
    groom_mother: '배숙자',
    bride_father: '김종국',
    bride_mother: '송지효',
    groom_phone: '010-4567-8901',
    bride_phone: '010-6543-2109',
    wedding_date: '2027-11-07T13:00:00',
    venue_name: '호텔 신라 서울',
    venue_hall: '다이너스티홀 2층',
    venue_address: '서울 중구 동호로 249',
    venue_detail: '동대입구역 5번 출구 (호텔 셔틀버스 수시 운행)',
    message: '어쩌면 스쳐 지나갈 수도 있었던 수많은 날들 속에서\n기적처럼 서로를 발견했습니다.\n\n서로의 눈을 바라볼 때 가장 진실해지고\n서로의 손을 잡을 때 가장 든든해집니다.\n\n두 사람의 인생에서 가장 영화 같은 날,\n소중한 분들과 함께하고 싶습니다.',
    quote_content: '우리의 연애는 지루하고 힘들었다.\n하지만 그 순간 우리의 마음만은 진심이었다.\n그래서 내겐 인생에서\n가장 영화 같은 순간이 되었다.',
    quote_source: '영화 <연애의 온도>',
    images: {
      cover: '/samples/cinematic-cover.jpg',
      main: '/samples/cinematic-cover.jpg',
      couple_profile: '/samples/cinematic-cover.jpg',
      bride_profile: '/samples/bride-solo.jpg',
      groom_profile: '/samples/groom-solo.jpg',
      ending: '/samples/cinematic-cover.jpg',
    },
    gallery_images: [
      '/samples/cinematic-cover.jpg',
      '/samples/veil-kiss-bw.jpg',
      '/samples/editorial-cover.jpg',
      '/samples/ring-detail.jpg',
      '/samples/garden-couple.jpg',
      '/samples/bride-solo.jpg',
      '/samples/groom-solo.jpg',
      '/samples/scene-cover.jpg',
    ],
    accounts: [
      { group: '신랑측', title: '신랑', bank: '국민', number: '456-789-012345', holder: '이진호', name: '신랑 이진호' },
      { group: '신부측', title: '신부', bank: '신한', number: '110-987-654321', holder: '김나은', name: '신부 김나은' },
    ],
    transportation: [
      { type: 'subway', title: '지하철', content: '3호선 동대입구역 5번 출구 (호텔 전용 무료 셔틀버스 5분 간격 운행)' },
      { type: 'bus', title: '버스', content: '장충체육관 앞 하차 (간선 144, 301, 407번)' },
      { type: 'car', title: '자가용', content: '네비게이션에 "서울신라호텔" 또는 "서울 중구 동호로 249" 검색' },
      { type: 'parking', title: '주차안내', content: '호텔 주차타워 및 옥외 주차장 (하객 4시간 무료 주차 및 발렛 서비스)' },
    ],
    info_notices: [
      { title: '식사 안내', subtitle: '다이너스티홀', content: '신라호텔 셰프진이 엄선한 최고급 양식 코스 메뉴가 제공됩니다.' },
    ],
    bgm_url: 'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/bgm/presets/piano-01.mp3',
    bgm_mode: 'preset',
    is_active: true,
    template_config: {
      message_title: '영화 같은 순간의 시작',
      show_intro: true,
      show_countdown: true,
      show_gallery: true,
      show_accounts: true,
      show_rsvp: true,
      show_guestbook: true,
      show_quote_section: true,
      is_active: true,
    },
    interviews: [],
  },

  // 5. 모던 씬 (scene)
  {
    slug: 'scene',
    template_type: 'scene',
    groom_name: '최현우',
    bride_name: '윤서아',
    groom_name_en: 'Hyunwoo Choi',
    bride_name_en: 'Seoa Yoon',
    groom_first_name_en: 'Hyunwoo',
    groom_last_name_en: 'Choi',
    bride_first_name_en: 'Seoa',
    bride_last_name_en: 'Yoon',
    main_names_en: 'Hyunwoo & Seoa',
    groom_relation: '장남',
    bride_relation: '장녀',
    groom_father: '최원석',
    groom_mother: '김희애',
    bride_father: '윤상현',
    bride_mother: '이지은',
    groom_phone: '010-5678-9012',
    bride_phone: '010-5432-1098',
    wedding_date: '2027-04-24T12:30:00',
    venue_name: '더채플앳논현',
    venue_hall: '라포레홀 6층',
    venue_address: '서울 강남구 논현로 549',
    venue_detail: '역삼역 6번 출구 또는 언주역 7번 출구 (도보 5분)',
    message: '함께하는 오늘이\n오래도록 기억될 아름다운 순간이 되기를 바라며\n저희의 결혼식에 초대합니다.\n\n서로를 보듬으며 지혜롭게 살아가겠습니다.\n따뜻한 걸음으로 축복해 주시면 감사하겠습니다.',
    quote_content: '우리가 함께한 시간은\n내 인생에서 가장 찬란한 봄이었습니다.\n이제 서로의 손을 꼭 잡고\n평생의 모든 계절을 함께 걸어가려 합니다.',
    quote_source: '두 사람의 이야기',
    images: {
      cover: '/samples/scene-cover.jpg',
      main: '/samples/scene-cover.jpg',
      couple_profile: '/samples/scene-cover.jpg',
      bride_profile: '/samples/bride-solo.jpg',
      groom_profile: '/samples/groom-solo.jpg',
      ending: '/samples/scene-cover.jpg',
    },
    gallery_images: [
      '/samples/scene-cover.jpg',
      '/samples/veil-kiss-bw.jpg',
      '/samples/garden-couple.jpg',
      '/samples/ring-detail.jpg',
      '/samples/bride-solo.jpg',
      '/samples/groom-solo.jpg',
      '/samples/editorial-cover.jpg',
      '/samples/cinematic-cover.jpg',
    ],
    accounts: [
      { group: '신랑측', title: '신랑', bank: '우리', number: '1002-345-678901', holder: '최현우', name: '신랑 최현우' },
      { group: '신부측', title: '신부', bank: '하나', number: '123-910234-56789', holder: '윤서아', name: '신부 윤서아' },
    ],
    transportation: [
      { type: 'subway', title: '지하철', content: '9호선 언주역 7번 출구 (도보 3분) / 2호선 역삼역 6번 출구 (도보 5분)' },
      { type: 'bus', title: '버스', content: '차병원사거리 정류장 하차 (간선 147, 242, 463번)' },
      { type: 'car', title: '자가용', content: '네비게이션에 "더채플앳논현" 또는 "서울 강남구 논현로 549" 검색' },
      { type: 'parking', title: '주차안내', content: '건물 내 자주식 지하 주차장 완비 (하객 2시간 무료 주차)' },
    ],
    info_notices: [
      { title: '식사 안내', subtitle: '라포레 연회장', content: '정성껏 엄선한 최고급 뷔페가 준비되어 있습니다.' },
    ],
    bgm_url: 'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/bgm/presets/piano-01.mp3',
    bgm_mode: 'preset',
    is_active: true,
    template_config: {
      message_title: '함께하는 오늘이 아름다운 순간으로',
      show_intro: true,
      show_countdown: true,
      show_gallery: true,
      show_accounts: true,
      show_rsvp: true,
      show_guestbook: true,
      show_quote_section: true,
      is_active: true,
    },
    interviews: DEFAULT_INTERVIEWS,
  },
];

async function seedAll() {
  console.log('🚀 5개 템플릿(basic, editorial, playlist, cinematic, scene) 프리미엄 샘플 시딩 시작...');

  for (const tpl of TEMPLATES_DATA) {
    const { data, error } = await supabase
      .from('invitations')
      .upsert(tpl, { onConflict: 'slug' })
      .select('id, slug, template_type, groom_name, bride_name');

    if (error) {
      console.error(`❌ [${tpl.slug}] upsert 실패:`, error.message);
    } else {
      console.log(`✅ [${tpl.slug}] 성공:`, data[0]);
    }
  }

  console.log('✨ 모든 템플릿 시딩 완료!');
}

seedAll();
