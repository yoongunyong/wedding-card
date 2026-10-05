'use client';

export default function MapNavigation({ venueName, venueAddress }) {
  // 주소 또는 식장 이름 URL 인코딩
  const encodedVenue = encodeURIComponent(venueName);
  const encodedAddress = encodeURIComponent(venueAddress);

  // 1. 네이버 지도 웹/앱 링크
  const openNaverMap = () => {
    window.open(`https://map.naver.com/p/search/${encodedVenue}`, '_blank');
  };

  // 2. 카카오맵 웹/앱 링크
  const openKakaoMap = () => {
    window.open(`https://map.kakao.com/link/search/${encodedVenue}`, '_blank');
  };

  // 3. 티맵 (모바일 앱 바로 열기 scheme)
  const openTmap = () => {
    window.open(`tmap://search?name=${encodedVenue}`, '_blank');
  };

  // 주소 복사하기 기능
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(venueAddress);
      alert('식장 주소가 복사되었습니다.');
    } catch {
      alert('주소 복사에 실패했습니다.');
    }
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