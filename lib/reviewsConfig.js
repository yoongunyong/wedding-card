import { supabase } from '@/lib/supabase';

export const DEFAULT_REVIEWS = [
  {
    id: 1,
    names: '원빈 ♥ 이나영 부부',
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
    names: '조정석 ♥ 거미 부부',
    wedding_date: '2024.12 예식',
    template_type: 'playlist',
    template_name: '시안 3. 플레이리스트',
    rating: 5,
    tag: 'BGM 최고 · 2030 하객 반응 폭발',
    quote: '“플레이리스트 오프닝 보고 친구들 단톡방이 터졌습니다”',
    content: '저희가 좋아하는 연주곡을 담을 수 있는 게 신의 한 수였어요. 2030 지인들이 플레이리스트 감성 보면서 "진짜 센스 넘친다"고 칭찬 일색이었습니다. 어르신들도 퀵 내비게이션으로 식장 위치 바로 찾으셔서 혼주분들도 만족하셨어요.',
  },
  {
    id: 3,
    names: '이병헌 ♥ 이민정 부부',
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
    names: '연정훈 ♥ 한가인 부부',
    wedding_date: '2025.02 예식',
    template_type: 'scene',
    template_name: '시안 5. 레트로 캠코더',
    rating: 5,
    tag: '90s 캠코더 감성 · 편리한 관리',
    quote: '“캠코더 뷰파인더 오프닝 보고 하객들이 어디서 했냐고 난리였어요”',
    content: '90년대 빈티지 캠코더 화면처럼 REC 불빛 깜빡이고 비네팅 들어간 게 너무 힙해서 선택했는데 대만족입니다! 하객들도 처음 보는 신선한 청첩장이라고 칭찬해주시고, 참석 여부(RSVP) 엑셀 집계도 간편해서 식대 예산 잡기 정말 편했습니다.',
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
