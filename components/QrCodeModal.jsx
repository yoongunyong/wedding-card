'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function QrCodeModal({ isOpen, onClose, url, title = '모바일 청첩장', slug = 'wedding' }) {
  const [qrDataUrlWhite, setQrDataUrlWhite] = useState('');
  const [qrDataUrlTransparent, setQrDataUrlTransparent] = useState('');

  const loading = isOpen && !qrDataUrlWhite;

  useEffect(() => {
    if (!isOpen || !url) return;
    let isMounted = true;

    const generateQrs = async () => {
      try {
        // 1. 기본 흰색 배경 고화질 (1024px, 300DPI 인쇄 권장)
        const whiteUrl = await QRCode.toDataURL(url, {
          width: 1024,
          margin: 2,
          color: {
            dark: '#1C1917',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H', // 고품질 오류 복원
        });

        // 2. 투명 배경 고화질 (디자인 합성용)
        const transUrl = await QRCode.toDataURL(url, {
          width: 1024,
          margin: 2,
          color: {
            dark: '#1C1917',
            light: '#00000000',
          },
          errorCorrectionLevel: 'H',
        });

        if (isMounted) {
          setQrDataUrlWhite(whiteUrl);
          setQrDataUrlTransparent(transUrl);
        }
      } catch (err) {
        console.error('QR code generation failed:', err);
      }
    };

    generateQrs();

    return () => {
      isMounted = false;
    };
  }, [isOpen, url]);

  if (!isOpen) return null;

  // 다운로드 헬퍼
  const handleDownload = (dataUrl, suffix) => {
    if (!dataUrl) return;
    const cleanTitle = (title || 'wedding').replace(/[\\/:*?"<>|]/g, '').trim();
    const fileName = `${cleanTitle}_QR코드_${suffix}.png`;
    
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-[420px] rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-stone-400 hover:text-stone-800 text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* 상단 타이틀 */}
        <p className="text-[10px] font-mono tracking-[0.25em] text-stone-400 uppercase mb-1">
          PRINT READY · 1024PX HQ
        </p>
        <h3 className="text-lg sm:text-xl font-serif text-stone-900 font-bold mb-1">
          종이 청첩장 인쇄용 QR코드
        </h3>
        <p className="text-xs text-stone-500 font-light mb-6 break-keep">
          종이 청첩장 제작 시 인쇄소나 디자이너에게 아래 QR코드 이미지를 전달해 주시면 됩니다.
        </p>

        {/* QR 미리보기 카드 */}
        <div className="bg-[#FAF9F5] p-6 rounded-2xl border border-stone-200/80 mb-5 flex flex-col items-center">
          <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-xs border border-stone-200/60 flex items-center justify-center mb-3">
            {loading ? (
              <span className="text-xs text-stone-400 font-mono animate-pulse">QR 생성 중...</span>
            ) : qrDataUrlWhite ? (
              <img 
                src={qrDataUrlWhite} 
                alt="QR Code" 
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs text-rose-500">생성 실패</span>
            )}
          </div>
          <p className="text-[11px] font-mono text-stone-600 truncate max-w-full px-2 font-medium">
            {url}
          </p>
          <span className="text-[10px] text-stone-400 mt-0.5">
            ※ 카메라로 스캔하면 모바일 청첩장이 열립니다
          </span>
        </div>

        {/* 안내 팁 */}
        <div className="text-left bg-stone-50 p-3.5 rounded-xl border border-stone-200/60 mb-6 text-[11px] text-stone-600 leading-relaxed font-light space-y-1">
          <p>✦ <strong>인쇄용 1024×1024 고해상도</strong>로 인쇄 시 깨짐 없이 선명합니다.</p>
          <p>✦ 배경 투명 파일은 종이 청첩장 배경 색상에 맞춰 합성할 때 유용합니다.</p>
        </div>

        {/* 다운로드 버튼 2종 */}
        <div className="space-y-2">
          <button
            type="button"
            disabled={loading || !qrDataUrlWhite}
            onClick={() => handleDownload(qrDataUrlWhite, '기본_흰색배경')}
            className="w-full py-3.5 px-4 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>고화질 PNG 다운로드 (기본 흰색 배경)</span>
          </button>

          <button
            type="button"
            disabled={loading || !qrDataUrlTransparent}
            onClick={() => handleDownload(qrDataUrlTransparent, '배경투명_합성용')}
            className="w-full py-3 px-4 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>배경 투명 PNG 다운로드 (디자인 합성용)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
