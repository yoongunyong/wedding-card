'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

export default function KakaoMap({ address, venueName }) {
  const mapContainer = useRef(null);

  const initMap = () => {
    if (!window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
      const container = mapContainer.current;
      if (!container || !address) return;

      const targetAddress = address;
      const geocoder = new window.kakao.maps.services.Geocoder();

      geocoder.addressSearch(targetAddress, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

          const map = new window.kakao.maps.Map(container, {
            center: coords,
            level: 3,
          });

          const marker = new window.kakao.maps.Marker({
            map: map,
            position: coords,
          });

          const titleText = venueName || targetAddress || '';
          if (titleText) {
            const infowindow = new window.kakao.maps.InfoWindow({
              content: `
                <div style="padding:5px 10px;font-size:12px;font-weight:600;color:#222;font-family:sans-serif;white-space:nowrap;border-radius:4px;text-align:center;">
                  ${titleText}
                </div>
              `,
            });
            infowindow.open(map, marker);
          }
        } else {
          console.warn('카카오맵 주소 검색 실패:', status);
        }
      });
    });
  };

  // 이미 카카오맵 SDK가 로드되어 있는 경우를 위한 useEffect
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      initMap();
    }
  }, [address, venueName]);

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