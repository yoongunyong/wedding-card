'use client';

import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { supabase } from '@/lib/supabase';

export default function GuestPhotoManager({ invitation }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });
  const [selectedPhoto, setSelectedPhoto] = useState(null); // 라이트박스 뷰어용

  const MAX_PHOTOS = 100;

  // 하객 사진 목록 불러오기
  const fetchPhotos = async () => {
    if (!invitation?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('guest_photos')
        .select('*')
        .eq('invitation_id', invitation.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPhotos(data);
      }
    } catch (err) {
      console.warn('guest_photos fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [invitation?.id]);

  // 개별 사진 삭제
  const handleDeletePhoto = async (photoId) => {
    if (!confirm('이 사진을 보관함에서 삭제하시겠습니까? (삭제 후 복구할 수 없습니다)')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('guest_photos')
        .delete()
        .eq('id', photoId);

      if (error) {
        alert('삭제에 실패했습니다. 다시 시도해 주세요.');
        return;
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(null);
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    }
  };

  // 단일 사진 다운로드
  const handleDownloadSingle = async (photo) => {
    try {
      const res = await fetch(photo.photo_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (photo.sender_name || '하객').replace(/[^\w\s가-힣]/g, '_');
      a.download = `하객스냅_${safeName}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // iOS Safari 비동기 다운로드 호환성을 위해 revoke를 1분 지연
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error(err);
      // 모바일 웹뷰 등에서 blob fetch 차단 시 새 창으로 직접 열기 fallback
      window.open(photo.photo_url, '_blank');
    }
  };

  // 전체 사진 ZIP 압축 일괄 다운로드
  const handleDownloadAllZip = async () => {
    if (photos.length === 0) {
      alert('다운로드할 하객 사진이 없습니다.');
      return;
    }

    setDownloadingZip(true);
    setZipProgress({ current: 0, total: photos.length });

    try {
      const zip = new JSZip();
      const folder = zip.folder('wedding_guest_snaps');

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setZipProgress({ current: i + 1, total: photos.length });

        try {
          const res = await fetch(photo.photo_url);
          const blob = await res.blob();
          const safeName = (photo.sender_name || '하객').replace(/[^\w\s가-힣]/g, '_');
          const ext = photo.photo_url.split('.').pop()?.split('?')[0] || 'jpg';
          const filename = `${String(i + 1).padStart(3, '0')}_${safeName}.${ext}`;
          folder.file(filename, blob);
        } catch (fetchErr) {
          console.warn(`Failed to fetch photo for zip: ${photo.photo_url}`, fetchErr);
        }
      }

      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        mimeType: 'application/zip'
      });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const groom = invitation.groom_name || '신랑';
      const bride = invitation.bride_name || '신부';
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `${groom}_${bride}_하객스냅전체_${todayStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // iOS Safari 비동기 다운로드 호환성을 위해 revoke를 2분 지연
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('ZIP 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const percentage = Math.min(100, Math.round((photos.length / MAX_PHOTOS) * 100));

  return (
    <div className="space-y-6">
      {/* 상단 현황 카드 */}
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                GUEST SNAP BOX
              </span>
              <h3 className="text-base font-bold text-stone-900">
                하객 현장 사진 보관함
              </h3>
            </div>
            <p className="text-xs text-stone-500 font-light">
              하객들이 본식 당일 청첩장을 통해 선물한 소중한 사진들을 한곳에서 모아봅니다.
            </p>
          </div>

          {/* 일괄 다운로드 버튼 */}
          <button
            type="button"
            onClick={handleDownloadAllZip}
            disabled={downloadingZip || photos.length === 0}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
              downloadingZip || photos.length === 0
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-stone-900 hover:bg-black text-white active:scale-98'
            }`}
          >
            <span>📦</span>
            <span>
              {downloadingZip
                ? `압축 중 (${zipProgress.current}/${zipProgress.total})...`
                : `전체 사진 ZIP 다운로드 (${photos.length}장)`}
            </span>
          </button>
        </div>

        {/* 용량 게이지 바 */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
            <span>보관함 채움 상태</span>
            <span className="font-mono font-bold text-stone-900">
              {photos.length} / {MAX_PHOTOS}장 ({percentage}%)
            </span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                percentage >= 90 ? 'bg-amber-600' : 'bg-stone-900'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* 모바일 저장 위치 & 30일 보관 정책 안내 */}
        <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-[11px] text-amber-950 font-light leading-relaxed space-y-1.5">
          <div className="flex items-start gap-2">
            <span className="text-amber-700 font-bold shrink-0">📁</span>
            <div>
              <strong>스마트폰 저장 위치:</strong> 다운로드하신 파일은 사진첩이 아닌 <strong>[아이폰: 파일 앱 ➔ 다운로드]</strong> 또는 <strong>[갤럭시: 내 파일 앱 ➔ 다운로드]</strong> 폴더로 이동합니다. (ZIP 파일을 터치하면 압축이 풀리며 사진첩으로 복사하실 수 있습니다)
            </div>
          </div>
          <div className="flex items-start gap-2 pt-1 border-t border-amber-200/50 text-[10.5px] text-amber-900/90">
            <span className="text-amber-700 font-bold shrink-0">📌</span>
            <div>
              하객 사진은 예식일로부터 <strong>30일간 안전하게 보관</strong>됩니다. [전체 사진 ZIP 다운로드]를 통해 PC나 스마트폰에 미리 평생 소장해 두세요.
            </div>
          </div>
        </div>
      </div>

      {/* 사진 그리드 리스트 */}
      {loading ? (
        <div className="py-20 text-center text-xs text-stone-400 font-light">
          하객 사진을 불러오는 중입니다...
        </div>
      ) : photos.length === 0 ? (
        <div className="py-20 px-4 text-center bg-white rounded-2xl border border-dashed border-stone-200">
          <span className="text-3xl block mb-2">📷</span>
          <h4 className="text-sm font-bold text-stone-800 mb-1">
            아직 도착한 하객 사진이 없습니다
          </h4>
          <p className="text-xs text-stone-500 font-light max-w-sm mx-auto leading-relaxed">
            결혼식 날 하객들이 청첩장 링크를 통해 사진을 올리면 이곳에 실시간으로 등록됩니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between group"
            >
              {/* 이미지 썸네일 */}
              <div 
                className="relative aspect-square overflow-hidden bg-stone-100 cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.photo_url}
                  alt={photo.sender_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[11px] px-2 py-1 rounded-full">
                    크게 보기 🔍
                  </span>
                </div>
              </div>

              {/* 하단 메타 정보 */}
              <div className="p-3 space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-stone-900 truncate">
                      From. {photo.sender_name}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {photo.created_at?.slice(5, 10).replace('-', '.')}
                    </span>
                  </div>
                  {photo.message && (
                    <p className="text-[11px] text-stone-600 font-light line-clamp-2 leading-relaxed bg-stone-50 p-1.5 rounded-lg border border-stone-100">
                      &ldquo;{photo.message}&rdquo;
                    </p>
                  )}
                </div>

                {/* 개별 작업 버튼 */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(photo)}
                    className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-semibold text-stone-700 transition-colors cursor-pointer text-center"
                  >
                    다운로드 ⬇
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="py-1.5 px-2 bg-stone-50 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg text-[10px] transition-colors cursor-pointer"
                    title="사진 삭제"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 라이트박스 전체화면 모달 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-2xl w-full bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-stone-950/80 flex items-center justify-between text-white border-b border-stone-800">
              <span className="text-xs font-medium">
                From. {selectedPhoto.sender_name} ({selectedPhoto.created_at?.slice(0, 16).replace('T', ' ')})
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center bg-black">
              <img
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.sender_name}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            {selectedPhoto.message && (
              <div className="p-4 bg-stone-950 text-xs text-stone-300 font-light border-t border-stone-800">
                &ldquo;{selectedPhoto.message}&rdquo;
              </div>
            )}
            <div className="p-3 bg-stone-900 flex items-center justify-between gap-2 border-t border-stone-800">
              <span className="text-[10px] text-stone-400 font-light hidden sm:inline">
                💡 모바일에서는 사진을 길게 꾹 누르면 바로 사진첩에 저장하실 수 있습니다.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadSingle(selectedPhoto)}
                  className="py-1.5 px-3 bg-white text-black rounded-lg text-xs font-semibold hover:bg-stone-200"
                >
                  다운로드 ⬇
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  className="py-1.5 px-3 bg-stone-800 text-red-400 rounded-lg text-xs hover:bg-red-900/40"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
