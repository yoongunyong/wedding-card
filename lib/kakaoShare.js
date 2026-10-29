/**
 * 카카오톡 공유하기 및 SNS Open Graph용 안전한 공개 절대 URL 헬퍼
 * - 카카오톡 스크랩 봇은 절대 URL(https://)만 크롤링 가능하며, localhost나 상대경로는 이미지를 가져오지 못함
 * - Supabase Storage에 호스팅된 영구 공개 이미지 URL을 연동하여 로컬/배포 환경 무관하게 100% 대표 화보 렌더링 보장
 */

export const SUPABASE_SAMPLE_IMAGES = {
  'main-02-editorial.jpg': 'https://muveizejbvjiqkbtebmm.supabase.co/storage/v1/object/public/wedding-images/samples/main-02-editorial.jpg',
  'garden-couple.jpg': 'https://muveizejbvjiqkbtebmm.supabase.co/storage/v1/object/public/wedding-images/samples/garden-couple.jpg',
  'couple-ring-flowers.jpg': 'https://muveizejbvjiqkbtebmm.supabase.co/storage/v1/object/public/wedding-images/samples/couple-ring-flowers.jpg',
  'main-03-playlist.jpg': 'https://muveizejbvjiqkbtebmm.supabase.co/storage/v1/object/public/wedding-images/samples/main-03-playlist.jpg',
  'main-04-cinematic.jpg': 'https://muveizejbvjiqkbtebmm.supabase.co/storage/v1/object/public/wedding-images/samples/main-04-cinematic.jpg',
  'main-05-scene.jpg': 'https://muveizejbvjiqkbtebmm.supabase.co/storage/v1/object/public/wedding-images/samples/main-05-scene.jpg',
  'scene-cover.jpg': 'https://muveizejbvjiqkbtebmm.supabase.co/storage/v1/object/public/wedding-images/samples/scene-cover.jpg',
  'cinematic-cover.jpg': 'https://muveizejbvjiqkbtebmm.supabase.co/storage/v1/object/public/wedding-images/samples/cinematic-cover.jpg',
};

export const TEMPLATE_DEFAULT_SHARE_IMAGE = {
  editorial: SUPABASE_SAMPLE_IMAGES['main-02-editorial.jpg'],
  basic: SUPABASE_SAMPLE_IMAGES['garden-couple.jpg'],
  playlist: SUPABASE_SAMPLE_IMAGES['main-03-playlist.jpg'],
  cinematic: SUPABASE_SAMPLE_IMAGES['main-04-cinematic.jpg'],
  scene: SUPABASE_SAMPLE_IMAGES['main-05-scene.jpg'],
};

/**
 * 카카오톡 공유용 안전한 공인 HTTPS 이미지 절대 URL 반환
 * @param {string} imgSrc - 이미지 경로 (상대경로, Supabase URL, 외부 URL 등)
 * @param {string} templateType - 템플릿 종류 ('editorial' | 'basic' | 'playlist' | 'cinematic' | 'scene')
 * @returns {string} - 카카오톡 스크랩 봇이 즉시 다운로드 가능한 공개 HTTPS 절대 URL
 */
export function getSafeKakaoShareImageUrl(imgSrc, templateType = 'basic') {
  const fallback = TEMPLATE_DEFAULT_SHARE_IMAGE[templateType] || TEMPLATE_DEFAULT_SHARE_IMAGE.editorial;

  if (!imgSrc || typeof imgSrc !== 'string') {
    return fallback;
  }

  // 1. 이미 완전한 외부 HTTPS 공개 URL인 경우 (사설망/localhost 제외)
  const isLocalHost = /^(http|https):\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))/i.test(imgSrc);
  if (imgSrc.startsWith('https://') && !isLocalHost) {
    return imgSrc;
  }

  // 2. 파일명 추출하여 사전 업로드된 Supabase CDN 영구 공개 이미지 매핑
  const cleanName = imgSrc.split('?')[0].split('#')[0].split('/').pop();
  if (cleanName && SUPABASE_SAMPLE_IMAGES[cleanName]) {
    return SUPABASE_SAMPLE_IMAGES[cleanName];
  }

  // 3. 브라우저 환경에서 실제 도메인이 사설/로컬이 아닌 배포 도메인인 경우
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    if (!/^(http|https):\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.)/i.test(origin)) {
      return `${origin}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
    }
  }

  // 4. 로컬호스트 환경이거나 미매칭 시 해당 템플릿의 고화질 공인 CDN 대표 화보 반환
  return fallback;
}
