'use client';

import { useState, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import BasicTemplate from '@/components/templates/basic/BasicTemplate';
import EditorialTemplate from '@/components/templates/editorial/EditorialTemplate';
import BgmPlayer from '@/components/BgmPlayer';

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

// 영화 대사 / 감성 글귀 샘플 3종
const QUOTE_PRESETS = [
  {
    source: '영화 <연애의 온도>',
    content: `우리의 연애는 지루하고 힘들었다.\n하지만 그 순간 우리의 마음만은 진심이었다.\n그래서 내겐 인생에서\n가장 영화 같은 순간이 되었다.`,
  },
  {
    source: '두 사람의 이야기',
    content: `우리가 함께한 시간은\n내 인생에서 가장 찬란한 봄이었습니다.\n이제 서로의 손을 꼭 잡고\n평생의 모든 계절을 함께 걸어가려 합니다.`,
  },
  {
    source: '김춘수 <꽃>',
    content: `내가 그의 이름을 불러주었을 때,\n그는 나에게로 와서\n꽃이 되었다.`,
  },
];

// 은행 목록
const BANK_OPTIONS = [
  '국민', '신한', '우리', '하나', '농협', '카카오뱅크', '토스뱅크',
  '기업', '새마을', '우체국', '신협', 'SC제일', '수협', '케이뱅크', '직접입력'
];

// BGM 무료 추천 프리셋
const BGM_OPTIONS = [
  {
    label: '감성 피아노 (기본 추천 멜로디)',
    url: 'https://sfnsxkkxvplrlxbvenme.supabase.co/storage/v1/object/public/bgm/presets/piano-01.mp3',
  },
  {
    label: '배경음악 없음 (무음)',
    url: '',
  },
];

export default function CreateInvitationPage() {
  // 1. 기본 폼 상태
  const [formData, setFormData] = useState({
    template_type: 'editorial', // 'basic' | 'editorial'
    slug: '',
    groom_name: '',
    groom_name_en: '',
    groom_first_name_en: '',
    groom_last_name_en: '',
    groom_phone: '',
    groom_relation: '장남',
    groom_father: '',
    groom_father_phone: '',
    groom_father_deceased: false,
    groom_mother: '',
    groom_mother_phone: '',
    groom_mother_deceased: false,

    bride_name: '',
    bride_name_en: '',
    bride_first_name_en: '',
    bride_last_name_en: '',
    bride_phone: '',
    bride_relation: '장녀',
    bride_father: '',
    bride_father_phone: '',
    bride_father_deceased: false,
    bride_mother: '',
    bride_mother_phone: '',
    bride_mother_deceased: false,

    wedding_date: '2026-11-14',
    wedding_time: '14:00',
    venue_name: '',
    venue_hall: '',
    venue_address: '',
    venue_detail: '',

    message_title: '새로운 시작의 날',
    message: GREETING_PRESETS[0].content,

    show_quote_section: true,
    quote_content: QUOTE_PRESETS[0].content,
    quote_source: QUOTE_PRESETS[0].source,

    bgm_url: BGM_OPTIONS[0].url,
    title_color: '#E5A866',

    show_intro: true,
    show_countdown: true,
    show_gallery: true,
    show_accounts: true,
    show_rsvp: true,
    show_guestbook: true,
    show_profile_photos: true,
    order_code: '',
  });

  // 2. 다중 계좌 상태
  const [groomAccounts, setGroomAccounts] = useState([
    { group: '신랑측', title: '신랑', bank: '국민', number: '', holder: '' },
  ]);
  const [brideAccounts, setBrideAccounts] = useState([
    { group: '신부측', title: '신부', bank: '카카오뱅크', number: '', holder: '' },
  ]);

  // 3. 교통편 상세 안내 목록 (오시는 길)
  const [transportationList, setTransportationList] = useState([
    {
      type: 'subway',
      title: '지하철',
      content: '',
    },
    {
      type: 'bus',
      title: '버스',
      content: '',
    },
    {
      type: 'car',
      title: '자차 / 내비게이션',
      content: '내비게이션 검색창에 예식장 이름 또는 주소를 검색하시면 편리하게 오실 수 있습니다.',
    },
    {
      type: 'parking',
      title: '주차안내',
      content: '건물 내 주차장을 이용하실 수 있습니다.',
    },
  ]);

  // 4. 동적 정보 카드 리스트 (INFORMATION)
  const [infoCards, setInfoCards] = useState([
    {
      title: '식사 안내',
      subtitle: '',
      content: '정성껏 준비한 피로연 식사가 마련되어 있습니다.\n편안하게 오셔서 식사를 즐겨주시기 바랍니다.',
    },
    {
      title: '화환 안내',
      subtitle: '',
      content: '화환은 정중히 사양하오니 너른 양해 부탁드립니다.',
    },
  ]);

  // 5. 이미지 파일 상태
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');

  const [coupleImageFile, setCoupleImageFile] = useState(null);
  const [coupleImagePreview, setCoupleImagePreview] = useState('');

  const [endingImageFile, setEndingImageFile] = useState(null);
  const [endingImagePreview, setEndingImagePreview] = useState('');

  const [groomPhotoFile, setGroomPhotoFile] = useState(null);
  const [groomPhotoPreview, setGroomPhotoPreview] = useState('');

  const [bridePhotoFile, setBridePhotoFile] = useState(null);
  const [bridePhotoPreview, setBridePhotoPreview] = useState('');

  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // BGM (배경음악) 상태
  const [bgmMode, setBgmMode] = useState('preset'); // 'preset' | 'file' | 'url' | 'none'
  const [bgmPresetUrl, setBgmPresetUrl] = useState(BGM_OPTIONS[0].url);
  const [customBgmFile, setCustomBgmFile] = useState(null);
  const [customBgmFileName, setCustomBgmFileName] = useState('');
  const [customBgmFileSize, setCustomBgmFileSize] = useState('');
  const [customBgmPreviewUrl, setCustomBgmPreviewUrl] = useState('');
  const [customBgmUrl, setCustomBgmUrl] = useState('');
  const bgmFileInputRef = useRef(null);

  // BGM 오디오 파일 선택 핸들러
  const handleBgmFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidAudio =
      file.type.startsWith('audio/') ||
      /\.(mp3|m4a|wav|aac|ogg|flac|wma)$/i.test(file.name);
    if (!isValidAudio) {
      return alert('오디오 음원 파일(MP3, M4A, WAV 등)을 선택해 주세요.');
    }

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    if (file.size > 30 * 1024 * 1024) {
      return alert(`선택하신 파일 용량(${sizeInMb}MB)이 너무 큽니다. 30MB 이하의 음원 파일을 선택해 주세요.`);
    }

    if (customBgmPreviewUrl) {
      URL.revokeObjectURL(customBgmPreviewUrl);
    }

    setCustomBgmFile(file);
    setCustomBgmFileName(file.name);
    setCustomBgmFileSize(`${sizeInMb} MB`);
    const objUrl = URL.createObjectURL(file);
    setCustomBgmPreviewUrl(objUrl);
  };

  // BGM 오디오 파일 삭제 핸들러
  const handleRemoveBgmFile = () => {
    if (customBgmPreviewUrl) {
      URL.revokeObjectURL(customBgmPreviewUrl);
    }
    setCustomBgmFile(null);
    setCustomBgmFileName('');
    setCustomBgmFileSize('');
    setCustomBgmPreviewUrl('');
    if (bgmFileInputRef.current) {
      bgmFileInputRef.current.value = '';
    }
  };

  // 상태 제어
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  // 폼 입력값 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 슬러그(영문 URL) 자동 생성
  const handleAutoSlug = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, slug: `wedding-${randomNum}` }));
  };

  // 이미지 유효성 검증 및 상태 저장 헬퍼
  const validateAndSetImage = (file, setFile, setPreview, label = '사진') => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return alert(`${label}은(는) 이미지 파일(JPG, PNG, WEBP 등)만 등록하실 수 있습니다.`);
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 20) {
      return alert(`${label} 파일 용량이 너무 큽니다 (${sizeMb.toFixed(1)}MB). 20MB 이하의 이미지를 선택해 주세요.`);
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // 갤러리 이미지 추가 / 삭제
  const handleGalleryImagesChange = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    const validFiles = rawFiles.filter((f) => {
      if (!f.type.startsWith('image/')) {
        alert(`${f.name} 파일은 이미지가 아니므로 제외되었습니다.`);
        return false;
      }
      if (f.size > 20 * 1024 * 1024) {
        alert(`${f.name} 파일 용량이 20MB를 초과하여 제외되었습니다.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setGalleryFiles((prev) => [...prev, ...validFiles].slice(0, 20));
      const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
      setGalleryPreviews((prev) => [...prev, ...newPreviews].slice(0, 20));
    }
  };

  const removeGalleryImage = (index) => {
    setGalleryFiles((prev) => prev.filter((_, idx) => idx !== index));
    setGalleryPreviews((prev) => prev.filter((_, idx) => idx !== index));
  };

  // 계좌 추가 및 제어
  const addGroomAccount = () => {
    setGroomAccounts((prev) => [
      ...prev,
      { group: '신랑측', title: '아버지', bank: '신한', number: '', holder: '' },
    ]);
  };

  const removeGroomAccount = (index) => {
    setGroomAccounts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateGroomAccount = (index, field, value) => {
    setGroomAccounts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addBrideAccount = () => {
    setBrideAccounts((prev) => [
      ...prev,
      { group: '신부측', title: '어머니', bank: '농협', number: '', holder: '' },
    ]);
  };

  const removeBrideAccount = (index) => {
    setBrideAccounts((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateBrideAccount = (index, field, value) => {
    setBrideAccounts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // 교통편 제어
  const addTransportation = () => {
    setTransportationList((prev) => [
      ...prev,
      { type: 'subway', title: '대중교통', content: '' },
    ]);
  };

  const removeTransportation = (index) => {
    setTransportationList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateTransportation = (index, field, value) => {
    setTransportationList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // 정보 카드 제어
  const addInfoCard = () => {
    setInfoCards((prev) => [
      ...prev,
      { title: '추가 안내', subtitle: '', content: '' },
    ]);
  };

  const removeInfoCard = (index) => {
    setInfoCards((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateInfoCard = (index, field, value) => {
    setInfoCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Supabase Storage 파일 업로드 헬퍼 (이미지 및 BGM 음원 지원)
  const uploadFileToStorage = async (file, path, bucket = 'wedding-images') => {
    if (!file) return null;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type || undefined
        });

      if (error) {
        console.warn(`Storage upload warning (${bucket}):`, error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.warn('Upload failed:', err);
      return null;
    }
  };

  // 실시간 미리보기용 객체 생성
  const previewInvitation = useMemo(() => {
    const groomFirst = (formData.groom_first_name_en || '').trim() || (formData.groom_name_en || '').trim().split(' ')[0] || (formData.groom_name_en || '').trim();
    const groomLast = (formData.groom_last_name_en || '').trim() || (formData.groom_name_en || '').trim().split(' ').slice(1).join(' ') || '';
    const brideFirst = (formData.bride_first_name_en || '').trim() || (formData.bride_name_en || '').trim().split(' ')[0] || (formData.bride_name_en || '').trim();
    const brideLast = (formData.bride_last_name_en || '').trim() || (formData.bride_name_en || '').trim().split(' ').slice(1).join(' ') || '';
    const mainNamesEn = (groomFirst && brideFirst)
      ? `${groomFirst} & ${brideFirst}`
      : (formData.groom_name_en && formData.bride_name_en ? `${formData.groom_name_en.trim()} & ${formData.bride_name_en.trim()}` : '');

    const allAccounts = [
      ...groomAccounts.filter((a) => a.number && a.number.trim()).map((a) => ({
        group: '신랑측',
        title: a.title,
        bank: a.bank,
        account_number: a.number,
        number: a.number,
        holder: a.holder || (a.title === '신랑' ? formData.groom_name : ''),
        name: a.holder ? `${a.title} ${a.holder}` : a.title,
      })),
      ...brideAccounts.filter((a) => a.number && a.number.trim()).map((a) => ({
        group: '신부측',
        title: a.title,
        bank: a.bank,
        account_number: a.number,
        number: a.number,
        holder: a.holder || (a.title === '신부' ? formData.bride_name : ''),
        name: a.holder ? `${a.title} ${a.holder}` : a.title,
      })),
    ];

    return {
      groom_name: formData.groom_name,
      bride_name: formData.bride_name,
      groom_name_en: formData.groom_name_en,
      bride_name_en: formData.bride_name_en,
      groom_first_name_en: groomFirst,
      groom_last_name_en: groomLast,
      bride_first_name_en: brideFirst,
      bride_last_name_en: brideLast,
      main_names_en: mainNamesEn,
      groom_relation: formData.groom_relation,
      bride_relation: formData.bride_relation,
      groom_father_deceased: formData.groom_father_deceased,
      groom_mother_deceased: formData.groom_mother_deceased,
      bride_father_deceased: formData.bride_father_deceased,
      bride_mother_deceased: formData.bride_mother_deceased,
      groom_phone: formData.groom_phone,
      groom_father_phone: formData.groom_father_phone,
      groom_mother_phone: formData.groom_mother_phone,
      bride_phone: formData.bride_phone,
      bride_father_phone: formData.bride_father_phone,
      bride_mother_phone: formData.bride_mother_phone,
      groom_father: formData.groom_father,
      groom_mother: formData.groom_mother,
      bride_father: formData.bride_father,
      bride_mother: formData.bride_mother,
      wedding_date: formData.wedding_date ? `${formData.wedding_date}T${formData.wedding_time || '12:00'}:00` : '',
      venue_name: formData.venue_name,
      venue_hall: formData.venue_hall,
      venue_address: formData.venue_address,
      venue_detail: formData.venue_detail,
      message: formData.message,
      quote_content: formData.show_quote_section ? formData.quote_content : '',
      quote_source: formData.show_quote_section ? formData.quote_source : '',
      images: {
        main: mainImagePreview,
        cover: coverImagePreview || mainImagePreview,
        couple_profile: coupleImagePreview || mainImagePreview,
        ending: endingImagePreview || mainImagePreview,
        groom_profile: groomPhotoPreview,
        bride_profile: bridePhotoPreview,
      },
      gallery_images: galleryPreviews,
      accounts: allAccounts,
      transportation: transportationList.filter((t) => t.title && t.content),
      info_notices: infoCards.filter((c) => c.title && c.content),
      template_config: {
        title_color: formData.title_color,
        show_intro: formData.show_intro,
        show_countdown: formData.show_countdown,
        show_gallery: formData.show_gallery,
        show_accounts: formData.show_accounts,
        show_rsvp: formData.show_rsvp,
        show_guestbook: formData.show_guestbook,
        show_quote_section: formData.show_quote_section,
        show_profile_photos: formData.show_profile_photos,
        groom_relation: formData.groom_relation,
        bride_relation: formData.bride_relation,
        groom_father_deceased: formData.groom_father_deceased,
        groom_mother_deceased: formData.groom_mother_deceased,
        bride_father_deceased: formData.bride_father_deceased,
        bride_mother_deceased: formData.bride_mother_deceased,
        venue_hall: formData.venue_hall,
      },
      bgm_url:
        bgmMode === 'preset'
          ? bgmPresetUrl || ''
          : bgmMode === 'file'
          ? customBgmPreviewUrl || ''
          : bgmMode === 'url'
          ? customBgmUrl.trim()
          : '',
      bgm_mode:
        bgmMode === 'preset'
          ? 'preset'
          : bgmMode === 'file' || bgmMode === 'url'
          ? 'custom'
          : 'none',
      template_type: formData.template_type || 'basic',
    };
  }, [
    formData,
    groomAccounts,
    brideAccounts,
    transportationList,
    infoCards,
    mainImagePreview,
    coverImagePreview,
    coupleImagePreview,
    endingImagePreview,
    groomPhotoPreview,
    bridePhotoPreview,
    galleryPreviews,
    bgmMode,
    bgmPresetUrl,
    customBgmPreviewUrl,
    customBgmUrl,
  ]);

  // 청첩장 생성 및 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. 필수 인적사항 검증
    if (!formData.groom_name.trim() || !formData.bride_name.trim()) {
      return alert('신랑과 신부 성함을 모두 입력해 주세요.');
    }

    // 2. 예식 일시 검증
    if (!formData.wedding_date) {
      return alert('예식 날짜를 선택해 주세요.');
    }
    if (!formData.wedding_time) {
      return alert('예식 시간을 선택해 주세요.');
    }

    // 3. 예식 장소 검증
    if (!formData.venue_name.trim()) {
      return alert('예식장 이름을 입력해 주세요.');
    }
    if (!formData.venue_address.trim()) {
      return alert('예식장 주소를 입력해 주세요.');
    }

    // 4. 대표 메인 사진 검증
    if (!mainImageFile && !mainImagePreview) {
      return alert('청첩장 첫 화면에 노출될 메인 대표 사진을 등록해 주세요.');
    }

    // 5. URL 슬러그 형식 검증
    const rawSlug = formData.slug.trim() || `wedding-${Math.floor(1000 + Math.random() * 9000)}`;
    const slugRegex = /^[a-zA-Z0-9_-]+$/;
    if (!slugRegex.test(rawSlug)) {
      return alert('청첩장 영문 주소(URL SLUG)는 영문자, 숫자, 하이픈(-), 언더바(_)만 사용 가능합니다.');
    }
    const cleanSlug = rawSlug.toLowerCase();

    // 6. 음원 URL 유효성 검증
    if (bgmMode === 'url' && customBgmUrl.trim()) {
      if (!/^https?:\/\//i.test(customBgmUrl.trim())) {
        return alert('음원 링크는 http:// 또는 https:// 로 시작하는 올바른 웹 주소여야 합니다.');
      }
    }

    setSubmitting(true);
    setUploadStatus('청첩장 영문 주소 중복 여부를 확인하고 있습니다...');

    try {
      // 7. 슬러그 실시간 중복 체크
      const { data: existingCard } = await supabase
        .from('invitations')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (existingCard) {
        setSubmitting(false);
        setUploadStatus('');
        return alert(`'${cleanSlug}' 주소는 이미 사용 중인 영문 주소입니다. 다른 주소를 입력하시거나 'AUTO GENERATE' 버튼을 눌러주세요.`);
      }

      // 8. 스마트스토어/선물 인증코드 검증
      let willBeActive = false;
      let matchedCodeId = null;
      const inputCode = (formData.order_code || '').trim().toUpperCase();

      if (inputCode) {
        setUploadStatus('입력하신 인증코드를 확인하고 있습니다...');
        try {
          const { data: codeRow, error: codeErr } = await supabase
            .from('order_codes')
            .select('*')
            .eq('code', inputCode)
            .maybeSingle();

          if (codeErr) {
            console.warn('order_codes query warning:', codeErr);
          }

          if (!codeRow) {
            setSubmitting(false);
            setUploadStatus('');
            return alert('입력하신 인증코드가 올바르지 않습니다. 코드를 다시 확인해 주시거나, 비워두고 샘플 모드로 제작해 주세요.');
          }

          if (codeRow.is_used) {
            setSubmitting(false);
            setUploadStatus('');
            return alert('해당 인증코드는 이미 사용 완료된 1회용 코드입니다. 새로운 코드를 발급받으시거나 비워두고 제작해 주세요.');
          }

          willBeActive = true;
          matchedCodeId = codeRow.id;
        } catch (err) {
          console.warn('Code check failed:', err);
        }
      }

      setUploadStatus('웨딩 사진 및 이미지를 업로드하고 있습니다...');
      // 1. 단일 이미지들 업로드
      let uploadedMainUrl = mainImagePreview;
      if (mainImageFile) {
        const u = await uploadFileToStorage(mainImageFile, `${cleanSlug}/main`);
        if (u) uploadedMainUrl = u;
      }

      let uploadedCoverUrl = coverImagePreview;
      if (coverImageFile) {
        const u = await uploadFileToStorage(coverImageFile, `${cleanSlug}/cover`);
        if (u) uploadedCoverUrl = u;
      }

      let uploadedCoupleUrl = coupleImagePreview;
      if (coupleImageFile) {
        const u = await uploadFileToStorage(coupleImageFile, `${cleanSlug}/couple`);
        if (u) uploadedCoupleUrl = u;
      }

      let uploadedEndingUrl = endingImagePreview;
      if (endingImageFile) {
        const u = await uploadFileToStorage(endingImageFile, `${cleanSlug}/ending`);
        if (u) uploadedEndingUrl = u;
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

      // 2. 갤러리 다중 이미지 업로드
      setUploadStatus('갤러리 사진들을 업로드하고 있습니다...');
      const uploadedGalleryUrls = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const u = await uploadFileToStorage(galleryFiles[i], `${cleanSlug}/gallery_${i + 1}`);
        if (u) uploadedGalleryUrls.push(u);
      }
      const finalGalleryImages = uploadedGalleryUrls.length > 0 ? uploadedGalleryUrls : galleryPreviews;

      // 3. 배경음악(BGM) 음원 파일 업로드 및 링크 처리
      let finalBgmUrl = '';
      let finalBgmMode = 'none';

      if (bgmMode === 'preset') {
        finalBgmUrl = bgmPresetUrl || '';
        finalBgmMode = finalBgmUrl ? 'preset' : 'none';
      } else if (bgmMode === 'file') {
        if (customBgmFile) {
          setUploadStatus('고객 지정 배경음악(BGM) 음원 파일을 업로드하고 있습니다...');
          let uploadedBgm = await uploadFileToStorage(customBgmFile, `${cleanSlug}/bgm_custom`, 'bgm');
          if (!uploadedBgm) {
            uploadedBgm = await uploadFileToStorage(customBgmFile, `${cleanSlug}/bgm_custom`, 'wedding-images');
          }

          if (uploadedBgm) {
            finalBgmUrl = uploadedBgm;
            finalBgmMode = 'custom';
          } else {
            console.warn('BGM Storage upload warning: 권한 정책 등으로 업로드 실패');
            finalBgmUrl = '';
            finalBgmMode = 'none';
          }
        }
      } else if (bgmMode === 'url') {
        finalBgmUrl = customBgmUrl.trim();
        finalBgmMode = finalBgmUrl ? 'custom' : 'none';
      } else if (bgmMode === 'none') {
        finalBgmUrl = '';
        finalBgmMode = 'none';
      }

      setUploadStatus('청첩장 데이터를 안전하게 저장하고 있습니다...');

      // 4. 계좌 통합 리스트 생성
      const allAccounts = [
        ...groomAccounts.filter((a) => a.number && a.number.trim()).map((a) => ({
          group: '신랑측',
          title: a.title,
          bank: a.bank,
          account_number: a.number.trim(),
          number: a.number.trim(),
          holder: a.holder.trim() || (a.title === '신랑' ? formData.groom_name.trim() : ''),
          name: a.holder.trim() ? `${a.title} ${a.holder.trim()}` : a.title,
        })),
        ...brideAccounts.filter((a) => a.number && a.number.trim()).map((a) => ({
          group: '신부측',
          title: a.title,
          bank: a.bank,
          account_number: a.number.trim(),
          number: a.number.trim(),
          holder: a.holder.trim() || (a.title === '신부' ? formData.bride_name.trim() : ''),
          name: a.holder.trim() ? `${a.title} ${a.holder.trim()}` : a.title,
        })),
      ];

      // 5. Supabase DB INSERT 객체 생성 (34개 정규 컬럼 스키마 1:1 매핑)
      const newInvitation = {
        slug: cleanSlug,
        groom_name: formData.groom_name.trim(),
        bride_name: formData.bride_name.trim(),
        groom_name_en: formData.groom_name_en.trim(),
        bride_name_en: formData.bride_name_en.trim(),

        groom_phone: formData.groom_phone.trim(),
        groom_father_phone: formData.groom_father_phone.trim(),
        groom_mother_phone: formData.groom_mother_phone.trim(),
        bride_phone: formData.bride_phone.trim(),
        bride_father_phone: formData.bride_father_phone.trim(),
        bride_mother_phone: formData.bride_mother_phone.trim(),

        groom_father: formData.groom_father.trim(),
        groom_mother: formData.groom_mother.trim(),
        bride_father: formData.bride_father.trim(),
        bride_mother: formData.bride_mother.trim(),

        groom_relation: formData.groom_relation || '장남',
        groom_father_deceased: Boolean(formData.groom_father_deceased),
        groom_mother_deceased: Boolean(formData.groom_mother_deceased),
        bride_relation: formData.bride_relation || '장녀',
        bride_father_deceased: Boolean(formData.bride_father_deceased),
        bride_mother_deceased: Boolean(formData.bride_mother_deceased),

        wedding_date: `${formData.wedding_date}T${formData.wedding_time}:00`,
        venue_name: formData.venue_name.trim(),
        venue_hall: formData.venue_hall ? formData.venue_hall.trim() : '',
        venue_address: formData.venue_address.trim(),
        venue_detail: formData.venue_detail.trim(),

        main_names_en: (() => {
          const gf = formData.groom_first_name_en.trim() || formData.groom_name_en.trim().split(' ')[0] || formData.groom_name_en.trim();
          const bf = formData.bride_first_name_en.trim() || formData.bride_name_en.trim().split(' ')[0] || formData.bride_name_en.trim();
          if (gf && bf) return `${gf} & ${bf}`;
          if (formData.groom_name_en.trim() && formData.bride_name_en.trim()) return `${formData.groom_name_en.trim()} & ${formData.bride_name_en.trim()}`;
          return '';
        })(),
        groom_first_name_en: formData.groom_first_name_en.trim() || formData.groom_name_en.trim().split(' ')[0] || formData.groom_name_en.trim(),
        groom_last_name_en: formData.groom_last_name_en.trim() || formData.groom_name_en.trim().split(' ').slice(1).join(' ') || '',
        bride_first_name_en: formData.bride_first_name_en.trim() || formData.bride_name_en.trim().split(' ')[0] || formData.bride_name_en.trim(),
        bride_last_name_en: formData.bride_last_name_en.trim() || formData.bride_name_en.trim().split(' ').slice(1).join(' ') || '',

        message: formData.message.trim(),
        quote_content: formData.show_quote_section ? formData.quote_content.trim() : '',
        quote_source: formData.show_quote_section ? formData.quote_source.trim() : '',

        images: {
          main: uploadedMainUrl || '',
          cover: uploadedCoverUrl || uploadedMainUrl || '',
          couple_profile: uploadedCoupleUrl || uploadedMainUrl || '',
          ending: uploadedEndingUrl || uploadedMainUrl || '',
          groom_profile: uploadedGroomPhoto || '',
          bride_profile: uploadedBridePhoto || '',
        },
        gallery_images: finalGalleryImages,
        accounts: allAccounts,
        transportation: transportationList.filter((t) => t.title.trim() && t.content.trim()),
        info_notices: infoCards.filter((c) => c.title.trim() && c.content.trim()),

        bgm_url: finalBgmUrl,
        bgm_mode: finalBgmMode,
        template_type: formData.template_type || 'editorial',
        is_active: willBeActive,
        order_code: inputCode || null,

        template_config: {
          title_color: formData.title_color,
          show_intro: formData.show_intro,
          show_countdown: formData.show_countdown,
          show_gallery: formData.show_gallery,
          show_accounts: formData.show_accounts,
          show_rsvp: formData.show_rsvp,
          show_guestbook: formData.show_guestbook,
          show_quote_section: formData.show_quote_section,
          show_profile_photos: Boolean(formData.show_profile_photos),
          groom_relation: formData.groom_relation,
          bride_relation: formData.bride_relation,
          groom_father_deceased: formData.groom_father_deceased,
          groom_mother_deceased: formData.groom_mother_deceased,
          bride_father_deceased: formData.bride_father_deceased,
          bride_mother_deceased: formData.bride_mother_deceased,
          venue_hall: formData.venue_hall,
          is_active: willBeActive,
          order_code: inputCode || null,
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

      // 1회용 인증코드 사용 완료 처리
      if (matchedCodeId) {
        try {
          await supabase
            .from('order_codes')
            .update({
              is_used: true,
              used_by_slug: cleanSlug,
              used_at: new Date().toISOString(),
            })
            .eq('id', matchedCodeId);
        } catch (codeUpdateErr) {
          console.warn('order_codes update error:', codeUpdateErr);
        }
      }

      setCreatedResult({
        slug: data.slug,
        manage_token: data.manage_token,
        is_active: willBeActive,
        order_code: inputCode || null,
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
      <div 
        className="min-h-screen bg-[#F6F5F2] py-16 px-4 flex justify-center items-center text-stone-900 font-sans selection:bg-stone-200 antialiased"
        style={{ colorScheme: 'light' }}
      >
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 sm:p-10 text-center border border-stone-200/80">
          <p className="text-[11px] font-mono tracking-[0.25em] text-stone-400 uppercase mb-3">
            ATELIER DE MARIAGE — COMPLETED
          </p>
          <h1 className="text-2xl sm:text-[26px] font-serif text-stone-900 mb-2 font-normal tracking-tight">
            모바일 청첩장이 완성되었습니다
          </h1>
          <p className="text-xs sm:text-[13px] text-stone-500 mb-8 font-light leading-relaxed">
            두 분의 소중한 순간을 담은 청첩장이 생성되었습니다.<br />
            아래 발급된 링크를 통해 청첩장 확인 및 관리가 가능합니다.
          </p>

          {/* 정식 활성화 vs 샘플 모드 상태 안내 카드 */}
          {createdResult.is_active ? (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-left flex items-start gap-3">
              <span className="text-emerald-600 text-lg mt-0.5">✦</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-emerald-800">정식 청첩장 활성화 완료</span>
                  {createdResult.order_code && (
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                      {createdResult.order_code}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-emerald-700 font-light leading-relaxed">
                  인증이 정상 완료되어 워터마크 없이 모든 기능이 정식 서비스 상태입니다.<br />
                  하객분들께 링크를 자유롭게 공유하셔도 좋습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-left flex items-start gap-3">
              <span className="text-amber-600 text-lg mt-0.5">ⓘ</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-amber-900">샘플 미리보기 모드로 등록됨</span>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                    SAMPLE MODE
                  </span>
                </div>
                <p className="text-[12px] text-amber-800 font-light leading-relaxed">
                  스마트스토어 구매 고객님은 톡톡으로 전달받으신 1회용 주문 코드를 등록하시거나, 
                  관리자 승인이 완료되면 워터마크가 즉시 제거된 정식 청첩장으로 활성화됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 하객 공유용 청첩장 링크 */}
          <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80 text-left mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono tracking-widest text-stone-700 bg-stone-200/70 px-2 py-0.5 rounded-full uppercase font-medium">
                GUEST SHARE LINK
              </span>
              <span className="text-[11px] text-stone-400 font-light">하객 공유용</span>
            </div>
            <p className="text-sm font-mono text-stone-900 font-semibold break-all my-2.5">
              {cardUrl}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(cardUrl);
                  alert('청첩장 링크가 복사되었습니다!');
                }}
                className="flex-1 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-xs"
              >
                청첩장 링크 복사
              </button>
              <a
                href={`/${createdResult.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-xl transition-all flex items-center justify-center cursor-pointer"
              >
                청첩장 바로보기 ↗
              </a>
            </div>
          </div>

          {/* 신랑신부 전용 관리자 링크 */}
          <div className="p-5 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] text-left mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono tracking-widest text-stone-700 bg-[#EFE9DF] px-2 py-0.5 rounded-full uppercase font-medium">
                PRIVATE ADMIN LINK
              </span>
              <span className="text-[11px] text-stone-400 font-light">신랑·신부 전용</span>
            </div>
            <p className="text-xs font-mono text-stone-800 break-all my-2.5 font-medium">
              {manageUrl}
            </p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(manageUrl);
                alert('관리자 전용 링크가 복사되었습니다! 이 링크는 신랑·신부님만 보관해 주세요.');
              }}
              className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-xs"
            >
              관리자 페이지 링크 복사
            </button>
            <p className="text-[10px] text-stone-400 mt-2 font-light">
              ※ 관리자 링크에는 관리 토큰이 포함되어 있으니 신랑·신부님만 보관해 주세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreatedResult(null);
              window.location.reload();
            }}
            className="text-xs text-stone-400 hover:text-stone-700 font-mono underline cursor-pointer transition-colors"
          >
            CREATE ANOTHER INVITATION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#F6F5F2] py-14 px-4 sm:px-6 flex justify-center text-stone-900 font-sans selection:bg-stone-200 antialiased"
      style={{ colorScheme: 'light' }}
    >
      <div className="w-full max-w-[740px]">
        
        {/* 상단 헤더 - 시니컬 & 감성 에디토리얼 */}
        <div className="text-center mb-12 pt-2">
          <p className="text-[11px] font-mono tracking-[0.28em] text-stone-400 uppercase mb-3 font-medium">
            ATELIER DE MARIAGE — BESPOKE ORDER
          </p>
          <h1 className="text-2xl sm:text-[32px] font-serif tracking-tight text-stone-900 font-normal mb-3">
            모바일 청첩장 셀프 제작 신청
          </h1>
          <p className="text-xs sm:text-[13px] text-stone-500 font-light leading-relaxed max-w-md mx-auto break-keep">
            단 하나의 소중한 순간을 완성하는 감각적인 기록.<br className="hidden sm:inline" />
            예식 정보를 입력해 주시면 정갈하고 완성도 높은 모바일 청첩장이 자동으로 완성됩니다.
          </p>
          <div className="w-8 h-px bg-stone-300 mx-auto mt-6" />
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 00. 디자인 템플릿 선택 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">00</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  청첩장 디자인 시안 선택
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase hidden sm:inline">
                  DESIGN TEMPLATE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 시안 1: 모던 클래식 */}
              <div
                onClick={() => setFormData((prev) => ({ ...prev, template_type: 'basic' }))}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  formData.template_type === 'basic'
                    ? 'border-stone-900 bg-stone-50/50 shadow-sm'
                    : 'border-stone-200/80 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded-full">
                    OPTION 01
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    formData.template_type === 'basic' ? 'border-stone-900 bg-stone-900' : 'border-stone-300'
                  }`}>
                    {formData.template_type === 'basic' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mb-1">
                  시안 1 : 모던 클래식 (Modern Classic)
                </h3>
                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  절제된 모던 룩과 블러 화보 갤러리, 다크 캘린더 카운트다운이 돋보이는 정갈한 시안
                </p>
              </div>

              {/* 시안 2: 클래식 에디토리얼 */}
              <div
                onClick={() => setFormData((prev) => ({ ...prev, template_type: 'editorial' }))}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  formData.template_type === 'editorial'
                    ? 'border-stone-900 bg-stone-50/50 shadow-sm'
                    : 'border-stone-200/80 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-white bg-stone-900 px-2 py-0.5 rounded-full">
                    OPTION 02 · NEW
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    formData.template_type === 'editorial' ? 'border-stone-900 bg-stone-900' : 'border-stone-300'
                  }`}>
                    {formData.template_type === 'editorial' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mb-1">
                  시안 2 : 클래식 에디토리얼 (Editorial Lookbook)
                </h3>
                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  매거진 커버와 비대칭 세로형 성함 타이포그래피, 대형 날짜와 룩북 갤러리의 감성 시안
                </p>
              </div>
            </div>
          </div>

          {/* 01. 신랑 & 신부 정보 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">01</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  신랑 & 신부 정보
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase hidden sm:inline">
                  GROOM & BRIDE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              {/* 신랑 */}
              <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-stone-700 bg-stone-200/60 px-2.5 py-0.5 rounded-full">
                    GROOM · 신랑측
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">한글 성함 *</label>
                    <input
                      type="text"
                      required
                      name="groom_name"
                      value={formData.groom_name}
                      onChange={handleChange}
                      placeholder="김민준"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">신랑 연락처</label>
                    <input
                      type="tel"
                      name="groom_phone"
                      value={formData.groom_phone}
                      onChange={handleChange}
                      placeholder="010-0000-0000"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">영문 이름 (First Name)</label>
                    <input
                      type="text"
                      name="groom_first_name_en"
                      value={formData.groom_first_name_en}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          groom_first_name_en: val,
                          groom_name_en: prev.groom_last_name_en ? `${val} ${prev.groom_last_name_en}`.trim() : val,
                        }));
                      }}
                      placeholder="Minjun"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all font-serif"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">영문 성 (Last Name)</label>
                    <input
                      type="text"
                      name="groom_last_name_en"
                      value={formData.groom_last_name_en}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          groom_last_name_en: val,
                          groom_name_en: prev.groom_first_name_en ? `${prev.groom_first_name_en} ${val}`.trim() : val,
                        }));
                      }}
                      placeholder="Kim"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all font-serif"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-stone-700">관계 호칭</label>
                    <div className="flex gap-1">
                      {['장남', '차남', '삼남', '막내'].map((rel) => (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, groom_relation: rel }))}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                            formData.groom_relation === rel
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    name="groom_relation"
                    value={formData.groom_relation}
                    onChange={handleChange}
                    placeholder="장남"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all"
                  />
                </div>

                {/* 혼주 (신랑측 부모님) */}
                <div className="pt-3 border-t border-stone-200/60 space-y-3">
                  <span className="text-[11px] font-mono tracking-wider text-stone-400 block uppercase">
                    PARENTS · 신랑측 혼주
                  </span>
                  
                  {/* 아버지 */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-stone-600">아버지 성함</label>
                        <label className="flex items-center gap-1 text-[11px] text-stone-400 cursor-pointer select-none hover:text-stone-700">
                          <input
                            type="checkbox"
                            name="groom_father_deceased"
                            checked={formData.groom_father_deceased}
                            onChange={handleChange}
                            className="rounded border-stone-300 text-stone-900 accent-stone-900"
                          />
                          故 표기
                        </label>
                      </div>
                      <input
                        type="text"
                        name="groom_father"
                        value={formData.groom_father}
                        onChange={handleChange}
                        placeholder="김OO"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">아버지 연락처</label>
                      <input
                        type="tel"
                        name="groom_father_phone"
                        value={formData.groom_father_phone}
                        onChange={handleChange}
                        placeholder="010-0000-0000"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* 어머니 */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-stone-600">어머니 성함</label>
                        <label className="flex items-center gap-1 text-[11px] text-stone-400 cursor-pointer select-none hover:text-stone-700">
                          <input
                            type="checkbox"
                            name="groom_mother_deceased"
                            checked={formData.groom_mother_deceased}
                            onChange={handleChange}
                            className="rounded border-stone-300 text-stone-900 accent-stone-900"
                          />
                          故 표기
                        </label>
                      </div>
                      <input
                        type="text"
                        name="groom_mother"
                        value={formData.groom_mother}
                        onChange={handleChange}
                        placeholder="이OO"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">어머니 연락처</label>
                      <input
                        type="tel"
                        name="groom_mother_phone"
                        value={formData.groom_mother_phone}
                        onChange={handleChange}
                        placeholder="010-0000-0000"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 신부 */}
              <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-stone-700 bg-stone-200/60 px-2.5 py-0.5 rounded-full">
                    BRIDE · 신부측
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">한글 성함 *</label>
                    <input
                      type="text"
                      required
                      name="bride_name"
                      value={formData.bride_name}
                      onChange={handleChange}
                      placeholder="이서연"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">신부 연락처</label>
                    <input
                      type="tel"
                      name="bride_phone"
                      value={formData.bride_phone}
                      onChange={handleChange}
                      placeholder="010-0000-0000"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">영문 이름 (First Name)</label>
                    <input
                      type="text"
                      name="bride_first_name_en"
                      value={formData.bride_first_name_en}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          bride_first_name_en: val,
                          bride_name_en: prev.bride_last_name_en ? `${val} ${prev.bride_last_name_en}`.trim() : val,
                        }));
                      }}
                      placeholder="Seoyeon"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all font-serif"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">영문 성 (Last Name)</label>
                    <input
                      type="text"
                      name="bride_last_name_en"
                      value={formData.bride_last_name_en}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          bride_last_name_en: val,
                          bride_name_en: prev.bride_first_name_en ? `${prev.bride_first_name_en} ${val}`.trim() : val,
                        }));
                      }}
                      placeholder="Lee"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all font-serif"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-stone-700">관계 호칭</label>
                    <div className="flex gap-1">
                      {['장녀', '차녀', '삼녀', '막내'].map((rel) => (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, bride_relation: rel }))}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                            formData.bride_relation === rel
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    name="bride_relation"
                    value={formData.bride_relation}
                    onChange={handleChange}
                    placeholder="장녀"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all"
                  />
                </div>

                {/* 혼주 (신부측 부모님) */}
                <div className="pt-3 border-t border-stone-200/60 space-y-3">
                  <span className="text-[11px] font-mono tracking-wider text-stone-400 block uppercase">
                    PARENTS · 신부측 혼주
                  </span>
                  
                  {/* 아버지 */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-stone-600">아버지 성함</label>
                        <label className="flex items-center gap-1 text-[11px] text-stone-400 cursor-pointer select-none hover:text-stone-700">
                          <input
                            type="checkbox"
                            name="bride_father_deceased"
                            checked={formData.bride_father_deceased}
                            onChange={handleChange}
                            className="rounded border-stone-300 text-stone-900 accent-stone-900"
                          />
                          故 표기
                        </label>
                      </div>
                      <input
                        type="text"
                        name="bride_father"
                        value={formData.bride_father}
                        onChange={handleChange}
                        placeholder="이OO"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">아버지 연락처</label>
                      <input
                        type="tel"
                        name="bride_father_phone"
                        value={formData.bride_father_phone}
                        onChange={handleChange}
                        placeholder="010-0000-0000"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* 어머니 */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-stone-600">어머니 성함</label>
                        <label className="flex items-center gap-1 text-[11px] text-stone-400 cursor-pointer select-none hover:text-stone-700">
                          <input
                            type="checkbox"
                            name="bride_mother_deceased"
                            checked={formData.bride_mother_deceased}
                            onChange={handleChange}
                            className="rounded border-stone-300 text-stone-900 accent-stone-900"
                          />
                          故 표기
                        </label>
                      </div>
                      <input
                        type="text"
                        name="bride_mother"
                        value={formData.bride_mother}
                        onChange={handleChange}
                        placeholder="박OO"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">어머니 연락처</label>
                      <input
                        type="tel"
                        name="bride_mother_phone"
                        value={formData.bride_mother_phone}
                        onChange={handleChange}
                        placeholder="010-0000-0000"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 영문 URL 설정 */}
            <div className="p-4 sm:p-4.5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-stone-700 tracking-tight">
                  나만의 청첩장 영문 주소 (URL SLUG) *
                </label>
                <button
                  type="button"
                  onClick={handleAutoSlug}
                  className="text-[11px] font-mono text-stone-500 hover:text-stone-900 underline cursor-pointer transition-colors"
                >
                  AUTO GENERATE
                </button>
              </div>
              <div className="flex items-center bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900 transition-all">
                <span className="text-xs text-stone-400 font-mono select-none mr-1.5">wedding.com/</span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="minjun-seoyeon"
                  className="flex-1 bg-transparent text-sm text-stone-900 font-mono focus:outline-none placeholder:text-stone-300"
                />
              </div>
            </div>
          </div>

          {/* 02. 예식 일시 및 웨딩홀 위치 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">02</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  예식 일시 및 웨딩홀 위치
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase hidden sm:inline">
                  CEREMONY & VENUE
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">예식 날짜 *</label>
                <input
                  type="date"
                  required
                  name="wedding_date"
                  value={formData.wedding_date}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-stone-900 font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">예식 시간 *</label>
                <input
                  type="time"
                  required
                  name="wedding_time"
                  value={formData.wedding_time}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-stone-900 font-sans"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">예식장 이름 *</label>
                  <input
                    type="text"
                    required
                    name="venue_name"
                    value={formData.venue_name}
                    onChange={handleChange}
                    placeholder="아펠가모 공덕"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">층 및 홀 이름</label>
                  <input
                    type="text"
                    name="venue_hall"
                    value={formData.venue_hall}
                    onChange={handleChange}
                    placeholder="7층 마리에홀"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">예식장 주소 (지도 연동) *</label>
                <input
                  type="text"
                  required
                  name="venue_address"
                  value={formData.venue_address}
                  onChange={handleChange}
                  placeholder="서울 마포구 마포대로 92"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                />
                <p className="text-[11px] text-stone-400 mt-1.5 font-light">
                  ※ 도로명 주소 또는 지번 주소를 입력하시면 카카오 지도와 네비게이션이 자동으로 연결됩니다.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">식장 추가 상세 안내</label>
                <textarea
                  rows={2}
                  name="venue_detail"
                  value={formData.venue_detail}
                  onChange={handleChange}
                  placeholder="공덕역 8번 출구 도보 3분 / 건물 내 2시간 무료 주차"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 leading-relaxed font-sans"
                />
              </div>
            </div>
          </div>

          {/* 03. 모시는 글 (초대 인사말) */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">03</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  모시는 글 (초대 인사말)
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase hidden sm:inline">
                  INVITATION MESSAGE
                </span>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2">
                PRESET · 추천 초대 문구 불러오기
              </span>
              <div className="flex flex-wrap gap-2">
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
                    className="px-3 py-1.5 bg-[#FAFAF9] hover:bg-stone-900 hover:text-white border border-stone-200/80 text-stone-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">인사말 제목</label>
                <input
                  type="text"
                  name="message_title"
                  value={formData.message_title}
                  onChange={handleChange}
                  placeholder="새로운 시작의 날"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 font-serif"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">초대 본문 문구</label>
                <textarea
                  rows={6}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-3.5 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 leading-relaxed focus:outline-none focus:border-stone-900 font-sans"
                />
              </div>
            </div>
          </div>

          {/* 04. 웨딩 사진 등록 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">04</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  웨딩 사진 및 화보 등록
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase hidden sm:inline">
                  WEDDING PHOTOGRAPHY
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {/* 메인 풀스크린 커버 사진 & 매거진 슬리브 커버 사진 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 메인 풀스크린 사진 */}
                <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-800">
                      본문 메인 풀스크린 사진 *
                    </label>
                    <span className="text-[10px] font-mono text-stone-700 bg-stone-200/70 px-2 py-0.5 rounded-full font-medium">
                      MAIN
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mb-3.5 font-light">
                    청첩장 본문 첫 화면의 대표 풀스크린 사진입니다.
                  </p>
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-22 bg-white rounded-xl overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center shadow-xs">
                      {mainImagePreview ? (
                        <img src={mainImagePreview} alt="Main" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-stone-300 font-mono">MAIN</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          validateAndSetImage(e.target.files?.[0], setMainImageFile, setMainImagePreview, '본문 메인 사진');
                        }}
                        className="text-[11px] text-stone-600 file:mr-2.5 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-medium file:bg-stone-900 file:text-white hover:file:bg-black cursor-pointer transition-all w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* 인트로 커버 사진 (시안 1 & 시안 2 공통) */}
                <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-800">
                      인트로 커버 사진 (선택)
                    </label>
                    <span className="text-[10px] font-mono text-stone-700 bg-stone-200/70 px-2 py-0.5 rounded-full font-medium">
                      OPTION 01 & 02
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mb-3.5 font-light">
                    시안 1 봉투 카드 및 시안 2 매거진 슬리브 인트로 커버 (미등록 시 메인 사진 적용)
                  </p>
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-22 bg-white rounded-xl overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center shadow-xs">
                      {coverImagePreview ? (
                        <img src={coverImagePreview} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-stone-300 font-mono">COVER</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          validateAndSetImage(e.target.files?.[0], setCoverImageFile, setCoverImagePreview, '인트로 커버 사진');
                        }}
                        className="text-[11px] text-stone-600 file:mr-2.5 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-medium file:bg-stone-200 file:text-stone-800 hover:file:bg-stone-300 cursor-pointer transition-all w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 신랑 & 신부 프로필 사진 (시안 1 전용 및 연락처용) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 신랑 프로필 */}
                <div className="p-4.5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-800">
                      신랑 프로필 사진 (선택)
                    </label>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded-full">
                      GROOM
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 mb-2.5">
                    시안 1 프로필 원형 화보 및 하객 연락처 모달에 적용됩니다.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center bg-white shadow-xs">
                      {groomPhotoPreview ? (
                        <img src={groomPhotoPreview} alt="Groom Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-stone-300 font-mono">GROOM</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        validateAndSetImage(e.target.files?.[0], setGroomPhotoFile, setGroomPhotoPreview, '신랑 프로필 사진');
                      }}
                      className="text-[11px] text-stone-500 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:bg-stone-200 file:text-stone-800 cursor-pointer w-full"
                    />
                  </div>
                </div>

                {/* 신부 프로필 */}
                <div className="p-4.5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-800">
                      신부 프로필 사진 (선택)
                    </label>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded-full">
                      BRIDE
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 mb-2.5">
                    시안 1 프로필 원형 화보 및 하객 연락처 모달에 적용됩니다.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center bg-white shadow-xs">
                      {bridePhotoPreview ? (
                        <img src={bridePhotoPreview} alt="Bride Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-stone-300 font-mono">BRIDE</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        validateAndSetImage(e.target.files?.[0], setBridePhotoFile, setBridePhotoPreview, '신부 프로필 사진');
                      }}
                      className="text-[11px] text-stone-500 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:bg-stone-200 file:text-stone-800 cursor-pointer w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 커플 사진 & 엔딩 사진 (선택) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4.5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    커플 사진 (인용구 섹션용)
                  </label>
                  <p className="text-[10px] text-stone-400 mb-2.5">미등록 시 메인 사진이 자동 적용됩니다.</p>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center shadow-xs">
                      {coupleImagePreview ? (
                        <img src={coupleImagePreview} alt="Couple" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-stone-300 font-mono">COUPLE</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        validateAndSetImage(e.target.files?.[0], setCoupleImageFile, setCoupleImagePreview, '커플 사진');
                      }}
                      className="text-[11px] text-stone-500 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:bg-stone-200 file:text-stone-800 cursor-pointer w-full"
                    />
                  </div>
                </div>

                <div className="p-4.5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    엔딩 사진 (최하단 감사 인사용)
                  </label>
                  <p className="text-[10px] text-stone-400 mb-2.5">미등록 시 메인 사진이 자동 적용됩니다.</p>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center shadow-xs">
                      {endingImagePreview ? (
                        <img src={endingImagePreview} alt="Ending" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-stone-300 font-mono">ENDING</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        validateAndSetImage(e.target.files?.[0], setEndingImageFile, setEndingImagePreview, '엔딩 사진');
                      }}
                      className="text-[11px] text-stone-500 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:bg-stone-200 file:text-stone-800 cursor-pointer w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 갤러리 다중 사진 */}
              <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-stone-800">
                    웨딩 갤러리 화보 사진 (최대 20장)
                  </label>
                  <span className="text-[11px] font-mono text-stone-400">
                    {galleryPreviews.length} / 20 PIC
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryImagesChange}
                  className="text-xs text-stone-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-stone-200 file:text-stone-800 hover:file:bg-stone-300 cursor-pointer mb-3.5"
                />
                {galleryPreviews.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 pt-1">
                    {galleryPreviews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group shadow-xs">
                        <img src={src} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-black text-white rounded-full text-xs flex items-center justify-center transition-colors cursor-pointer"
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

          {/* 05. 감성 글귀 및 영화 대사 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">05</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  감성 글귀 & 인용구
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase hidden sm:inline">
                  EPILOGUE & QUOTE
                </span>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="show_quote_section"
                  checked={formData.show_quote_section}
                  onChange={handleChange}
                  className="rounded border-stone-300 text-stone-900 accent-stone-900"
                />
                <span>섹션 노출</span>
              </label>
            </div>

            {formData.show_quote_section && (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-2">
                    PRESET · 추천 명대사 / 시 인용
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {QUOTE_PRESETS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            quote_content: q.content,
                            quote_source: q.source,
                          }));
                        }}
                        className="px-3 py-1.5 bg-[#FAFAF9] hover:bg-stone-900 hover:text-white border border-stone-200/80 text-stone-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
                      >
                        {q.source}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">글귀 내용</label>
                  <textarea
                    rows={4}
                    name="quote_content"
                    value={formData.quote_content}
                    onChange={handleChange}
                    className="w-full px-3.5 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 leading-relaxed focus:outline-none focus:border-stone-900 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">출처 (선택)</label>
                  <input
                    type="text"
                    name="quote_source"
                    value={formData.quote_source}
                    onChange={handleChange}
                    placeholder="영화 <연애의 온도>"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 06. 축의금 계좌번호 (다중 계좌 등록) */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">06</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  마음 전하실 곳 (축의금 계좌)
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase hidden sm:inline">
                  GIFT & ACCOUNT
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {/* 신랑측 계좌 리스트 */}
              <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-stone-700 bg-stone-200/60 px-2.5 py-0.5 rounded-full">
                    GROOM&apos;S ACCOUNT · 신랑측 계좌
                  </span>
                  <button
                    type="button"
                    onClick={addGroomAccount}
                    className="text-xs font-mono text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    + ADD ACCOUNT
                  </button>
                </div>

                {groomAccounts.map((acc, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-stone-200 space-y-3 relative shadow-2xs">
                    {groomAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGroomAccount(idx)}
                        className="absolute top-3 right-3 text-stone-400 hover:text-rose-500 text-xs cursor-pointer transition-colors"
                      >
                        ✕ 삭제
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">구분 호칭</label>
                        <input
                          type="text"
                          value={acc.title}
                          onChange={(e) => updateGroomAccount(idx, 'title', e.target.value)}
                          placeholder="신랑 / 아버지 / 어머니"
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">은행</label>
                        <select
                          value={acc.bank}
                          onChange={(e) => updateGroomAccount(idx, 'bank', e.target.value)}
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 bg-white focus:outline-none focus:border-stone-900"
                        >
                          {BANK_OPTIONS.map((b, i) => (
                            <option key={i} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-stone-700 mb-1">계좌번호</label>
                        <input
                          type="text"
                          value={acc.number}
                          onChange={(e) => updateGroomAccount(idx, 'number', e.target.value)}
                          placeholder="- 포함 입력"
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">예금주</label>
                        <input
                          type="text"
                          value={acc.holder}
                          onChange={(e) => updateGroomAccount(idx, 'holder', e.target.value)}
                          placeholder="성함"
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 신부측 계좌 리스트 */}
              <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-stone-700 bg-stone-200/60 px-2.5 py-0.5 rounded-full">
                    BRIDE&apos;S ACCOUNT · 신부측 계좌
                  </span>
                  <button
                    type="button"
                    onClick={addBrideAccount}
                    className="text-xs font-mono text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    + ADD ACCOUNT
                  </button>
                </div>

                {brideAccounts.map((acc, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-stone-200 space-y-3 relative shadow-2xs">
                    {brideAccounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBrideAccount(idx)}
                        className="absolute top-3 right-3 text-stone-400 hover:text-rose-500 text-xs cursor-pointer transition-colors"
                      >
                        ✕ 삭제
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">구분 호칭</label>
                        <input
                          type="text"
                          value={acc.title}
                          onChange={(e) => updateBrideAccount(idx, 'title', e.target.value)}
                          placeholder="신부 / 아버지 / 어머니"
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">은행</label>
                        <select
                          value={acc.bank}
                          onChange={(e) => updateBrideAccount(idx, 'bank', e.target.value)}
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 bg-white focus:outline-none focus:border-stone-900"
                        >
                          {BANK_OPTIONS.map((b, i) => (
                            <option key={i} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-stone-700 mb-1">계좌번호</label>
                        <input
                          type="text"
                          value={acc.number}
                          onChange={(e) => updateBrideAccount(idx, 'number', e.target.value)}
                          placeholder="- 포함 입력"
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">예금주</label>
                        <input
                          type="text"
                          value={acc.holder}
                          onChange={(e) => updateBrideAccount(idx, 'holder', e.target.value)}
                          placeholder="성함"
                          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 07. 오시는 길 (교통편 안내) */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">07</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  오시는 길 & 교통편 안내
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase hidden sm:inline">
                  LOCATION & TRANSPORT
                </span>
              </div>
              <button
                type="button"
                onClick={addTransportation}
                className="text-xs font-mono text-stone-600 hover:text-stone-900 bg-[#FAFAF9] border border-stone-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                + ADD ROUTE
              </button>
            </div>

            <div className="space-y-4">
              {transportationList.map((item, idx) => (
                <div key={idx} className="p-4 bg-[#FAFAF9] rounded-2xl border border-stone-200/80 relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <select
                        value={item.type}
                        onChange={(e) => updateTransportation(idx, 'type', e.target.value)}
                        className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-stone-900 font-medium"
                      >
                        <option value="subway">지하철</option>
                        <option value="bus">버스</option>
                        <option value="car">자차</option>
                        <option value="parking">주차안내</option>
                      </select>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateTransportation(idx, 'title', e.target.value)}
                        placeholder="교통편 구분명 (예: 지하철)"
                        className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 font-semibold focus:outline-none focus:border-stone-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTransportation(idx)}
                      className="text-stone-400 hover:text-rose-500 text-xs cursor-pointer transition-colors"
                    >
                      ✕ 삭제
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={item.content}
                    onChange={(e) => updateTransportation(idx, 'content', e.target.value)}
                    placeholder="상세 교통 안내 문구를 입력해 주세요."
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 leading-relaxed focus:outline-none focus:border-stone-900 font-sans"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 08. 안내 정보 (INFORMATION 카드) */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">08</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  예식 추가 안내사항
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase hidden sm:inline">
                  GUEST INFORMATION
                </span>
              </div>
              <button
                type="button"
                onClick={addInfoCard}
                className="text-xs font-mono text-stone-600 hover:text-stone-900 bg-[#FAFAF9] border border-stone-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                + ADD CARD
              </button>
            </div>

            <div className="space-y-4">
              {infoCards.map((card, idx) => (
                <div key={idx} className="p-4 bg-[#FAFAF9] rounded-2xl border border-stone-200/80 relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-2 gap-2.5 flex-1 mr-3">
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => updateInfoCard(idx, 'title', e.target.value)}
                        placeholder="카드 제목 (예: 식사 안내)"
                        className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 font-semibold focus:outline-none focus:border-stone-900"
                      />
                      <input
                        type="text"
                        value={card.subtitle}
                        onChange={(e) => updateInfoCard(idx, 'subtitle', e.target.value)}
                        placeholder="부제/시간 (예: PM 14:00~ 16:00)"
                        className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInfoCard(idx)}
                      className="text-stone-400 hover:text-rose-500 text-xs cursor-pointer transition-colors"
                    >
                      ✕ 삭제
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={card.content}
                    onChange={(e) => updateInfoCard(idx, 'content', e.target.value)}
                    placeholder="상세 안내 내용을 입력해 주세요."
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-300 leading-relaxed focus:outline-none focus:border-stone-900 font-sans"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 09. 배경음악 및 디자인 설정 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">09</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  배경음악 & 연출 설정
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase hidden sm:inline">
                  SOUND & DISPLAY
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {/* BGM 선택 및 업로드 */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-2.5">
                  배경음악 (BGM) 재생 설정
                </label>
                
                {/* 4가지 BGM 모드 탭 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5">
                  <button
                    type="button"
                    onClick={() => setBgmMode('preset')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      bgmMode === 'preset'
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 bg-[#FAFAF9] text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    추천 멜로디
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgmMode('file')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      bgmMode === 'file'
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 bg-[#FAFAF9] text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    음원 파일 첨부
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgmMode('url')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      bgmMode === 'url'
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 bg-[#FAFAF9] text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    음원 URL 입력
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgmMode('none')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      bgmMode === 'none'
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 bg-[#FAFAF9] text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    음악 없음
                  </button>
                </div>

                {/* 1. 무료 추천 멜로디 */}
                {bgmMode === 'preset' && (
                  <div className="p-4 bg-[#FAFAF9] rounded-2xl border border-stone-200/80 space-y-3">
                    <div>
                      <select
                        value={bgmPresetUrl}
                        onChange={(e) => setBgmPresetUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 bg-white focus:outline-none focus:border-stone-900"
                      >
                        {BGM_OPTIONS.filter((b) => b.url).map((bgm, idx) => (
                          <option key={idx} value={bgm.url}>{bgm.label}</option>
                        ))}
                      </select>
                    </div>
                    {bgmPresetUrl && (
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                          PREVIEW · 음원 미리듣기
                        </span>
                        <audio controls src={bgmPresetUrl} className="w-full h-8" />
                      </div>
                    )}
                  </div>
                )}

                {/* 2. 고객 소장 음원 파일 직접 첨부 */}
                {bgmMode === 'file' && (
                  <div className="p-4 bg-[#FAFAF9] rounded-2xl border border-stone-200/80 space-y-3">
                    <input
                      ref={bgmFileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac"
                      onChange={handleBgmFileChange}
                      className="hidden"
                      id="custom-bgm-file-upload"
                    />

                    {!customBgmFile ? (
                      <label
                        htmlFor="custom-bgm-file-upload"
                        className="w-full py-6 px-4 border border-dashed border-stone-300 hover:border-stone-800 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white group"
                      >
                        <span className="text-xl mb-1.5 opacity-60 group-hover:scale-110 transition-transform">🎧</span>
                        <span className="text-xs font-semibold text-stone-800 mb-0.5">
                          소장 음원 파일(MP3, M4A, WAV) 첨부하기
                        </span>
                        <span className="text-[11px] text-stone-400 font-light">
                          클릭하여 파일을 선택해 주세요 (최대 30MB 권장)
                        </span>
                      </label>
                    ) : (
                      <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 overflow-hidden mr-2">
                            <span className="text-base">🎵</span>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-stone-900 truncate">{customBgmFileName}</p>
                              <p className="text-[10px] font-mono text-stone-400">{customBgmFileSize}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <label
                              htmlFor="custom-bgm-file-upload"
                              className="px-2.5 py-1 text-[11px] font-mono bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg cursor-pointer transition-colors"
                            >
                              CHANGE
                            </label>
                            <button
                              type="button"
                              onClick={handleRemoveBgmFile}
                              className="px-2.5 py-1 text-[11px] font-mono bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                            >
                              DELETE
                            </button>
                          </div>
                        </div>

                        {customBgmPreviewUrl && (
                          <div className="pt-2 border-t border-stone-100">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                              PREVIEW · 업로드 음원 재생 확인
                            </span>
                            <audio controls src={customBgmPreviewUrl} className="w-full h-8" />
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-stone-400 font-light leading-relaxed">
                      ※ 신랑·신부님이 준비하신 특별한 음악이 모바일 청첩장 방문객에게 정갈하게 재생됩니다.
                    </p>
                  </div>
                )}

                {/* 3. 음원 링크(URL) 직접 입력 */}
                {bgmMode === 'url' && (
                  <div className="p-4 bg-[#FAFAF9] rounded-2xl border border-stone-200/80 space-y-3">
                    <div>
                      <input
                        type="url"
                        value={customBgmUrl}
                        onChange={(e) => setCustomBgmUrl(e.target.value)}
                        placeholder="https://example.com/audio/wedding-bgm.mp3"
                        className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-300 bg-white focus:outline-none focus:border-stone-900 font-mono"
                      />
                    </div>
                    {customBgmUrl.trim() && (
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block mb-1">
                          PREVIEW · 링크 음원 재생
                        </span>
                        <audio controls src={customBgmUrl.trim()} className="w-full h-8" />
                      </div>
                    )}
                  </div>
                )}

                {/* 4. 배경음악 없음 */}
                {bgmMode === 'none' && (
                  <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80 text-center py-5">
                    <p className="text-xs font-medium text-stone-700">배경음악 없이 정적이고 차분하게 연출됩니다.</p>
                    <p className="text-[11px] text-stone-400 mt-1 font-light">BGM 없이 미니멀한 모바일 청첩장을 원하실 때 권장합니다.</p>
                  </div>
                )}
              </div>

              {/* 커버 글자 색상 선택 */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-stone-800 mb-2">메인 커버 타이포 컬러</label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { label: '골드', color: '#E5A866' },
                    { label: '로즈골드', color: '#D48B8B' },
                    { label: '화이트', color: '#FFFFFF' },
                    { label: '차콜 블랙', color: '#1C1917' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, title_color: item.color }))}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 cursor-pointer transition-all ${
                        formData.title_color === item.color
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/15 inline-block shadow-2xs" style={{ backgroundColor: item.color }} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 섹션별 토글 스위치 */}
              <div className="pt-4 border-t border-stone-100">
                <span className="text-xs font-semibold text-stone-800 block mb-3">청첩장 주요 기능 노출 여부</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-stone-700">
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-[#FAFAF9] hover:bg-stone-100/70 border border-stone-200/60 rounded-xl transition-colors select-none">
                    <input
                      type="checkbox"
                      name="show_intro"
                      checked={formData.show_intro}
                      onChange={handleChange}
                      className="rounded border-stone-300 text-stone-900 accent-stone-900"
                    />
                    <span>봉투 인트로 커버</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-[#FAFAF9] hover:bg-stone-100/70 border border-stone-200/60 rounded-xl transition-colors select-none">
                    <input
                      type="checkbox"
                      name="show_countdown"
                      checked={formData.show_countdown}
                      onChange={handleChange}
                      className="rounded border-stone-300 text-stone-900 accent-stone-900"
                    />
                    <span>D-Day 카운트다운</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-[#FAFAF9] hover:bg-stone-100/70 border border-stone-200/60 rounded-xl transition-colors select-none">
                    <input
                      type="checkbox"
                      name="show_gallery"
                      checked={formData.show_gallery}
                      onChange={handleChange}
                      className="rounded border-stone-300 text-stone-900 accent-stone-900"
                    />
                    <span>웨딩 사진 갤러리</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-[#FAFAF9] hover:bg-stone-100/70 border border-stone-200/60 rounded-xl transition-colors select-none">
                    <input
                      type="checkbox"
                      name="show_accounts"
                      checked={formData.show_accounts}
                      onChange={handleChange}
                      className="rounded border-stone-300 text-stone-900 accent-stone-900"
                    />
                    <span>축의금 계좌 안내</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-[#FAFAF9] hover:bg-stone-100/70 border border-stone-200/60 rounded-xl transition-colors select-none">
                    <input
                      type="checkbox"
                      name="show_rsvp"
                      checked={formData.show_rsvp}
                      onChange={handleChange}
                      className="rounded border-stone-300 text-stone-900 accent-stone-900"
                    />
                    <span>참석의사 조사 (RSVP)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-[#FAFAF9] hover:bg-stone-100/70 border border-stone-200/60 rounded-xl transition-colors select-none">
                    <input
                      type="checkbox"
                      name="show_guestbook"
                      checked={formData.show_guestbook}
                      onChange={handleChange}
                      className="rounded border-stone-300 text-stone-900 accent-stone-900"
                    />
                    <span>축하 방명록</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-[#FAFAF9] hover:bg-stone-100/70 border border-stone-200/60 rounded-xl transition-colors select-none">
                    <input
                      type="checkbox"
                      name="show_profile_photos"
                      checked={formData.show_profile_photos}
                      onChange={handleChange}
                      className="rounded border-stone-300 text-stone-900 accent-stone-900"
                    />
                    <span>원형 프로필 화보 (시안1)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 10. 스마트스토어 주문 인증코드 (선택) */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">10</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  스마트스토어 주문 인증코드 <span className="text-xs font-sans text-stone-400 font-normal">(선택)</span>
                </h2>
                <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase hidden sm:inline">
                  ORDER CODE
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  1회용 정식 활성화 인증코드
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="order_code"
                    value={formData.order_code}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFormData((prev) => ({ ...prev, order_code: val }));
                    }}
                    placeholder="예: WED-8492-1049 또는 GIFT-3948-2819"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm font-mono tracking-wider text-stone-900 placeholder:text-stone-300 placeholder:font-sans bg-white focus:outline-none focus:border-stone-900 transition-colors uppercase"
                  />
                  {formData.order_code && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, order_code: '' }))}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#FAFAF9] rounded-2xl border border-stone-200/60 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-stone-400 text-xs mt-0.5">✦</span>
                  <p className="text-xs text-stone-600 leading-relaxed font-light">
                    <strong className="font-medium text-stone-800">스마트스토어 구매 고객:</strong> 주문 결제 후 네이버 톡톡 메시지로 전달받으신 1회용 인증코드를 입력하시면 워터마크가 제거된 정식 청첩장으로 즉시 개통됩니다.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 text-xs mt-0.5">💡</span>
                  <p className="text-[11px] text-stone-500 leading-relaxed font-light">
                    <strong className="font-medium text-stone-700">코드가 아직 없으신가요?</strong> 인증코드를 비워두셔도 <strong className="text-stone-700">무료 샘플 모드</strong>로 모든 화면을 자유롭게 제작 및 실시간 테스트하실 수 있습니다. (마음에 드실 때 언제든 정식 전환 가능)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 고정 플로팅 액션 바 */}
          <div className="sticky bottom-6 z-30 bg-white/90 backdrop-blur-xl p-3.5 sm:p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-stone-200/80 flex gap-3 items-center">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="flex-1 py-4 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              <span>실시간 미리보기</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-2 py-4 px-6 bg-stone-900 hover:bg-black disabled:bg-stone-400 text-white rounded-xl text-xs sm:text-sm font-medium tracking-wide transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{submitting ? '청첩장 생성 처리 중...' : '청첩장 제작 신청하기'}</span>
              <span className="text-xs font-mono opacity-60">→</span>
            </button>
          </div>

          {uploadStatus && (
            <p className="text-center text-xs font-mono text-stone-500 animate-pulse py-2">
              {uploadStatus}
            </p>
          )}

        </form>

      </div>

      {/* 실시간 미리보기 모달 */}
      {showPreviewModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div 
            className="bg-white w-full max-w-[430px] h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col border border-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 미리보기 상단 헤더 */}
            <div className="py-3 px-5 bg-stone-950 text-white flex items-center justify-between shrink-0 border-b border-stone-800">
              <span className="text-xs font-mono tracking-widest uppercase text-stone-300">
                LIVE PREVIEW — WEDDING CARD
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-stone-400 hover:text-white text-base leading-none cursor-pointer w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 실제 청첩장 템플릿 렌더링 */}
            <div className="flex-1 overflow-y-auto relative bg-[#FCFBF7]">
              <BgmPlayer
                bgmUrl={previewInvitation.bgm_url}
                hasIntro={previewInvitation?.template_config?.show_intro !== false}
              />
              {previewInvitation?.template_type === 'editorial' ? (
                <EditorialTemplate invitation={previewInvitation} />
              ) : (
                <BasicTemplate invitation={previewInvitation} />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
