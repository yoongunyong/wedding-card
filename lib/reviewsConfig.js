import { supabase } from '@/lib/supabase';

export const DEFAULT_REVIEWS = [
  {
    id: 1,
    names: '이*민 ♥ 강*서 부부',
    wedding_date: '2024.11 예식',
    template_type: 'editorial',
    template_name: '시안 2. 에디토리얼 매거진',
    rating: 5,
    tag: '트렌디한 감성 · 화보 퀄리티',
    quote: '“하객들이 명품 잡지 화보인 줄 알았다고 난리였어요”',
    content: '청첩장 돌리고 친구들한테 어디서 했냐는 연락을 정말 많이 받았어요. 잡지 화보 같은 세련된 룩에 BGM까지 나오니까 흔한 모바일 청첩장이 아니라 두 사람만의 웹 매거진을 선물받은 기분이라고 다들 감탄했습니다!',
  },
  {
    id: 2,
    names: '박*준 ♥ 최*아 부부',
    wedding_date: '2024.12 예식',
    template_type: 'playlist',
    template_name: '시안 3. 플레이리스트',
    rating: 5,
    tag: 'BGM 최고 · 2030 하객 반응 폭발',
    quote: '“에어드랍 인트로 열어보고 친구들 단톡방이 터졌습니다”',
    content: '저희가 좋아하는 연주곡을 담을 수 있는 게 신의 한 수였어요. 2030 지인들이 바이닐 LP 판 돌아가는 거 보면서 "진짜 센스 넘친다"고 칭찬 일색이었습니다. 어르신들도 퀵 내비게이션으로 식장 위치 바로 찾으셔서 혼주분들도 만족하셨어요.',
  },
  {
    id: 3,
    names: '정*우 ♥ 윤*진 부부',
    wedding_date: '2025.01 예식',
    template_type: 'cinematic',
    template_name: '시안 4. 시네마틱 필름',
    rating: 5,
    tag: '영화 같은 분위기 · 고급스러운 마감',
    quote: '“어르신들도 계좌 복사가 쉬워서 너무 편하다고 하셨어요”',
    content: '호텔 예식이라 고급스러운 무드를 원했는데 시네마틱 시안이 찰떡이었습니다. 사진 하나하나 영화 스틸컷처럼 무게감 있게 표현되고, 다크 모드 연출까지 완벽해서 하객분들이 끝까지 스크롤을 다 내렸다고 하네요.',
  },
  {
    id: 4,
    names: '한*훈 ♥ 송*은 부부',
    wedding_date: '2025.02 예식',
    template_type: 'scene',
    template_name: '시안 5. 모던 씬 (인터뷰)',
    rating: 5,
    tag: '감동적인 인터뷰 · 편리한 관리',
    quote: '“하객 참석 여부(RSVP) 엑셀 다운로드 덕에 식대 100만원 아꼈습니다”',
    content: '신랑 신부 인터뷰 질문 답변 코너를 읽고 양가 부모님과 친척분들이 눈물 날 뻔했다고 좋아해 주셨어요. 참석 여부(RSVP)랑 식사 인원도 관리자 화면에서 실시간으로 엑셀로 내려받을 수 있어서 예식 준비가 정말 수월했습니다.',
  },
];

export const DEFAULT_REVIEWS_CONFIG = {
  badge_subtitle: '1,200+ 쌍의 신혼부부가 증명하는 만족도 99%의 경험',
  naver_reviews_url: 'https://smartstore.naver.com',
  reviews: DEFAULT_REVIEWS,
};

/**
 * 최신 후기 설정 불러오기
 */
export async function getReviewsConfig() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'reviews')
      .maybeSingle();

    if (!error && data?.value) {
      return { ...DEFAULT_REVIEWS_CONFIG, ...data.value };
    }
  } catch (err) {
    console.warn('site_settings reviews fetch error, fallback:', err);
  }

  // 로컬스토리지 백업
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('wedding_card_reviews_config');
      if (local) {
        return { ...DEFAULT_REVIEWS_CONFIG, ...JSON.parse(local) };
      }
    } catch (_) {}
  }

  return DEFAULT_REVIEWS_CONFIG;
}

/**
 * 후기 설정 저장하기 (Supabase DB 'reviews' 키)
 */
export async function saveReviewsConfig(newConfig) {
  const merged = { ...DEFAULT_REVIEWS_CONFIG, ...newConfig };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('wedding_card_reviews_config', JSON.stringify(merged));
    } catch (_) {}
  }

  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'reviews',
        value: merged,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      return { success: false, error: error.message, config: merged };
    }

    return { success: true, config: merged };
  } catch (err) {
    return { success: false, error: err.message, config: merged };
  }
}
