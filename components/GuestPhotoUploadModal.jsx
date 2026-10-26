'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageCompressor';

export default function GuestPhotoUploadModal({ invitation, onClose, onSuccess }) {
  const [loadingCount, setLoadingCount] = useState(true);
  const [currentCount, setCurrentCount] = useState(0);
  const [isFull, setIsFull] = useState(false);

  // 폼 상태
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // 업로드 진행 상태
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadComplete, setUploadComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  const MAX_PER_BATCH = 10;
  const MAX_TOTAL = 100;

  // 1. 현재 저장된 하객 사진 개수 조회
  useEffect(() => {
    async function checkPhotoCount() {
      if (!invitation?.id) {
        setLoadingCount(false);
        return;
      }
      try {
        const { count, error } = await supabase
          .from('guest_photos')
          .select('id', { count: 'exact', head: true })
          .eq('invitation_id', invitation.id);

        if (!error && count !== null) {
          setCurrentCount(count);
          if (count >= MAX_TOTAL) {
            setIsFull(true);
          }
        }
      } catch (err) {
        console.warn('guest_photos count fetch error:', err);
      } finally {
        setLoadingCount(false);
      }
    }

    checkPhotoCount();
  }, [invitation?.id]);

  // 남은 슬롯 수 계산
  const remainingSlots = Math.max(0, Math.min(MAX_PER_BATCH, MAX_TOTAL - currentCount));

  // 사진 선택 핸들러
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > remainingSlots) {
      alert(`한 번에 최대 ${remainingSlots}장까지 선택하실 수 있습니다. (초과분은 제외됩니다)`);
    }

    const validFiles = files.slice(0, remainingSlots);
    setSelectedFiles(validFiles);

    // 미리보기 URL 생성
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return newPreviews;
    });
  };

  // 개별 사진 제거
  const handleRemoveFile = (index) => {
    const updatedFiles = selectedFiles.filter((_, idx) => idx !== index);
    setSelectedFiles(updatedFiles);

    URL.revokeObjectURL(previews[index]);
    setPreviews(previews.filter((_, idx) => idx !== index));
  };

  // 모달 닫힐 때 URL 해제
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  // 업로드 실행
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!senderName.trim()) {
      alert('보내시는 분의 성함(또는 애칭)을 입력해 주세요.');
      return;
    }
    if (selectedFiles.length === 0) {
      alert('선물하실 사진을 1장 이상 선택해 주세요.');
      return;
    }

    setUploading(true);
    setErrorMessage('');
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      const slug = invitation.slug || 'wedding';
      const uploadedRecords = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress({ current: i + 1, total: selectedFiles.length });

        // 1. 브라우저 초경량 WebP/JPG 압축
        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.82,
        });

        // 2. Supabase Storage 업로드
        const fileExt = compressed.name.split('.').pop() || 'jpg';
        const randomHash = Math.random().toString(36).substring(2, 7);
        const fileName = `guest-snaps/${slug}/${Date.now()}_${randomHash}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('wedding-images')
          .upload(fileName, compressed, {
            upsert: true,
            contentType: compressed.type || 'image/jpeg',
          });

        if (uploadError) {
          console.warn('Storage upload error:', uploadError);
          continue;
        }

        const { data: publicData } = supabase.storage
          .from('wedding-images')
          .getPublicUrl(fileName);

        const photoUrl = publicData?.publicUrl;
        if (!photoUrl) continue;

        uploadedRecords.push({
          invitation_id: invitation.id,
          sender_name: senderName.trim(),
          message: message.trim() || null,
          photo_url: photoUrl,
          file_size: compressed.size,
        });
      }

      // 3. DB에 일괄 저장
      if (uploadedRecords.length > 0) {
        const { error: dbError } = await supabase
          .from('guest_photos')
          .insert(uploadedRecords);

        if (dbError) {
          console.error('guest_photos DB insert error:', dbError);
          throw new Error('사진 정보를 저장하는 중 오류가 발생했습니다.');
        }

        setUploadComplete(true);
        if (onSuccess) onSuccess();
      } else {
        throw new Error('사진 업로드에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || '사진 전송 중 오류가 발생했습니다.');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#FAF9F6] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-200/80 flex items-center justify-between bg-white/70">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-amber-700 font-bold block mb-0.5">
              ATELIER SNAP DROPBOX
            </span>
            <h3 className="text-base font-bold text-stone-900 tracking-tight">
              신랑·신부에게 사진 선물하기
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loadingCount ? (
            <div className="py-12 text-center text-xs text-stone-500 font-light">
              보관함 연결 중...
            </div>
          ) : isFull ? (
            /* 100장 만석 마감 화면 */
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-2xl mx-auto border border-amber-200/70">
                🤍
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900 mb-1.5">
                  사진 보관함이 가득 채워졌습니다
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed font-light break-keep max-w-xs mx-auto">
                  하객분들의 넘치는 사랑과 축하로 소중한 사진 보관함(100장)이 모두 채워졌습니다. 두 사람을 향한 따뜻한 마음에 진심으로 감사드립니다!
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-all cursor-pointer"
              >
                확인
              </button>
            </div>
          ) : uploadComplete ? (
            /* 업로드 완료 성공 화면 */
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-2xl mx-auto border border-emerald-200/70">
                ✨
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900 mb-1.5">
                  사진이 소중히 전달되었습니다
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed font-light break-keep max-w-xs mx-auto">
                  보내주신 소중한 사진은 신랑·신부 둘만의 비밀 보관함으로 안전하게 전달되었습니다. 오늘의 기쁜 순간을 함께해 주셔서 감사합니다 🤍
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-all cursor-pointer"
              >
                닫기
              </button>
            </div>
          ) : (
            /* 기본 입력 폼 */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 비공개 안심 안내 배지 */}
              <div className="p-3 bg-stone-100/80 rounded-xl border border-stone-200/70 text-[11px] text-stone-600 leading-relaxed font-light flex items-start gap-2">
                <span className="text-amber-700 font-bold">🔒</span>
                <span>
                  보내주신 사진은 다른 하객에게 일체 공개되지 않으며, <strong>신랑·신부에게만 안전하게 전달</strong>됩니다.
                </span>
              </div>

              {/* 보내는 사람 성함 */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  보내시는 분 성함 <span className="text-amber-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="성함 또는 애칭 (예: 신부 친구 지은)"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  disabled={uploading}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all placeholder:text-stone-400"
                />
              </div>

              {/* 축하 한마디 (선택) */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  축하 메시지 <span className="text-stone-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="신랑·신부에게 전할 따뜻한 한마디"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={uploading}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all placeholder:text-stone-400"
                />
              </div>

              {/* 사진 첨부 영역 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    선물할 사진 선택 <span className="text-amber-700">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-stone-500">
                    {selectedFiles.length} / 최대 {remainingSlots}장
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />

                {previews.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-8 border-2 border-dashed border-stone-300 hover:border-stone-400 bg-white rounded-2xl flex flex-col items-center justify-center gap-1.5 text-stone-500 hover:text-stone-800 transition-all cursor-pointer group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">📷</span>
                    <span className="text-xs font-semibold text-stone-800">
                      스마트폰 앨범에서 사진 선택하기
                    </span>
                    <span className="text-[10px] text-stone-400">
                      1회 최대 {remainingSlots}장까지 한 번에 선택 가능
                    </span>
                  </button>
                ) : (
                  <div>
                    {/* 선택된 사진 썸네일 그리드 */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group">
                          <img src={src} alt="preview" className="w-full h-full object-cover" />
                          {!uploading && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center hover:bg-black transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {selectedFiles.length < remainingSlots && !uploading && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-[11px] font-medium text-stone-700 transition-colors text-center cursor-pointer"
                      >
                        + 사진 추가하기 (최대 {remainingSlots}장)
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 오류 메시지 */}
              {errorMessage && (
                <p className="text-[11px] text-red-600 font-medium text-center">
                  {errorMessage}
                </p>
              )}

              {/* 진행률 표시기 */}
              {uploading && (
                <div className="py-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                    <span>사진 압축 및 안전 전송 중...</span>
                    <span className="font-mono text-amber-700">
                      {uploadProgress.current} / {uploadProgress.total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-stone-900 transition-all duration-300"
                      style={{
                        width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 전송 버튼 */}
              <button
                type="submit"
                disabled={uploading || selectedFiles.length === 0}
                className={`w-full py-3.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm ${
                  uploading || selectedFiles.length === 0
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-stone-900 hover:bg-black text-white active:scale-98'
                }`}
              >
                {uploading
                  ? `사진 전송 중 (${uploadProgress.current}/${uploadProgress.total})...`
                  : `신랑·신부에게 사진 선물하기 (${selectedFiles.length}장)`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
