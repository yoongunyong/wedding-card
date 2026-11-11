import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import BgmPlayer from '@/components/BgmPlayer';
import SampleWatermark from '@/components/SampleWatermark';
import ExpiredWeddingCard from '@/components/ExpiredWeddingCard';
import BasicTemplate from '@/components/templates/basic/BasicTemplate';
import EditorialTemplate from '@/components/templates/editorial/EditorialTemplate';
import PlaylistTemplate from '@/components/templates/playlist/PlaylistTemplate';
import CinematicTemplate from '@/components/templates/cinematic/CinematicTemplate';
import SceneTemplate from '@/components/templates/scene/SceneTemplate';
import QuickNavigationPill from '@/components/QuickNavigationPill';
import { SAMPLE_INVITATIONS } from '@/lib/sampleInvitations';
import { getSafeKakaoShareImageUrl } from '@/lib/kakaoShare';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TEMPLATE_MAP = {
  basic: BasicTemplate,
  editorial: EditorialTemplate,
  playlist: PlaylistTemplate,
  cinematic: CinematicTemplate,
  scene: SceneTemplate,
};

// SNS/카카오톡 공유 메타데이터 (OG 태그)
export async function generateMetadata({ params }) {
  const { slug } = await params;

  let invitation = null;

  try {
    const { data } = await supabase
      .from('invitations')
      .select('template_type, groom_name, bride_name, wedding_date, venue_name, venue_hall, images')
      .eq('slug', slug)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    invitation = data;
  } catch (err) {
    console.warn('generateMetadata Supabase error:', err);
  }

  // DB에 없을 때 공식 5대 템플릿 샘플 fallback
  if (!invitation && SAMPLE_INVITATIONS[slug]) {
    invitation = SAMPLE_INVITATIONS[slug];
  }

  if (!invitation) {
    return {
      title: '모바일 청첩장',
    };
  }

  // 공유 썸네일: images.cover 최우선
  const rawOg = invitation.images?.cover || invitation.images?.main || (SAMPLE_INVITATIONS[slug]?.images?.cover || '');
  const ogImage = getSafeKakaoShareImageUrl(rawOg, invitation.template_type || slug);
  const coupleText = [invitation.groom_name, invitation.bride_name].filter(Boolean).join(' ♥ ');
  const title = coupleText ? `${coupleText} 결혼합니다` : '모바일 청첩장';
  const fullVenue = [invitation.venue_name, invitation.venue_hall].filter(Boolean).join(' ');
  const description = [invitation.wedding_date, fullVenue].filter(Boolean).join(' | ') || '소중한 분들을 초대합니다';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 800,
              height: 1000,
              alt: coupleText ? `${coupleText} 청첩장` : '모바일 청첩장',
            },
          ]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
    // 신랑·신부 및 혼주 개인정보(실명, 계좌, 연락처) 검색엔진 노출 원천 차단 (SNS 카톡 공유 OG태그는 정상 작동)
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        'max-video-preview': -1,
        'max-image-preview': 'none',
        'max-snippet': -1,
      },
    },
  };
}

// 청첩장 메인 렌더링
export default async function WeddingCardPage({ params }) {
  const { slug } = await params;

  let invitation = null;

  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('slug', slug)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      invitation = data;
    }
  } catch (err) {
    console.warn('WeddingCardPage Supabase fetch error:', err);
  }

  // DB에 데이터가 없더라도 5대 공식 시안(basic, editorial, playlist, cinematic, scene)이면
  // 개발 단계 및 프리뷰에서 404 없이 즉시 최고 품질의 AI 화보 샘플로 렌더링
  const isSampleSlug = Boolean(SAMPLE_INVITATIONS[slug]);
  if (!invitation && isSampleSlug) {
    invitation = {
      ...SAMPLE_INVITATIONS[slug],
      is_sample_preview: true,
    };
  }

  if (!invitation) {
    return notFound();
  }

  // 공식 샘플 slug인 경우 SAMPLE_INVITATIONS의 최신 큐레이션 이미지/갤러리 최우선 적용
  if (isSampleSlug && SAMPLE_INVITATIONS[slug]) {
    const sampleRef = SAMPLE_INVITATIONS[slug];
    invitation = {
      ...invitation,
      ...sampleRef,
      images: {
        ...sampleRef.images,
      },
      gallery_images: sampleRef.gallery_images,
    };
  }

  // 서비스 만료일시(service_expired_at) 기준 만료 여부 확인
  let isExpired = false;
  if (!isSampleSlug) {
    const rawExpiredAt = invitation.service_expired_at ?? invitation.template_config?.service_expired_at;

    if (rawExpiredAt !== undefined) {
      if (rawExpiredAt === null) {
        // null로 명시된 경우 무제한(영구 보관) 상태 -> 절대 만료되지 않음
        isExpired = false;
      } else {
        try {
          const expDate = new Date(rawExpiredAt);
          if (!isNaN(expDate.getTime())) {
            isExpired = Date.now() > expDate.getTime();
          }
        } catch (e) {
          console.warn('service_expired_at parse error:', e);
        }
      }
    } else if (invitation.wedding_date) {
      // 하위 호환: 컬럼 값이 아직 없는 레코드는 예식일 + 1년으로 fallback
      try {
        const weddingDate = new Date(invitation.wedding_date.replace(' ', 'T'));
        if (!isNaN(weddingDate.getTime())) {
          const oneYearMs = 365 * 24 * 60 * 60 * 1000;
          if (Date.now() > weddingDate.getTime() + oneYearMs) {
            isExpired = true;
          }
        }
      } catch (e) {
        console.warn('Wedding date fallback parse error:', e);
      }
    }
  }

  if (isExpired) {
    return <ExpiredWeddingCard invitation={invitation} />;
  }

  const CurrentTemplate = TEMPLATE_MAP[invitation.template_type] || BasicTemplate;
  const isActive = invitation.is_active ?? invitation.template_config?.is_active ?? true;

  const isCinematic = invitation.template_type === 'cinematic';
  const templateType = invitation.template_type || 'basic';

  // 시안 1, 2만 별도 오프닝 커버 화면(수락/OPEN 버튼)이 있고, 시안 3, 4, 5는 바로 본문 시작
  // 오프닝 커버가 있는 경우: '수락' 버튼 클릭 시 BGM 시작
  // 오프닝 커버가 없는 경우(시안 3,4,5): 하객의 첫 화면 터치(click/touchstart) 시 BGM 자동 시작
  const hasActualIntro = ['basic', 'editorial'].includes(templateType) && invitation?.template_config?.show_intro !== false;

  // 하객 화면에는 관리자 비밀번호, 토큰, 주문 코드가 절대 노출되지 않도록 철저히 삭제
  const safeConfig = { ...(invitation.template_config || {}) };
  delete safeConfig.manage_password;

  const sanitizedInvitation = {
    ...invitation,
    template_config: safeConfig,
  };
  delete sanitizedInvitation.manage_token;
  delete sanitizedInvitation.order_code;
  delete sanitizedInvitation.manage_password;

  // 어르신/혼주 및 하객 퀵 내비게이션 (오시는 길 / 계좌) 유무 계산
  const hasLocation = Boolean(invitation?.venue_name || invitation?.venue_address);
  const rawAccounts = [
    invitation?.groom_accounts,
    invitation?.bride_accounts,
    invitation?.account_number,
  ];
  const hasAccounts = (invitation?.template_config?.show_accounts !== false) && (
    isSampleSlug ||
    rawAccounts.some((acc) => {
      if (!acc) return false;
      if (Array.isArray(acc)) return acc.length > 0;
      if (typeof acc === 'string') return acc.trim().length > 0;
      return true;
    })
  );

  return (
    <main className={`min-h-screen ${isCinematic ? 'bg-neutral-100' : 'bg-stone-100'} sm:py-8 flex justify-center p-0 m-0 relative`}>
      {!isActive && <SampleWatermark />}
      <BgmPlayer 
        bgmUrl={invitation.bgm_url} 
        hasIntro={hasActualIntro} 
        template={invitation.template_type}
      />
      <CurrentTemplate invitation={sanitizedInvitation} />
      <QuickNavigationPill hasLocation={hasLocation} hasAccounts={hasAccounts} />
    </main>
  );
}
