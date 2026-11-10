'use client';

export default function MapNavigation({ venueName = '', venueAddress = '' }) {
  // 주소 또는 식장 이름 URL 인코딩 (undefined 방지)
  const searchQuery = venueName || venueAddress || '';
  const encodedVenue = encodeURIComponent(searchQuery);
  const encodedAddress = encodeURIComponent(venueAddress || venueName || '');

  // 1. 네이버 지도 웹/앱 링크
  const openNaverMap = () => {
    if (!searchQuery) return alert('장소 정보가 등록되지 않았습니다.');
    window.open(`https://map.naver.com/p/search/${encodedVenue}`, '_blank');
  };

  // 2. 카카오맵 웹/앱 링크
  const openKakaoMap = () => {
    if (!searchQuery) return alert('장소 정보가 등록되지 않았습니다.');
    window.open(`https://map.kakao.com/link/search/${encodedVenue}`, '_blank');
  };

  // 3. 티맵 (모바일 앱 연동 및 PC 예외 방어)
  const openTmap = () => {
    if (!searchQuery) return alert('장소 정보가 등록되지 않았습니다.');
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
    if (isMobile) {
      window.location.href = `tmap://search?name=${encodedVenue}`;
    } else {
      alert('티맵 내비게이션은 스마트폰 모바일 환경에서만 지원됩니다.\nPC 환경에서는 네이버 지도 또는 카카오맵을 이용해 주세요.');
    }
  };

  // 주소 복사하기 기능
  const handleCopyAddress = async () => {
    const textToCopy = venueAddress || venueName || '';
    if (!textToCopy) {
      alert('복사할 주소 정보가 없습니다.');
      return;
    }
    let ok = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        ok = true;
      } catch {}
    }
    if (!ok && typeof document !== 'undefined') {
      try {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }
    alert(ok ? '식장 주소가 복사되었습니다.' : '주소 복사에 실패했습니다.');
  };

  return (
    <div className="mt-4 space-y-3">
      {/* 주소 복사 버튼 */}
      <button
        onClick={handleCopyAddress}
        className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
      >
        <span>📋</span>
        <span>주소 복사하기</span>
      </button>

      {/* 내비게이션 바로가기 버튼 3종 */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={openNaverMap}
          className="py-2 px-1 bg-[#03C75A]/10 text-[#03C75A] border border-[#03C75A]/20 hover:bg-[#03C75A]/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <span>네이버 지도</span>
        </button>
        <button
          onClick={openKakaoMap}
          className="py-2 px-1 bg-[#FEE500]/30 text-stone-800 border border-[#FEE500] hover:bg-[#FEE500]/50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <span>카카오맵</span>
        </button>
        <button
          onClick={openTmap}
          className="py-2 px-1 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <span>티맵</span>
        </button>
      </div>
    </div>
  );
}