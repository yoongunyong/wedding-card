import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
let url = '', key = '';
for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function seedBasicDemo() {
  const basicData = {
    slug: 'basic',
    groom_name: '이도현',
    bride_name: '임지연',
    groom_name_en: 'Dohyun Lee',
    bride_name_en: 'Jiyeon Lim',
    groom_first_name_en: 'Dohyun',
    groom_last_name_en: 'Lee',
    bride_first_name_en: 'Jiyeon',
    bride_last_name_en: 'Lim',
    main_names_en: 'Dohyun & Jiyeon',
    groom_relation: '장남',
    bride_relation: '차녀',
    groom_father: '이정재',
    groom_mother: '김선영',
    bride_father: '임하룡',
    bride_mother: '박미선',
    groom_phone: '010-1234-5678',
    bride_phone: '010-8765-4321',
    wedding_date: '2026-11-21T14:00:00',
    venue_name: '아펠가모 반포',
    venue_hall: '단독홀 LL층',
    venue_address: '서울 서초구 반포대로 235',
    venue_detail: '고속터미널역 3번 출구 도보 5분',
    message: '서로를 만나 평범했던 하루가\n조금 더 따뜻하고 특별해졌습니다.\n\n이제 두 사람이 한마음으로\n새로운 계절을 시작하려 합니다.\n\n소중한 분들과 함께\n그 순간을 나누고 싶습니다.\n저희의 첫 걸음에 따뜻한 축복을 보내주세요.',
    quote_content: '우리의 연애는 지루하고 힘들었다.\n하지만 그 순간 우리의 마음만은 진심이었다.\n그래서 내겐 인생에서\n가장 영화 같은 순간이 되었다.',
    quote_source: '영화 <연애의 온도>',
    images: {
      main: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
      cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
      couple_profile: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1000&q=80',
      bride_profile: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
      groom_profile: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
      ending: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80',
    },
    gallery_images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
    ],
    accounts: [
      { group: '신랑측', title: '신랑', bank: '국민', number: '123-456-789012', holder: '이도현', name: '신랑 이도현' },
      { group: '신부측', title: '신부', bank: '카카오뱅크', number: '3333-01-2345678', holder: '임지연', name: '신부 임지연' },
    ],
    transportation: [
      { type: 'subway', title: '지하철', content: '3, 7, 9호선 고속터미널역 3번 출구 (도보 5분)' },
      { type: 'bus', title: '버스', content: '고속터미널 정류장 하차 (간선 142, 360, 401, 462번)' },
      { type: 'car', title: '자가용', content: '네비게이션에 "아펠가모 반포" 또는 "서울 서초구 반포대로 235" 검색' },
      { type: 'parking', title: '주차안내', content: '건물 내 지하 주차장 이용 (하객 2시간 무료 주차)' },
    ],
    info_notices: [
      { title: '식사 안내', subtitle: '연회장 LL층', content: '정성껏 준비한 프리미엄 뷔페 식사가 마련되어 있습니다.\n식사는 예식 30분 전부터 이용 가능합니다.' },
      { title: '화환 안내', subtitle: '', content: '화환은 정중히 사양하오니 너른 양해 부탁드립니다.' },
    ],
    bgm_url: 'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/bgm/presets/piano-01.mp3',
    bgm_mode: 'preset',
    template_type: 'basic',
    is_active: true,
    template_config: {
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
  };

  const { data, error } = await supabase.from('invitations').upsert(basicData, { onConflict: 'slug' }).select();
  if (error) {
    console.error('Error inserting basic demo:', error);
  } else {
    console.log('Successfully seeded basic demo:', data[0]?.slug);
  }
}

seedBasicDemo();
