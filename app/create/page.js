'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import BasicTemplate from '@/components/templates/basic/BasicTemplate';

// 추천 감성 초대글 샘플 3종
const GREETING_PRESETS = [
  {
    title: '새로운 시작의 날',
    content: `서로를 만나 평범했던 하루가\n조금 더 따뜻하고 특별해졌습니다.\n\n이제 두 사람이 한마음으로\n새로운 계절을 시작하려 합니다.\n\n소중한 분들과 함께\n그 순간을 나누고 싶습니다.\n저희의 첫 걸음에 따뜻한 축복을 보내주세요.`,
  },
  {
    title: '사랑으로 맺어지는 날',
    content: `곁에 있을 때 가장 나다워지는 사람을 만났습니다.\n눈빛만 보아도 서로의 마음을 알고,\n함께하는 것만으로도 온 세상이 따뜻해집니다.\n\n평생을 함께 걸어가기로 약속하는 날,\n귀한 걸음으로 축복해 주시면 감사하겠습니다.`,
  },
  {
    title: '함께 걷는 첫걸음',
    content: `저희 두 사람, 서로를 깊이 아끼고 사랑하며\n이제 하나의 가정을 이루려 합니다.\n\n기쁨은 나누고 슬픔은 서로 감싸주며\n지혜롭고 따뜻하게 살아가겠습니다.\n\n바쁘시더라도 부디 참석해 주시어\n저희의 앞날을 축복해 주시기 바랍니다.`,
  },
];

export default function CreateInvitationPage() {
  // 폼 상태
  const [formData, setFormData] = useState({
    slug: '',
    groom_name: '',
    groom_phone: '',
    groom_father: '',
    groom_mother: '',
    groom_father_deceased: false,
    groom_mother_deceased: false,
    bride_name: '',
    bride_phone: '',
    bride_father: '',
    bride_mother: '',
    bride_father_deceased: false,
    bride_mother_deceased: false,
    wedding_date: '2027-04-18',
    wedding_time: '12:00',
    venue_name: '',
    venue_hall: '',
    venue_address: '',
    venue_detail: '',
    message_title: '새로운 시작의 날',
    message: GREETING_PRESETS[0].content,
    groom_bank: '국민',
    groom_account: '',
    groom_holder: '',
    bride_bank: '카카오뱅크',
    bride_account: '',
    bride_holder: '',
  });

  // 이미지 파일 상태 (File 객체 및 로컬 미리보기 URL)
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('/cover.jpg');

  const [groomPhotoFile, setGroomPhotoFile] = useState(null);
  const [groomPhotoPreview, setGroomPhotoPreview] = useState('/groom.jpg');

  const [bridePhotoFile, setBridePhotoFile] = useState(null);
  const [bridePhotoPreview, setBridePhotoPreview] = useState('/bride.jpg');

  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // 상태 제어
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  // 입력값 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 슬러그(영문 URL) 자동 생성 제안
  const handleAutoSlug = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const g = formData.groom_name ? encodeURIComponent(formData.groom_name).slice(0, 4) : 'wedding';
    setFormData((prev) => ({ ...prev, slug: `wedding-${randomNum}` }));
  };

  // 메인 사진 선택
  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  // 신랑 프로필 사진 선택
  const handleGroomPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroomPhotoFile(file);
      setGroomPhotoPreview(URL.createObjectURL(file));
    }
  };

  // 신부 프로필 사진 선택
  const handleBridePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBridePhotoFile(file);
      setBridePhotoPreview(URL.createObjectURL(file));
    }
  };

  // 갤러리 사진들 선택 (다중)
  const handleGalleryImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryFiles((prev) => [...prev, ...files].slice(0, 20));
      const newPreviews = files.map((f) => URL.createObjectURL(f));
      setGalleryPreviews((prev) => [...prev, ...newPreviews].slice(0, 20));
    }
  };

  // 갤러리 특정 사진 삭제
  const removeGalleryImage = (index) => {
    setGalleryFiles((prev) => prev.filter((_, idx) => idx !== index));
    setGalleryPreviews((prev) => prev.filter((_, idx) => idx !== index));
  };

  // 이미지 업로드 헬퍼 (Supabase Storage)
  const uploadFileToStorage = async (file, path) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('wedding-images')
        .upload(fileName, file, { upsert: true });

      if (error) {
        console.warn('Storage upload warning:', error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('wedding-images')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.warn('Upload failed:', err);
      return null;
    }
  };

  // 미리보기용 객체 생성
  const previewInvitation = {
    groom_name: formData.groom_name || '신랑',
    bride_name: formData.bride_name || '신부',
    groom_phone: formData.groom_phone,
    bride_phone: formData.bride_phone,
    groom_father: formData.groom_father,
    groom_mother: formData.groom_mother,
    bride_father: formData.bride_father,
    bride_mother: formData.bride_mother,
    extra_data: {
      groom_father_deceased: formData.groom_father_deceased,
      groom_mother_deceased: formData.groom_mother_deceased,
      bride_father_deceased: formData.bride_father_deceased,
      bride_mother_deceased: formData.bride_mother_deceased,
    },
    wedding_date: `${formData.wedding_date}T${formData.wedding_time}:00`,
    venue_name: formData.venue_name || '웨딩홀 이름',
    venue_hall: formData.venue_hall || '',
    venue_address: formData.venue_address || '예식장 주소',
    venue_detail: formData.venue_detail,
    greeting_title: formData.message_title,
    greeting_content: formData.message,
    images: {
      main: mainImagePreview,
      cover: mainImagePreview,
      groom_profile: groomPhotoPreview,
      bride_profile: bridePhotoPreview,
      ending: mainImagePreview,
    },
    gallery_images: galleryPreviews.length > 0 ? galleryPreviews : [],
    accounts: [
      formData.groom_account && {
        group: '신랑측',
        title: '신랑',
        bank: formData.groom_bank,
        account_number: formData.groom_account,
        holder: formData.groom_holder || formData.groom_name,
      },
      formData.bride_account && {
        group: '신부측',
        title: '신부',
        bank: formData.bride_bank,
        account_number: formData.bride_account,
        holder: formData.bride_holder || formData.bride_name,
      },
    ].filter(Boolean),
    template_config: {
      title_color: '#E5A866',
      show_intro: true,
      show_countdown: true,
      show_accounts: true,
      show_rsvp: true,
      show_guestbook: true,
    },
  };

  // 청첩장 생성 및 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.groom_name.trim() || !formData.bride_name.trim()) {
      return alert('신랑과 신부 성함을 입력해 주세요.');
    }
    if (!formData.venue_name.trim()) {
      return alert('예식장 이름을 입력해 주세요.');
    }
    if (!formData.venue_address.trim()) {
      return alert('예식장 주소를 입력해 주세요.');
    }

    const cleanSlug = formData.slug.trim() || `wedding-${Math.floor(1000 + Math.random() * 9000)}`;

    setSubmitting(true);
    setUploadStatus('웨딩 사진을 업로드하고 있습니다...');

    try {
      // 1. 이미지 업로드 시도
      let uploadedMainUrl = mainImagePreview;
      if (mainImageFile) {
        const u = await uploadFileToStorage(mainImageFile, `${cleanSlug}/main`);
        if (u) uploadedMainUrl = u;
      }

      let uploadedGroomPhoto = groomPhotoPreview;
      if (groomPhotoFile) {
        const u = await uploadFileToStorage(groomPhotoFile, `${cleanSlug}/groom`);
        if (u) uploadedGroomPhoto = u;
      }

      let uploadedBridePhoto = bridePhotoPreview;
      if (bridePhotoFile) {
        const u = await uploadFileToStorage(bridePhotoFile, `${cleanSlug}/bride`);
        if (u) uploadedBridePhoto = u;
      }

      setUploadStatus('갤러리 사진을 업로드하고 있습니다...');
      const uploadedGalleryUrls = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const u = await uploadFileToStorage(galleryFiles[i], `${cleanSlug}/gallery_${i + 1}`);
        if (u) uploadedGalleryUrls.push(u);
      }

      const finalGalleryImages = uploadedGalleryUrls.length > 0 ? uploadedGalleryUrls : galleryPreviews;

      setUploadStatus('청첩장을 생성하고 있습니다...');

      // 2. 계좌 구성
      const accountsList = [];
      if (formData.groom_account) {
        accountsList.push({
          group: '신랑측',
          title: '신랑',
          bank: formData.groom_bank,
          account_number: formData.groom_account,
          holder: formData.groom_holder || formData.groom_name,
        });
      }
      if (formData.bride_account) {
        accountsList.push({
          group: '신부측',
          title: '신부',
          bank: formData.bride_bank,
          account_number: formData.bride_account,
          holder: formData.bride_holder || formData.bride_name,
        });
      }

      // 3. Supabase DB INSERT
      const newInvitation = {
        slug: cleanSlug,
        groom_name: formData.groom_name.trim(),
        groom_phone: formData.groom_phone.trim(),
        groom_father: formData.groom_father.trim(),
        groom_mother: formData.groom_mother.trim(),
        bride_name: formData.bride_name.trim(),
        bride_phone: formData.bride_phone.trim(),
        bride_father: formData.bride_father.trim(),
        bride_mother: formData.bride_mother.trim(),
        wedding_date: `${formData.wedding_date}T${formData.wedding_time}:00`,
        venue_name: formData.venue_name.trim(),
        venue_address: formData.venue_address.trim(),
        venue_detail: formData.venue_detail.trim(),
        message: formData.message.trim(),
        template_type: 'basic',
        images: {
          main: uploadedMainUrl,
          cover: uploadedMainUrl,
          groom_profile: uploadedGroomPhoto,
          bride_profile: uploadedBridePhoto,
          ending: uploadedMainUrl,
        },
        gallery_images: finalGalleryImages,
        accounts: accountsList,
        template_config: {
          title_color: '#E5A866',
          show_intro: true,
          show_countdown: true,
          show_accounts: true,
          show_rsvp: true,
          show_guestbook: true,
        },
        extra_data: {
          groom_father_deceased: formData.groom_father_deceased,
          groom_mother_deceased: formData.groom_mother_deceased,
          bride_father_deceased: formData.bride_father_deceased,
          bride_mother_deceased: formData.bride_mother_deceased,
          greeting_title: formData.message_title,
          venue_hall: formData.venue_hall,
        },
      };

      const { data, error } = await supabase
        .from('invitations')
        .insert([newInvitation])
        .select()
        .single();

      if (error) {
        console.error('청첩장 생성 오류:', error);
        alert(`생성 중 오류가 발생했습니다: ${error.message}`);
        setSubmitting(false);
        return;
      }

      // 생성 완료
      setCreatedResult({
        slug: data.slug,
        manage_token: data.manage_token,
      });
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
      setUploadStatus('');
    }
  };

  // 생성 완료 화면
  if (createdResult) {
    const cardUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${createdResult.slug}`;
    const manageUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/manage/${createdResult.slug}?token=${createdResult.manage_token}`;

    return (
      <div className="min-h-screen bg-[#FBF9F5] py-12 px-4 flex justify-center items-center">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 text-center border border-stone-100">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            🎉
          </div>
          <h1 className="text-2xl font-serif text-stone-900 mb-2">
            청첩장이 완성되었습니다!
          </h1>
          <p className="text-xs text-stone-500 mb-8 leading-relaxed">
            두 분만의 아름다운 모바일 청첩장이 성공적으로 생성되었습니다.<br />
            아래 링크를 복사하여 하객분들께 전달해 보세요.
          </p>

          {/* 하객용 청첩장 링크 */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left mb-4">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              하객 공유용 청첩장 링크
            </span>
            <p className="text-sm font-mono text-stone-800 font-semibold break-all mt-2 mb-3">
              {cardUrl}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(cardUrl);
                  alert('청첩장 링크가 복사되었습니다!');
                }}
                className="flex-1 py-2.5 bg-stone-800 hover:bg-black text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                청첩장 링크 복사
              </button>
              <a
                href={`/${createdResult.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded-xl transition-colors flex items-center justify-center"
              >
                바로보기 ↗
              </a>
            </div>
          </div>

          {/* 신랑신부 전용 관리자 링크 */}
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-left mb-8">
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
              신랑·신부 전용 관리 페이지 (하객 참석 & 방명록 관리)
            </span>
            <p className="text-xs font-mono text-stone-700 break-all mt-2 mb-3">
              {manageUrl}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(manageUrl);
                alert('관리자 링크가 복사되었습니다! 이 링크는 신랑·신부님만 보관해 주세요.');
              }}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              관리자 전용 링크 복사
            </button>
            <p className="text-[10px] text-amber-700 mt-2">
              ⚠️ 관리자 링크에는 보안 토큰이 포함되어 있으므로 하객에게 노출되지 않도록 신랑·신부님만 보관해 주세요.
            </p>
          </div>

          <button
            onClick={() => {
              setCreatedResult(null);
              window.location.reload();
            }}
            className="text-xs text-stone-400 hover:text-stone-600 underline cursor-pointer"
          >
            새 청첩장 만들기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] py-10 px-4 flex justify-center">
      <div className="w-full max-w-xl">
        
        {/* 상단 헤더 */}
        <div className="text-center mb-8">
          <span className="text-[11px] font-medium tracking-widest text-[#B58B57] bg-[#B58B57]/10 px-3 py-1 rounded-full uppercase">
            Wedding Card Maker
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 mt-3 mb-2">
            모바일 청첩장 직접 만들기
          </h1>
          <p className="text-xs text-stone-500 font-light">
            소중한 분들께 전할 청첩장을 15분 만에 무료로 제작해 보세요.
          </p>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. 신랑 & 신부 정보 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-100">
            <h2 className="text-base font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
              <span>🤵👰</span>
              <span>신랑 & 신부 정보</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* 신랑 */}
              <div className="p-3.5 bg-blue-50/40 rounded-2xl border border-blue-100/60 space-y-2.5">
                <span className="text-xs font-bold text-blue-800">신랑 정보</span>
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">성함 *</label>
                  <input
                    type="text"
                    required
                    name="groom_name"
                    value={formData.groom_name}
                    onChange={handleChange}
                    placeholder="예: 김민준"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">연락처</label>
                  <input
                    type="tel"
                    name="groom_phone"
                    value={formData.groom_phone}
                    onChange={handleChange}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-1">아버지 성함</label>
                    <input
                      type="text"
                      name="groom_father"
                      value={formData.groom_father}
                      onChange={handleChange}
                      placeholder="김OO"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                    <label className="flex items-center gap-1 mt-1 text-[10px] text-stone-400">
                      <input
                        type="checkbox"
                        name="groom_father_deceased"
                        checked={formData.groom_father_deceased}
                        onChange={handleChange}
                      />
                      故 표기
                    </label>
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-1">어머니 성함</label>
                    <input
                      type="text"
                      name="groom_mother"
                      value={formData.groom_mother}
                      onChange={handleChange}
                      placeholder="이OO"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                    <label className="flex items-center gap-1 mt-1 text-[10px] text-stone-400">
                      <input
                        type="checkbox"
                        name="groom_mother_deceased"
                        checked={formData.groom_mother_deceased}
                        onChange={handleChange}
                      />
                      故 표기
                    </label>
                  </div>
                </div>
              </div>

              {/* 신부 */}
              <div className="p-3.5 bg-pink-50/40 rounded-2xl border border-pink-100/60 space-y-2.5">
                <span className="text-xs font-bold text-pink-800">신부 정보</span>
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">성함 *</label>
                  <input
                    type="text"
                    required
                    name="bride_name"
                    value={formData.bride_name}
                    onChange={handleChange}
                    placeholder="예: 이서연"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">연락처</label>
                  <input
                    type="tel"
                    name="bride_phone"
                    value={formData.bride_phone}
                    onChange={handleChange}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-1">아버지 성함</label>
                    <input
                      type="text"
                      name="bride_father"
                      value={formData.bride_father}
                      onChange={handleChange}
                      placeholder="이OO"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                    <label className="flex items-center gap-1 mt-1 text-[10px] text-stone-400">
                      <input
                        type="checkbox"
                        name="bride_father_deceased"
                        checked={formData.bride_father_deceased}
                        onChange={handleChange}
                      />
                      故 표기
                    </label>
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-1">어머니 성함</label>
                    <input
                      type="text"
                      name="bride_mother"
                      value={formData.bride_mother}
                      onChange={handleChange}
                      placeholder="박OO"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                    <label className="flex items-center gap-1 mt-1 text-[10px] text-stone-400">
                      <input
                        type="checkbox"
                        name="bride_mother_deceased"
                        checked={formData.bride_mother_deceased}
                        onChange={handleChange}
                      />
                      故 표기
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 영문 URL 설정 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  나만의 청첩장 영문 주소 (URL) *
                </label>
                <button
                  type="button"
                  onClick={handleAutoSlug}
                  className="text-[11px] text-[#B58B57] hover:underline"
                >
                  자동 생성
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400 font-mono">wedding.com/</span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="예: minjun-seoyeon"
                  className="flex-1 px-3 py-2 border border-stone-200 rounded-xl text-xs font-mono focus:outline-none focus:border-stone-800"
                />
              </div>
            </div>
          </div>

          {/* 2. 예식 일시 및 웨딩홀 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-100">
            <h2 className="text-base font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
              <span>💒</span>
              <span>예식 일시 및 웨딩홀</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">예식 날짜 *</label>
                <input
                  type="date"
                  required
                  name="wedding_date"
                  value={formData.wedding_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">예식 시간 *</label>
                <input
                  type="time"
                  required
                  name="wedding_time"
                  value={formData.wedding_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">예식장 이름 *</label>
                <input
                  type="text"
                  required
                  name="venue_name"
                  value={formData.venue_name}
                  onChange={handleChange}
                  placeholder="예: 아펠가모 선릉"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">층 및 홀 이름</label>
                <input
                  type="text"
                  name="venue_hall"
                  value={formData.venue_hall}
                  onChange={handleChange}
                  placeholder="예: 4층 단독홀"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">예식장 주소 *</label>
                <input
                  type="text"
                  required
                  name="venue_address"
                  value={formData.venue_address}
                  onChange={handleChange}
                  placeholder="예: 서울 강남구 테헤란로 322"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">교통 및 주차 안내 문구</label>
                <textarea
                  rows={2}
                  name="venue_detail"
                  value={formData.venue_detail}
                  onChange={handleChange}
                  placeholder="예: 지하철 2호선 선릉역 4번 출구 도보 3분 / 건물 내 2시간 무료 주차 지원"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
                />
              </div>
            </div>
          </div>

          {/* 3. 웨딩 사진 등록 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-100">
            <h2 className="text-base font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
              <span>📸</span>
              <span>웨딩 사진 등록</span>
            </h2>

            <div className="space-y-5">
              {/* 메인 커버 사진 */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  메인 풀스크린 커버 사진 (대표 사진)
                </label>
                <p className="text-[11px] text-stone-400 mb-2">
                  청첩장을 열었을 때 가장 먼저 보이는 세로형 전신 사진을 권장합니다.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-28 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 shrink-0">
                    <img src={mainImagePreview} alt="Main" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageChange}
                      className="text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-stone-800 file:text-white hover:file:bg-black cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 신랑 & 신부 프로필 사진 */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">신랑 프로필</label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-stone-200 shrink-0">
                      <img src={groomPhotoPreview} alt="Groom" className="w-full h-full object-cover" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGroomPhotoChange}
                      className="text-[11px] text-stone-400 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[11px] file:bg-stone-100 file:text-stone-700 cursor-pointer w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">신부 프로필</label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-stone-200 shrink-0">
                      <img src={bridePhotoPreview} alt="Bride" className="w-full h-full object-cover" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBridePhotoChange}
                      className="text-[11px] text-stone-400 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[11px] file:bg-stone-100 file:text-stone-700 cursor-pointer w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 갤러리 사진들 */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    갤러리 앨범 사진 (최대 20장)
                  </label>
                  <span className="text-[11px] text-stone-400">
                    {galleryPreviews.length} / 20장
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryImagesChange}
                  className="text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer mb-3"
                />
                {galleryPreviews.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {galleryPreviews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group">
                        <img src={src} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black text-white rounded-full text-xs flex items-center justify-center transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. 모시는 글 (인사말) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-100">
            <h2 className="text-base font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
              <span>💌</span>
              <span>모시는 글 (초대 문구)</span>
            </h2>

            {/* 추천 샘플 문구 칩 */}
            <div className="mb-3">
              <span className="text-[11px] text-stone-400 block mb-1.5">추천 문구 불러오기:</span>
              <div className="flex flex-wrap gap-1.5">
                {GREETING_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        message_title: preset.title,
                        message: preset.content,
                      }));
                    }}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">인사말 제목</label>
                <input
                  type="text"
                  name="message_title"
                  value={formData.message_title}
                  onChange={handleChange}
                  placeholder="새로운 시작의 날"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-stone-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">초대 본문 문구</label>
                <textarea
                  rows={6}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-stone-800 font-sans"
                />
              </div>
            </div>
          </div>

          {/* 5. 축의금 계좌번호 */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-stone-100">
            <h2 className="text-base font-bold text-stone-800 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
              <span>🎁</span>
              <span>마음 전하실 곳 (축의금 계좌)</span>
            </h2>

            <div className="space-y-4">
              {/* 신랑 계좌 */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-2">
                <span className="text-xs font-bold text-stone-700">신랑측 계좌</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    name="groom_bank"
                    value={formData.groom_bank}
                    onChange={handleChange}
                    placeholder="은행명"
                    className="px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    name="groom_account"
                    value={formData.groom_account}
                    onChange={handleChange}
                    placeholder="계좌번호"
                    className="col-span-2 px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-xs"
                  />
                </div>
                <input
                  type="text"
                  name="groom_holder"
                  value={formData.groom_holder}
                  onChange={handleChange}
                  placeholder="예금주 (미입력 시 신랑 이름)"
                  className="w-full px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-xs"
                />
              </div>

              {/* 신부 계좌 */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-2">
                <span className="text-xs font-bold text-stone-700">신부측 계좌</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    name="bride_bank"
                    value={formData.bride_bank}
                    onChange={handleChange}
                    placeholder="은행명"
                    className="px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    name="bride_account"
                    value={formData.bride_account}
                    onChange={handleChange}
                    placeholder="계좌번호"
                    className="col-span-2 px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-xs"
                  />
                </div>
                <input
                  type="text"
                  name="bride_holder"
                  value={formData.bride_holder}
                  onChange={handleChange}
                  placeholder="예금주 (미입력 시 신부 이름)"
                  className="w-full px-2.5 py-2 bg-white border border-stone-200 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* 하단 버튼 바 */}
          <div className="sticky bottom-4 z-30 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-stone-200 flex gap-3">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="flex-1 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>👁️</span>
              <span>실시간 미리보기</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-2 py-3.5 bg-[#B58B57] hover:bg-[#9E7745] disabled:bg-stone-400 text-white rounded-2xl text-xs font-bold transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{submitting ? '생성 중...' : '청첩장 무료 생성하기 🎉'}</span>
            </button>
          </div>

          {uploadStatus && (
            <p className="text-center text-xs text-[#B58B57] animate-pulse font-medium">
              {uploadStatus}
            </p>
          )}

        </form>

      </div>

      {/* 실시간 미리보기 모달 */}
      {showPreviewModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div 
            className="bg-white w-full max-w-[430px] h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 미리보기 상단 헤더 */}
            <div className="py-3 px-5 bg-stone-900 text-white flex items-center justify-between shrink-0">
              <span className="text-xs font-medium">실시간 모바일 미리보기</span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-stone-400 hover:text-white text-base leading-none"
              >
                ✕
              </button>
            </div>

            {/* 실제 청첩장 템플릿 렌더링 */}
            <div className="flex-1 overflow-y-auto">
              <BasicTemplate invitation={previewInvitation} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
