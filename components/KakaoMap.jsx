'use client';

import { useRef } from 'react';
import Script from 'next/script';

export default function KakaoMap({ address, venueName }) {
  const mapContainer = useRef(null);

  const initMap = () => {
    if (!window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
      const container = mapContainer.current;
      if (!container) return;

      const targetAddress = address || '경북 구미시 금오산로 400';
      const geocoder = new window.kakao.maps.services.Geocoder();

      geocoder.addressSearch(targetAddress, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

          // 지도 초기화 (줌 레벨 4: 모바일 보기 최적화)
          const map = new window.kakao.maps.Map(container, {
            center: coords,
            level: 4,
          });

          // 핀(마커) 추가
          const marker = new window.kakao.maps.Marker({
            map: map,
            position: coords,
          });

          // 장소 이름 말풍선
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding:6px 12px;font-size:12px;font-weight:600;color:#222;font-family:sans-serif;white-space:nowrap;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.1);">
                ${venueName || '예식장'}
              </div>
            `,
          });
          infowindow.open(map, marker);
        }
      });
    });
  };

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <div
        ref={mapContainer}
        className="w-full h-60 rounded-xl overflow-hidden shadow-sm border border-stone-200 bg-[#FAF8F5]"
      />
    </>
  );
}