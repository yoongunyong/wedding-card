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
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* 모달 컨테이너 (Figma 1:1 시각적 매칭: 너비 340px, 좌우 패딩 px-[20px], 배경 #FCFCFC) */}
      <div 
        className="bg-[#FCFCFC] w-full max-w-[340px] rounded-[14.5px] shadow-2xl relative pt-[36px] pb-[30px] px-[20px] sm:px-[24px] animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 (X표시, Figma color: #3C3A3A, top-5 right-5) */}
        <button
          type="button"
          onClick={onClose}
          disabled={uploading}
          className="absolute top-5 right-5 text-[#3C3A3A] hover:text-black transition-colors cursor-pointer w-8 h-8 flex items-center justify-center z-10"
          aria-label="닫기"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1.5 1.5L14.5 14.5M14.5 1.5L1.5 14.5" stroke="#3C3A3A" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {/* 모달 헤더 */}
        <div className="text-center">
          {/* 타이틀 (Figma: NanumSquare Neo 34px -> 1x 17px, #292929) */}
          <h3 className="font-nanumsquare font-normal text-[17px] text-[#292929] leading-none text-center tracking-tight">
            신랑·신부에게 사진 선물하기
          </h3>

          {/* 서브 안내 문구 (Figma: NanumSquare Neo 24px -> 1x 12px, leading-150%, #666666) */}
          <p className="font-nanumsquare font-normal text-[12px] text-[#666666] leading-[1.5] text-center mt-[14px] tracking-tight whitespace-pre-line">
            보내주신 사진은 다른 하객에게 공개되지 않고,{'\n'}
            신랑 신부에게만 안전하게 전달됩니다.
          </p>

          {/* 헤더 하단 구분선 (Figma: width 546px -> 1x 273px, border: 1px solid #D3D3D3) */}
          <div 
            style={{ borderTop: '1px solid #D3D3D3' }} 
            className="w-full max-w-[273px] mx-auto mt-[18px] mb-[24px]" 
          />
        </div>

        {/* 모달 본문 */}
        <div className="overflow-y-auto">
          {loadingCount ? (
            <div className="py-12 text-center text-xs text-[#999999] font-nanumsquare">
              보관함 연결 중...
            </div>
          ) : isFull ? (
            /* 100장 만석 마감 화면 */
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center text-2xl mx-auto border border-[#DAD1D1]">
                🤍
              </div>
              <div>
                <h4 className="font-nanumsquare font-bold text-[15px] text-[#292929] mb-1.5">
                  사진 보관함이 가득 채워졌습니다
                </h4>
                <p className="font-nanumsquare text-[12px] text-[#666666] leading-relaxed break-keep max-w-xs mx-auto">
                  하객분들의 넘치는 사랑과 축하로 소중한 사진 보관함(100장)이 모두 채워졌습니다. 두 사람을 향한 따뜻한 마음에 진심으로 감사드립니다!
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-[46px] bg-[#393939] text-white rounded-[11.5px] font-nanumsquare font-bold text-[14px] hover:bg-black transition-all cursor-pointer"
              >
                확인
              </button>
            </div>
          ) : uploadComplete ? (
            /* 업로드 완료 성공 화면 */
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-2xl mx-auto border border-emerald-200">
                ✨
              </div>
              <div>
                <h4 className="font-nanumsquare font-bold text-[15px] text-[#292929] mb-1.5">
                  사진이 소중히 전달되었습니다
                </h4>
                <p className="font-nanumsquare text-[12px] text-[#666666] leading-relaxed break-keep max-w-xs mx-auto">
                  보내주신 소중한 사진은 신랑·신부 둘만의 비밀 보관함으로 안전하게 전달되었습니다. 오늘의 기쁜 순간을 함께해 주셔서 감사합니다 🤍
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-[46px] bg-[#393939] text-white rounded-[11.5px] font-nanumsquare font-bold text-[14px] hover:bg-black transition-all cursor-pointer"
              >
                닫기
              </button>
            </div>
          ) : (
            /* 기본 입력 폼 (Figma 스크린샷 1:1 매칭) */
            <form onSubmit={handleSubmit} className="space-y-[18px] text-left">
              {/* 1. 보내시는 분 성함 * (Figma: 30px -> 1x 15px, #333333, 인풋 h-[52px], rounded-[11.5px]) */}
              <div>
                <label className="font-nanumsquare font-normal text-[15px] text-[#333333] leading-none mb-[8px] block">
                  보내시는 분 성함 <span className="text-[#FF5A5A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="성함 또는 애칭 ( 예: 신부 친구 민지)"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  disabled={uploading}
                  style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
                  className="w-full h-[52px] px-4 bg-white border border-[#DAD1D1] rounded-[11.5px] text-[#333333] placeholder:text-[#C5C5C5] font-nanumsquare text-[12px] focus:outline-none focus:border-[#393939] transition-colors"
                />
              </div>

              {/* 2. 축하 메시지 (선택) (Figma: h-[52px], rounded-[11.5px]) */}
              <div>
                <label className="font-nanumsquare font-normal text-[15px] text-[#333333] leading-none mb-[8px] flex items-center">
                  <span>축하 메시지</span>
                  <span className="text-[#999999] text-[13px] font-normal ml-1">(선택)</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="신랑·신부에게 전할 따뜻한 한마디"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={uploading}
                  style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
                  className="w-full h-[52px] px-4 bg-white border border-[#DAD1D1] rounded-[11.5px] text-[#333333] placeholder:text-[#C5C5C5] font-nanumsquare text-[12px] focus:outline-none focus:border-[#393939] transition-colors"
                />
              </div>

              {/* 3. 전달할 사진 선택 * (Figma: h-[159px], dashed #DAD1D1, rounded-[11.5px], 카메라 #B8B8B8) */}
              <div>
                <div className="flex items-center justify-between mb-[8px]">
                  <label className="font-nanumsquare font-normal text-[15px] text-[#333333] leading-none">
                      전달할 사진 선택 <span className="text-[#FF5A5A]">*</span>
                    </label>
                    <span className="font-nanumsquare text-[12px] text-[#999999]">
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
                      style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
                      className="w-full h-[159px] bg-white border-[1.5px] border-dashed border-[#DAD1D1] rounded-[11.5px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#393939] transition-colors group px-4 select-none"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-nanumsquare font-normal text-[13px] text-[#333333]">
                          스마트폰 앨범에서 사진 선택하기
                        </span>
                        {/* 카메라 아이콘 (Figma: #B8B8B8) */}
                        <svg width="16" height="14" viewBox="0 0 16 14" fill="none" className="shrink-0">
                          <path d="M5.5 1.5L4.5 3H2C1.17157 3 0.5 3.67157 0.5 4.5V11.5C0.5 12.3284 1.17157 13 2 13H14C14.8284 13 15.5 12.3284 15.5 11.5V4.5C15.5 3.67157 14.8284 3 14 3H11.5L10.5 1.5H5.5Z" fill="#B8B8B8"/>
                          <circle cx="8" cy="8" r="2.8" fill="white"/>
                          <circle cx="8" cy="8" r="1.8" fill="#B8B8B8"/>
                        </svg>
                      </div>
                      <span className="font-nanumsquare font-normal text-[11px] text-[#999999] mt-2">
                        1회 최대 {remainingSlots}장까지 한 번에 선택 가능
                      </span>
                    </button>
                  ) : (
                    <div 
                      style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.08)' }}
                      className="w-full min-h-[159px] bg-white border-[1.5px] border-dashed border-[#DAD1D1] rounded-[11.5px] p-3 flex flex-col justify-between"
                    >
                      {/* 선택된 사진 썸네일 그리드 */}
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {previews.map((src, idx) => (
                          <div key={idx} className="relative aspect-square rounded-[8px] overflow-hidden border border-[#DAD1D1] group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="preview" className="w-full h-full object-cover" />
                            {!uploading && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(idx)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                                aria-label="사진 삭제"
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
                          className="w-full py-2 bg-[#F6F6F6] hover:bg-[#EBEBEB] border border-[#DAD1D1] rounded-[8px] text-[11px] font-nanumsquare text-[#333333] transition-colors text-center cursor-pointer select-none"
                        >
                          + 사진 추가하기 (최대 {remainingSlots}장)
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 오류 메시지 */}
                {errorMessage && (
                  <p className="font-nanumsquare text-[11px] text-red-600 font-medium text-center">
                    {errorMessage}
                  </p>
                )}

                {/* 진행률 표시기 */}
                {uploading && (
                  <div className="py-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[#666666] font-nanumsquare">
                      <span>사진 압축 및 안전 전송 중...</span>
                      <span className="font-mono text-[#393939] font-bold">
                        {uploadProgress.current} / {uploadProgress.total}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#393939] transition-all duration-300"
                        style={{
                          width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 4. 제출 버튼 (Figma: top: 15978px -> 사진 박스 하단 간격 82px / 2 = 41px, h-[53.5px], bg #393939, rounded-[13px], NanumSquare Neo 700 30px -> 1x 15px #FFFFFF) */}
                <div className="pt-[41px]">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full h-[53.5px] bg-[#393939] hover:bg-[#2c2c2c] active:scale-[0.99] disabled:opacity-70 text-white font-nanumsquare font-bold text-[15px] rounded-[13px] transition-all cursor-pointer shadow-sm flex items-center justify-center select-none"
                  >
                    {uploading
                      ? `사진 전송 중 (${uploadProgress.current}/${uploadProgress.total})...`
                      : `신랑·신부에게 사진 선물하기 (${selectedFiles.length}장)`}
                  </button>
                </div>
              </form>
            )}
        </div>
      </div>
    </div>
  );
}
