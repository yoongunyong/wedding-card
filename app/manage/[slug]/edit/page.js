'use client';

import { useState, useEffect, useRef, useMemo, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BasicTemplate from '@/components/templates/basic/BasicTemplate';
import EditorialTemplate from '@/components/templates/editorial/EditorialTemplate';
import PlaylistTemplate from '@/components/templates/playlist/PlaylistTemplate';
import CinematicTemplate from '@/components/templates/cinematic/CinematicTemplate';
import BgmPlayer from '@/components/BgmPlayer';
import { compressImage } from '@/lib/imageCompressor';

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

export default function EditInvitationPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  // 권한 및 로딩 상태
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [originalCard, setOriginalCard] = useState(null);

  // 1. 기본 폼 상태
  const [formData, setFormData] = useState({
    template_type: 'editorial',
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
  });

  // 2. 다중 계좌 상태
  const [groomAccounts, setGroomAccounts] = useState([]);
  const [brideAccounts, setBrideAccounts] = useState([]);

  // 3. 교통편 상세 안내 목록 (오시는 길)
  const [transportationList, setTransportationList] = useState([]);

  // 4. 동적 정보 카드 리스트 (INFORMATION)
  const [infoCards, setInfoCards] = useState([]);

  // 5. 이미지 파일 및 프리뷰 상태 (새 파일 선택 시 File 객체, 미변경 시 null)
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

  // 갤러리 이미지: 기존 URL과 새 File을 함께 관리
  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]);
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState([]);

  // 이미지 파일 인풋 DOM 참조 (네이티브 브라우저 UI 숨김 및 파일 리셋용)
  const mainImageInputRef = useRef(null);
  const coverImageInputRef = useRef(null);
  const coupleImageInputRef = useRef(null);
  const endingImageInputRef = useRef(null);
  const groomPhotoInputRef = useRef(null);
  const bridePhotoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // BGM (배경음악) 상태
  const [bgmMode, setBgmMode] = useState('preset');
  const [bgmPresetUrl, setBgmPresetUrl] = useState(BGM_OPTIONS[0].url);
  const [customBgmFile, setCustomBgmFile] = useState(null);
  const [customBgmFileName, setCustomBgmFileName] = useState('');
  const [customBgmFileSize, setCustomBgmFileSize] = useState('');
  const [customBgmPreviewUrl, setCustomBgmPreviewUrl] = useState('');
  const [customBgmUrl, setCustomBgmUrl] = useState('');
  const bgmFileInputRef = useRef(null);

  // 저장 처리 상태
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const isClosingRef = useRef(false);

  // 초기 DB 데이터 로드 및 폼 매핑
  useEffect(() => {
    async function fetchInvitationData() {
      if (!token) {
        setLoading(false);
        return;
      }

      const { data: card, error: err } = await supabase
        .from('invitations')
        .select('*')
        .eq('slug', slug)
        .eq('manage_token', token)
        .single();

      if (err || !card) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setOriginalCard(card);
      setAuthorized(true);

      // 예식 일시 분리 (YYYY-MM-DD / HH:mm)
      let wDate = '';
      let wTime = '14:00';
      if (card.wedding_date) {
        const parts = card.wedding_date.split('T');
        wDate = parts[0] || '';
        if (parts[1]) {
          wTime = parts[1].slice(0, 5);
        }
      }

      const config = card.template_config || {};

      // 기본 폼 상태 초기화
      setFormData({
        template_type: card.template_type || 'basic',
        slug: card.slug,
        groom_name: card.groom_name || '',
        groom_name_en: card.groom_name_en || '',
        groom_first_name_en: card.groom_first_name_en || '',
        groom_last_name_en: card.groom_last_name_en || '',
        groom_phone: card.groom_phone || '',
        groom_relation: card.groom_relation || config.groom_relation || '장남',
        groom_father: card.groom_father || '',
        groom_father_phone: card.groom_father_phone || '',
        groom_father_deceased: Boolean(card.groom_father_deceased ?? config.groom_father_deceased),
        groom_mother: card.groom_mother || '',
        groom_mother_phone: card.groom_mother_phone || '',
        groom_mother_deceased: Boolean(card.groom_mother_deceased ?? config.groom_mother_deceased),

        bride_name: card.bride_name || '',
        bride_name_en: card.bride_name_en || '',
        bride_first_name_en: card.bride_first_name_en || '',
        bride_last_name_en: card.bride_last_name_en || '',
        bride_phone: card.bride_phone || '',
        bride_relation: card.bride_relation || config.bride_relation || '장녀',
        bride_father: card.bride_father || '',
        bride_father_phone: card.bride_father_phone || '',
        bride_father_deceased: Boolean(card.bride_father_deceased ?? config.bride_father_deceased),
        bride_mother: card.bride_mother || '',
        bride_mother_phone: card.bride_mother_phone || '',
        bride_mother_deceased: Boolean(card.bride_mother_deceased ?? config.bride_mother_deceased),

        wedding_date: wDate,
        wedding_time: wTime,
        venue_name: card.venue_name || '',
        venue_hall: card.venue_hall || config.venue_hall || '',
        venue_address: card.venue_address || '',
        venue_detail: card.venue_detail || '',

        message_title: card.message_title || '새로운 시작의 날',
        message: card.message || GREETING_PRESETS[0].content,

        show_quote_section: config.show_quote_section !== false,
        quote_content: card.quote_content || config.quote_content || QUOTE_PRESETS[0].content,
        quote_source: card.quote_source || config.quote_source || QUOTE_PRESETS[0].source,

        bgm_url: card.bgm_url || BGM_OPTIONS[0].url,
        title_color: config.title_color || '#E5A866',

        show_intro: config.show_intro !== false,
        show_countdown: config.show_countdown !== false,
        show_gallery: config.show_gallery !== false,
        show_accounts: config.show_accounts !== false,
        show_rsvp: config.show_rsvp !== false,
        show_guestbook: config.show_guestbook !== false,
      });

      // 계좌 분리
      const rawAccounts = card.accounts || [];
      const gAccounts = rawAccounts
        .filter((a) => a.group === '신랑측' || a.side === 'groom')
        .map((a) => ({
          group: '신랑측',
          title: a.title || '신랑',
          bank: a.bank || '국민',
          number: a.account_number || a.number || '',
          holder: a.holder || '',
        }));
      const bAccounts = rawAccounts
        .filter((a) => a.group === '신부측' || a.side === 'bride')
        .map((a) => ({
          group: '신부측',
          title: a.title || '신부',
          bank: a.bank || '카카오뱅크',
          number: a.account_number || a.number || '',
          holder: a.holder || '',
        }));

      setGroomAccounts(
        gAccounts.length > 0
          ? gAccounts
          : [{ group: '신랑측', title: '신랑', bank: '국민', number: '', holder: '' }]
      );
      setBrideAccounts(
        bAccounts.length > 0
          ? bAccounts
          : [{ group: '신부측', title: '신부', bank: '카카오뱅크', number: '', holder: '' }]
      );

      // 교통편
      const rawTrans = card.transportation || [];
      if (rawTrans.length > 0) {
        setTransportationList(rawTrans);
      } else {
        setTransportationList([
          { type: 'subway', title: '지하철', content: '' },
          { type: 'bus', title: '버스', content: '' },
          { type: 'car', title: '자차 / 내비게이션', content: '내비게이션 검색창에 예식장 이름 또는 주소를 검색하시면 편리하게 오실 수 있습니다.' },
          { type: 'parking', title: '주차안내', content: '건물 내 주차장을 이용하실 수 있습니다.' },
        ]);
      }

      // 안내 카드
      const rawCards = card.info_notices || [];
      if (rawCards.length > 0) {
        setInfoCards(rawCards);
      } else {
        setInfoCards([
          { title: '식사 안내', subtitle: '', content: '정성껏 준비한 피로연 식사가 마련되어 있습니다.\n편안하게 오셔서 식사를 즐겨주시기 바랍니다.' },
          { title: '화환 안내', subtitle: '', content: '화환은 정중히 사양하오니 너른 양해 부탁드립니다.' },
        ]);
      }

      // 이미지 프리뷰 초기화
      const imgs = card.images || {};
      setMainImagePreview(imgs.main || card.main_image || '');
      setCoverImagePreview(imgs.cover || '');
      setCoupleImagePreview(imgs.couple_profile || '');
      setEndingImagePreview(imgs.ending || card.ending_image || '');
      setBridePhotoPreview(imgs.bride_profile || card.bride_photo || '');
      setGroomPhotoPreview(imgs.groom_profile || card.groom_photo || '');

      // 갤러리 이미지
      const rawGallery = card.gallery_images || [];
      setExistingGalleryUrls(Array.isArray(rawGallery) ? rawGallery : []);

      // BGM
      if (card.bgm_mode === 'custom') {
        setBgmMode('url');
        setCustomBgmUrl(card.bgm_url || '');
      } else if (card.bgm_mode === 'none' || !card.bgm_url) {
        setBgmMode('none');
      } else {
        setBgmMode('preset');
        setBgmPresetUrl(card.bgm_url);
      }

      setLoading(false);
    }

    fetchInvitationData();
  }, [slug, token]);

  // 실시간 미리보기 모달 열기 (히스토리 푸시 및 최상단 스크롤 리셋)
  const openPreviewModal = () => {
    isClosingRef.current = false;
    setShowPreviewModal(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({ weddingCardPreview: true }, '');
      requestAnimationFrame(() => {
        const previewContainer = document.getElementById('preview-scroll-container');
        if (previewContainer) {
          previewContainer.scrollTop = 0;
        }
      });
    }
  };

  // 실시간 미리보기 모달 닫기
  const closePreviewModal = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    setShowPreviewModal(false);
    if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (window.history.state?.weddingCardPreview) {
        window.history.back();
      }
    }
  };

  // 뒤로가기(popstate) 및 ESC 키 감지
  useEffect(() => {
    if (!showPreviewModal) return;

    document.body.style.overflow = 'hidden';

    const handlePopState = () => {
      isClosingRef.current = false;
      setShowPreviewModal(false);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closePreviewModal(e);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPreviewModal]);

  // 폼 입력값 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 단일 이미지 삭제 (클린 리셋)
  const handleClearSingleImage = (setFile, setPreview, inputRef) => {
    setFile(null);
    setPreview('');
    if (inputRef?.current) {
      inputRef.current.value = '';
    }
  };

  // 이미지 유효성 검증 및 초고화질 자동 압축 상태 저장
  const validateAndSetImage = async (file, setFile, setPreview, label = '사진', inputRef = null) => {
    if (!file) {
      if (inputRef?.current) inputRef.current.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      if (inputRef?.current) inputRef.current.value = '';
      return alert(`${label}은(는) 이미지 파일(JPG, PNG, WEBP 등)만 등록하실 수 있습니다.`);
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 30) {
      if (inputRef?.current) inputRef.current.value = '';
      return alert(`${label} 파일 용량이 너무 큽니다 (${sizeMb.toFixed(1)}MB). 30MB 이하의 이미지를 선택해 주세요.`);
    }

    try {
      // 스튜디오 원본 초고용량 이미지 브라우저 무손실 경량 최적화
      const optimizedFile = await compressImage(file);
      setFile(optimizedFile);
      setPreview(URL.createObjectURL(optimizedFile));
    } catch {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
    // 동일한 파일 재선택 가능하도록 input value 리셋
    if (inputRef?.current) {
      inputRef.current.value = '';
    }
  };

  // 갤러리 이미지 추가 / 삭제 (자동 압축 포함 & 파일 인풋 즉시 리셋)
  const handleNewGalleryImagesChange = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;
    e.target.value = '';

    const validFiles = rawFiles.filter((f) => {
      if (!f.type.startsWith('image/')) {
        alert(`${f.name} 파일은 이미지가 아니므로 제외되었습니다.`);
        return false;
      }
      if (f.size > 30 * 1024 * 1024) {
        alert(`${f.name} 파일 용량이 30MB를 초과하여 제외되었습니다.`);
        return false;
      }
      return true;
    });

    const currentTotal = existingGalleryUrls.length + newGalleryPreviews.length;
    const totalAllowed = 20 - currentTotal;
    if (validFiles.length > totalAllowed) {
      alert(`갤러리 사진은 최대 20장까지 등록 가능합니다. (현재 등록된 사진 ${currentTotal}장)`);
    }

    const slicedFiles = validFiles.slice(0, Math.max(0, totalAllowed));
    if (slicedFiles.length > 0) {
      const optimizedFiles = await Promise.all(
        slicedFiles.map((file) => compressImage(file))
      );
      setNewGalleryFiles((prev) => [...prev, ...optimizedFiles]);
      const newPreviews = optimizedFiles.map((f) => URL.createObjectURL(f));
      setNewGalleryPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeExistingGalleryUrl = (index) => {
    setExistingGalleryUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeNewGalleryImage = (index) => {
    setNewGalleryFiles((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 0 && galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
      return next;
    });
    setNewGalleryPreviews((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 0 && galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
      return next;
    });
  };

  const clearAllGalleryImages = () => {
    setExistingGalleryUrls([]);
    setNewGalleryFiles([]);
    setNewGalleryPreviews([]);
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  // 계좌 제어
  const addGroomAccount = () => {
    setGroomAccounts((prev) => [
      ...prev,
      { group: '신랑측', title: '신랑', bank: '국민', number: '', holder: '' },
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
      { group: '신부측', title: '신부', bank: '카카오뱅크', number: '', holder: '' },
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

  // BGM 오디오 파일 변경 핸들러
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

  // 파일 업로드 헬퍼
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
    const groomName = formData.groom_name.trim();
    const brideName = formData.bride_name.trim();

    const groomFirst = (formData.groom_first_name_en || '').trim() || (formData.groom_name_en || '').trim().split(' ')[0] || (formData.groom_name_en || '').trim();
    const groomLast = (formData.groom_last_name_en || '').trim() || (formData.groom_name_en || '').trim().split(' ').slice(1).join(' ') || '';
    const brideFirst = (formData.bride_first_name_en || '').trim() || (formData.bride_name_en || '').trim().split(' ')[0] || (formData.bride_name_en || '').trim();
    const brideLast = (formData.bride_last_name_en || '').trim() || (formData.bride_name_en || '').trim().split(' ').slice(1).join(' ') || '';

    const mainNamesEn = (groomFirst && brideFirst)
      ? `${groomFirst} & ${brideFirst}`
      : (formData.groom_name_en && formData.bride_name_en ? `${formData.groom_name_en.trim()} & ${formData.bride_name_en.trim()}` : (groomFirst || brideFirst || ''));

    const allAccounts = [
      ...groomAccounts.filter((a) => a.number && a.number.trim()).map((a) => ({
        group: '신랑측',
        title: a.title,
        bank: a.bank,
        account_number: a.number,
        number: a.number,
        holder: a.holder || (a.title === '신랑' ? groomName : ''),
        name: a.holder ? `${a.title} ${a.holder}` : a.title,
      })),
      ...brideAccounts.filter((a) => a.number && a.number.trim()).map((a) => ({
        group: '신부측',
        title: a.title,
        bank: a.bank,
        account_number: a.number,
        number: a.number,
        holder: a.holder || (a.title === '신부' ? brideName : ''),
        name: a.holder ? `${a.title} ${a.holder}` : a.title,
      })),
    ];

    const currentGalleryPreviews = [...existingGalleryUrls, ...newGalleryPreviews];

    return {
      groom_name: groomName,
      bride_name: brideName,
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
        bride_profile: bridePhotoPreview || '',
        groom_profile: groomPhotoPreview || '',
      },
      gallery_images: currentGalleryPreviews,
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
    existingGalleryUrls,
    newGalleryPreviews,
    bgmMode,
    bgmPresetUrl,
    customBgmPreviewUrl,
    customBgmUrl,
  ]);

  // 수정사항 저장 (UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.groom_name.trim() || !formData.bride_name.trim()) {
      return alert('신랑과 신부 성함을 모두 입력해 주세요.');
    }
    if (!formData.wedding_date) {
      return alert('예식 날짜를 선택해 주세요.');
    }
    if (!formData.wedding_time) {
      return alert('예식 시간을 선택해 주세요.');
    }
    if (!formData.venue_name.trim()) {
      return alert('예식장 이름을 입력해 주세요.');
    }
    if (!formData.venue_address.trim()) {
      return alert('예식장 주소를 입력해 주세요.');
    }
    if (!mainImagePreview) {
      return alert('청첩장 첫 화면에 노출될 메인 대표 사진을 등록해 주세요.');
    }
    if (bgmMode === 'url' && customBgmUrl.trim()) {
      if (!/^https?:\/\//i.test(customBgmUrl.trim())) {
        return alert('음원 링크는 http:// 또는 https:// 로 시작하는 올바른 웹 주소여야 합니다.');
      }
    }

    setSubmitting(true);
    setUploadStatus('수정된 사진 및 데이터를 업로드하고 있습니다...');

    try {
      // 1. 새 이미지 파일 업로드 (선택된 파일만 새로 업로드, 기존 파일은 URL 유지)
      let finalMainUrl = mainImagePreview;
      if (mainImageFile) {
        setUploadStatus('대표 메인 사진을 업로드하고 있습니다...');
        const u = await uploadFileToStorage(mainImageFile, `${slug}/main`);
        if (u) finalMainUrl = u;
      }

      let finalCoverUrl = coverImagePreview;
      if (coverImageFile) {
        setUploadStatus('인트로 커버 사진을 업로드하고 있습니다...');
        const u = await uploadFileToStorage(coverImageFile, `${slug}/cover`);
        if (u) finalCoverUrl = u;
      }

      let finalCoupleUrl = coupleImagePreview;
      if (coupleImageFile) {
        setUploadStatus('커플 화보 사진을 업로드하고 있습니다...');
        const u = await uploadFileToStorage(coupleImageFile, `${slug}/couple`);
        if (u) finalCoupleUrl = u;
      }

      let finalEndingUrl = endingImagePreview;
      if (endingImageFile) {
        setUploadStatus('엔딩 감사 사진을 업로드하고 있습니다...');
        const u = await uploadFileToStorage(endingImageFile, `${slug}/ending`);
        if (u) finalEndingUrl = u;
      }

      let finalGroomUrl = groomPhotoPreview;
      if (groomPhotoFile) {
        setUploadStatus('신랑 단독 사진을 업로드하고 있습니다...');
        const u = await uploadFileToStorage(groomPhotoFile, `${slug}/groom_profile`);
        if (u) finalGroomUrl = u;
      }

      let finalBrideUrl = bridePhotoPreview;
      if (bridePhotoFile) {
        setUploadStatus('신부 단독 사진을 업로드하고 있습니다...');
        const u = await uploadFileToStorage(bridePhotoFile, `${slug}/bride_profile`);
        if (u) finalBrideUrl = u;
      }

      // 2. 갤러리 이미지 합산 (기존 유지된 URL + 새로 업로드된 URL)
      const newlyUploadedGalleryUrls = [];
      if (newGalleryFiles.length > 0) {
        setUploadStatus('새로 추가된 갤러리 사진들을 업로드하고 있습니다...');
        for (let i = 0; i < newGalleryFiles.length; i++) {
          const u = await uploadFileToStorage(newGalleryFiles[i], `${slug}/gallery_new_${Date.now()}_${i + 1}`);
          if (u) newlyUploadedGalleryUrls.push(u);
        }
      }
      const finalGalleryImages = [...existingGalleryUrls, ...newlyUploadedGalleryUrls];

      // 3. BGM 음원 처리
      let finalBgmUrl = formData.bgm_url;
      let finalBgmMode = 'none';

      if (bgmMode === 'preset') {
        finalBgmUrl = bgmPresetUrl || '';
        finalBgmMode = finalBgmUrl ? 'preset' : 'none';
      } else if (bgmMode === 'file') {
        if (customBgmFile) {
          setUploadStatus('배경음악(BGM) 음원 파일을 업로드하고 있습니다...');
          let uploadedBgm = await uploadFileToStorage(customBgmFile, `${slug}/bgm_custom`, 'bgm');
          if (!uploadedBgm) {
            uploadedBgm = await uploadFileToStorage(customBgmFile, `${slug}/bgm_custom`, 'wedding-images');
          }
          if (uploadedBgm) {
            finalBgmUrl = uploadedBgm;
            finalBgmMode = 'custom';
          }
        }
      } else if (bgmMode === 'url') {
        finalBgmUrl = customBgmUrl.trim();
        finalBgmMode = finalBgmUrl ? 'custom' : 'none';
      } else if (bgmMode === 'none') {
        finalBgmUrl = '';
        finalBgmMode = 'none';
      }

      setUploadStatus('청첩장 수정 내용을 데이터베이스에 안전하게 반영하고 있습니다...');

      // 4. 계좌 통합 리스트
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

      // 5. 영문 이름 계산
      const gf = formData.groom_first_name_en.trim() || formData.groom_name_en.trim().split(' ')[0] || formData.groom_name_en.trim();
      const bf = formData.bride_first_name_en.trim() || formData.bride_name_en.trim().split(' ')[0] || formData.bride_name_en.trim();
      const mainNamesEn = (gf && bf)
        ? `${gf} & ${bf}`
        : (formData.groom_name_en.trim() && formData.bride_name_en.trim() ? `${formData.groom_name_en.trim()} & ${formData.bride_name_en.trim()}` : '');

      // 6. DB UPDATE 객체 생성 (기존 slug와 manage_token은 절대 유지)
      const updatePayload = {
        groom_name: formData.groom_name.trim(),
        bride_name: formData.bride_name.trim(),
        groom_name_en: formData.groom_name_en.trim(),
        bride_name_en: formData.bride_name_en.trim(),
        main_names_en: mainNamesEn,
        groom_first_name_en: gf,
        groom_last_name_en: formData.groom_last_name_en.trim() || formData.groom_name_en.trim().split(' ').slice(1).join(' ') || '',
        bride_first_name_en: bf,
        bride_last_name_en: formData.bride_last_name_en.trim() || formData.bride_name_en.trim().split(' ').slice(1).join(' ') || '',

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

        message: formData.message.trim(),
        quote_content: formData.show_quote_section ? formData.quote_content.trim() : '',
        quote_source: formData.show_quote_section ? formData.quote_source.trim() : '',

        images: {
          main: finalMainUrl || '',
          cover: finalCoverUrl || finalMainUrl || '',
          couple_profile: finalCoupleUrl || finalMainUrl || '',
          ending: finalEndingUrl || finalMainUrl || '',
          groom_profile: finalGroomUrl || '',
          bride_profile: finalBrideUrl || '',
        },
        gallery_images: finalGalleryImages,
        accounts: allAccounts,
        transportation: transportationList.filter((t) => t.title.trim() && t.content.trim()),
        info_notices: infoCards.filter((c) => c.title.trim() && c.content.trim()),

        bgm_url: finalBgmUrl,
        bgm_mode: finalBgmMode,
        template_type: formData.template_type || 'basic',

        template_config: {
          ...(originalCard?.template_config || {}),
          title_color: formData.title_color,
          show_intro: formData.show_intro,
          show_countdown: formData.show_countdown,
          show_gallery: formData.show_gallery,
          show_accounts: formData.show_accounts,
          show_rsvp: formData.show_rsvp,
          show_guestbook: formData.show_guestbook,
          show_quote_section: formData.show_quote_section,
          groom_relation: formData.groom_relation,
          bride_relation: formData.bride_relation,
          groom_father_deceased: formData.groom_father_deceased,
          groom_mother_deceased: formData.groom_mother_deceased,
          bride_father_deceased: formData.bride_father_deceased,
          bride_mother_deceased: formData.bride_mother_deceased,
          venue_hall: formData.venue_hall,
        },
      };

      const { error: updateErr } = await supabase
        .from('invitations')
        .update(updatePayload)
        .eq('slug', slug)
        .eq('manage_token', token);

      if (updateErr) {
        throw updateErr;
      }

      setSubmitting(false);
      setUploadStatus('');
      alert('청첩장 정보가 성공적으로 수정되었습니다! 🎉\n하객용 청첩장 링크에 즉시 변경사항이 반영되었습니다.');
      router.push(`/manage/${slug}?token=${token}`);
    } catch (err) {
      console.error('Update error:', err);
      setSubmitting(false);
      setUploadStatus('');
      alert('청첩장 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] text-stone-500 text-sm font-sans">
        청첩장 기존 데이터를 불러오고 있습니다...
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F5F2] p-6 text-center font-sans">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="text-lg font-bold text-stone-900 mb-1">수정 권한이 없습니다</h1>
        <p className="text-xs text-stone-500 mb-6">
          올바른 관리용 보안 토큰 링크로 접속해 주세요.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-stone-900 text-white text-xs rounded-xl"
        >
          홈으로 이동
        </Link>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#F6F5F2] py-10 px-4 sm:px-6 flex justify-center text-stone-900 font-sans selection:bg-stone-200 antialiased"
      style={{ colorScheme: 'light' }}
    >
      <div className="w-full max-w-[740px]">

        {/* 상단 네비게이션 바 */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-stone-200/80">
          <Link
            href={`/manage/${slug}?token=${token}`}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors cursor-pointer"
          >
            <span>←</span>
            <span>관리 대시보드로 돌아가기</span>
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-medium"
            >
              <span>청첩장 바로보기</span>
              <span className="text-[10px]">↗</span>
            </a>
          </div>
        </div>

        {/* 헤더 안내 */}
        <div className="text-center mb-10">
          <span className="text-[11px] font-mono tracking-[0.25em] text-stone-400 uppercase font-medium">
            LIVE EDIT MODE
          </span>
          <h1 className="text-2xl sm:text-[28px] font-serif tracking-tight text-stone-900 font-normal mt-2 mb-2">
            청첩장 정보 & 사진 수정하기
          </h1>
          <p className="text-xs sm:text-[13px] text-stone-500 font-light leading-relaxed max-w-md mx-auto break-keep">
            기존에 전달하신 URL 주소는 그대로 유지되며,<br />
            수정하신 모든 내용과 사진은 하객용 청첩장에 즉시 실시간으로 반영됩니다.
          </p>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="space-y-8 pb-28 sm:pb-36">

          {/* 00. 디자인 템플릿 변경 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">00</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  디자인 시안 변경
                </h2>
              </div>
            </div>

            <p className="text-xs text-stone-500 mb-4 bg-stone-50 p-3 rounded-xl border border-stone-100 leading-relaxed">
              💡 <strong>시안을 변경하셔도 청첩장 영문 주소(URL)와 종이 QR코드는 100% 그대로 유지됩니다.</strong><br />
              시안마다 사진 연출(봉투 오프닝 vs 화보 룩북)이 다르므로, 시안을 바꾸신 후 하단의 <strong>[👁️ 실시간 미리보기]</strong>로 전체적인 느낌을 확인해 보세요.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setFormData((prev) => ({ ...prev, template_type: 'basic' }))}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  formData.template_type === 'basic'
                    ? 'border-stone-900 bg-stone-50/50 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-stone-400 tracking-widest">OPTION 01</span>
                  {formData.template_type === 'basic' && (
                    <span className="w-2 h-2 rounded-full bg-stone-900" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mb-1">모던 클래식 (Modern)</h3>
                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  편지 봉투 오프닝 카드 & 크림 베이지 톤의 정갈하고 따뜻한 시안
                </p>
              </div>

              <div
                onClick={() => setFormData((prev) => ({ ...prev, template_type: 'editorial' }))}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  formData.template_type === 'editorial'
                    ? 'border-stone-900 bg-stone-50/50 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-stone-400 tracking-widest">OPTION 02</span>
                  {formData.template_type === 'editorial' && (
                    <span className="w-2 h-2 rounded-full bg-stone-900" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mb-1">에디토리얼 (Editorial)</h3>
                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  패션 매거진 룩북 인트로 & 감각적인 세리프 타이포그래피 시안
                </p>
              </div>

              <div
                onClick={() => setFormData((prev) => ({ ...prev, template_type: 'playlist' }))}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  formData.template_type === 'playlist'
                    ? 'border-emerald-700 bg-emerald-50/40 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-emerald-700 font-semibold tracking-widest">OPTION 03</span>
                  {formData.template_type === 'playlist' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-700" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mb-1">플레이리스트 (Playlist)</h3>
                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  포레스트 그린 & 빈티지 폴라로이드, 뮤직 플레이어 위젯 시안
                </p>
              </div>

              <div
                onClick={() => setFormData((prev) => ({ ...prev, template_type: 'cinematic' }))}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  formData.template_type === 'cinematic'
                    ? 'border-black bg-stone-100/70 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-black font-semibold tracking-widest">OPTION 04 · NEW</span>
                  {formData.template_type === 'cinematic' && (
                    <span className="w-2 h-2 rounded-full bg-black" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mb-1">시네마틱 (Cinematic)</h3>
                <p className="text-xs text-stone-500 font-light leading-relaxed">
                  ☀️ Day / 🌙 Night 듀얼 테마 & 흑백 모노크롬 인물 스냅 시안
                </p>
              </div>
            </div>
          </div>

          {/* 01. 신랑 & 신부 인적사항 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">01</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  신랑 & 신부 정보
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              {/* 신랑 정보 */}
              <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-stone-800" />
                  <span className="text-xs font-mono text-stone-700 tracking-wider uppercase font-semibold">
                    GROOM INFO
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3.5">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">신랑 성함 *</label>
                    <input
                      type="text"
                      name="groom_name"
                      required
                      value={formData.groom_name}
                      onChange={handleChange}
                      placeholder="예: 이도현"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">신랑 영문 이름</label>
                    <input
                      type="text"
                      name="groom_name_en"
                      value={formData.groom_name_en}
                      onChange={handleChange}
                      placeholder="예: Dohyun Lee"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
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
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                    />
                  </div>
                </div>

                {/* 신랑 부모님 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-stone-200/60">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-stone-700">아버지 성함</label>
                      <label className="flex items-center gap-1 text-[11px] text-stone-500 cursor-pointer">
                        <input
                          type="checkbox"
                          name="groom_father_deceased"
                          checked={formData.groom_father_deceased}
                          onChange={handleChange}
                          className="rounded text-stone-900"
                        />
                        <span>故 (작고)</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="groom_father"
                        value={formData.groom_father}
                        onChange={handleChange}
                        placeholder="성함"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                      />
                      <input
                        type="tel"
                        name="groom_father_phone"
                        disabled={formData.groom_father_deceased}
                        value={formData.groom_father_phone}
                        onChange={handleChange}
                        placeholder="연락처"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 disabled:bg-stone-100 disabled:text-stone-400 focus:outline-hidden focus:border-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-stone-700">어머니 성함</label>
                      <label className="flex items-center gap-1 text-[11px] text-stone-500 cursor-pointer">
                        <input
                          type="checkbox"
                          name="groom_mother_deceased"
                          checked={formData.groom_mother_deceased}
                          onChange={handleChange}
                          className="rounded text-stone-900"
                        />
                        <span>故 (작고)</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="groom_mother"
                        value={formData.groom_mother}
                        onChange={handleChange}
                        placeholder="성함"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                      />
                      <input
                        type="tel"
                        name="groom_mother_phone"
                        disabled={formData.groom_mother_deceased}
                        value={formData.groom_mother_phone}
                        onChange={handleChange}
                        placeholder="연락처"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 disabled:bg-stone-100 disabled:text-stone-400 focus:outline-hidden focus:border-stone-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 신부 정보 */}
              <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-xs font-mono text-stone-700 tracking-wider uppercase font-semibold">
                    BRIDE INFO
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3.5">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">신부 성함 *</label>
                    <input
                      type="text"
                      name="bride_name"
                      required
                      value={formData.bride_name}
                      onChange={handleChange}
                      placeholder="예: 임지연"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1.5">신부 영문 이름</label>
                    <input
                      type="text"
                      name="bride_name_en"
                      value={formData.bride_name_en}
                      onChange={handleChange}
                      placeholder="예: Jiyeon Lim"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
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
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                    />
                  </div>
                </div>

                {/* 신부 부모님 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-stone-200/60">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-stone-700">아버지 성함</label>
                      <label className="flex items-center gap-1 text-[11px] text-stone-500 cursor-pointer">
                        <input
                          type="checkbox"
                          name="bride_father_deceased"
                          checked={formData.bride_father_deceased}
                          onChange={handleChange}
                          className="rounded text-stone-900"
                        />
                        <span>故 (작고)</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="bride_father"
                        value={formData.bride_father}
                        onChange={handleChange}
                        placeholder="성함"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                      />
                      <input
                        type="tel"
                        name="bride_father_phone"
                        disabled={formData.bride_father_deceased}
                        value={formData.bride_father_phone}
                        onChange={handleChange}
                        placeholder="연락처"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 disabled:bg-stone-100 disabled:text-stone-400 focus:outline-hidden focus:border-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-stone-700">어머니 성함</label>
                      <label className="flex items-center gap-1 text-[11px] text-stone-500 cursor-pointer">
                        <input
                          type="checkbox"
                          name="bride_mother_deceased"
                          checked={formData.bride_mother_deceased}
                          onChange={handleChange}
                          className="rounded text-stone-900"
                        />
                        <span>故 (작고)</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="bride_mother"
                        value={formData.bride_mother}
                        onChange={handleChange}
                        placeholder="성함"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                      />
                      <input
                        type="tel"
                        name="bride_mother_phone"
                        disabled={formData.bride_mother_deceased}
                        value={formData.bride_mother_phone}
                        onChange={handleChange}
                        placeholder="연락처"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 disabled:bg-stone-100 disabled:text-stone-400 focus:outline-hidden focus:border-stone-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 02. 예식 일시 및 장소 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">02</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  예식 일시 및 장소
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">예식 날짜 *</label>
                  <input
                    type="date"
                    name="wedding_date"
                    required
                    value={formData.wedding_date}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">예식 시간 *</label>
                  <input
                    type="time"
                    name="wedding_time"
                    required
                    value={formData.wedding_time}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">예식장 이름 *</label>
                  <input
                    type="text"
                    name="venue_name"
                    required
                    value={formData.venue_name}
                    onChange={handleChange}
                    placeholder="예: 아펠가모 반포"
                    className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">홀 이름 / 층수</label>
                  <input
                    type="text"
                    name="venue_hall"
                    value={formData.venue_hall}
                    onChange={handleChange}
                    placeholder="예: 단독홀 LL층"
                    className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">예식장 주소 (지도 검색용) *</label>
                <input
                  type="text"
                  name="venue_address"
                  required
                  value={formData.venue_address}
                  onChange={handleChange}
                  placeholder="예: 서울 서초구 반포대로 235"
                  className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">오시는 길 추가 안내 (지하철 출구 등)</label>
                <input
                  type="text"
                  name="venue_detail"
                  value={formData.venue_detail}
                  onChange={handleChange}
                  placeholder="예: 고속터미널역 3번 출구 도보 5분"
                  className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                />
              </div>
            </div>
          </div>

          {/* 03. 초대 문구 & 영화 대사 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">03</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  초대 문구 및 감성 글귀
                </h2>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-2">모시는 말씀 (초대글)</label>
                <textarea
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full p-4 bg-[#FAFAF9] border border-stone-200 rounded-2xl text-xs text-stone-800 leading-relaxed focus:outline-hidden focus:border-stone-900 font-sans"
                />
              </div>

              <div className="pt-4 border-t border-stone-100">
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="show_quote_section"
                    checked={formData.show_quote_section}
                    onChange={handleChange}
                    className="rounded text-stone-900"
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    영화 대사 / 시 구절 섹션 표시
                  </span>
                </label>

                {formData.show_quote_section && (
                  <div className="space-y-3 pl-6 border-l-2 border-stone-200">
                    <textarea
                      name="quote_content"
                      rows={3}
                      value={formData.quote_content}
                      onChange={handleChange}
                      placeholder="감성 글귀 내용"
                      className="w-full p-3.5 bg-[#FAFAF9] border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:border-stone-900 font-sans leading-relaxed"
                    />
                    <input
                      type="text"
                      name="quote_source"
                      value={formData.quote_source}
                      onChange={handleChange}
                      placeholder="출처 (예: 영화 <연애의 온도>)"
                      className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:border-stone-900"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 04. 웨딩 사진 교체 및 갤러리 관리 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">04</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  웨딩 사진 관리 및 교체
                </h2>
              </div>
            </div>

            <div className="space-y-5">
              {/* 메인 풀스크린 사진 */}
              <div className="p-4.5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-800">
                    본문 메인 대표 풀스크린 사진 <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-700 bg-stone-200/70 px-2 py-0.5 rounded-full font-medium">
                    MAIN
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mb-3 font-light">
                  청첩장 본문 첫 화면의 대표 풀스크린 사진입니다. (새 파일을 선택하지 않으시면 기존 사진이 유지됩니다)
                </p>
                <input
                  ref={mainImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => validateAndSetImage(e.target.files?.[0], setMainImageFile, setMainImagePreview, '메인 사진', mainImageInputRef)}
                  className="hidden"
                />
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-22 bg-white rounded-xl overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center shadow-xs">
                    {mainImagePreview ? (
                      <img src={mainImagePreview} alt="Main" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-300 p-1 text-center">
                        <svg className="w-5 h-5 mb-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[9px] font-mono font-medium">MAIN</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {mainImagePreview ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>사진 등록 완료</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => mainImageInputRef.current?.click()}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            사진 변경
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClearSingleImage(setMainImageFile, setMainImagePreview, mainImageInputRef)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 text-xs font-medium rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                          >
                            <span>✕</span>
                            <span>삭제</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          onClick={() => mainImageInputRef.current?.click()}
                          className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>+</span>
                          <span>메인 사진 선택하기</span>
                        </button>
                        <p className="text-[10px] text-stone-400 mt-1 font-light">JPG, PNG 등 고화질 이미지 (최대 30MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 인트로 커버 사진 (시안 1 & 시안 2 공통) */}
              {(formData.template_type === 'basic' || formData.template_type === 'editorial') && (
                <div className="p-4.5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-800">
                      인트로 커버 사진 (선택)
                    </label>
                    <span className="text-[10px] font-mono text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded-full">
                      OPTION 01 & 02
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mb-3 font-light">봉투 카드 및 매거진 룩북 표지 (미등록 시 메인 사진 적용)</p>
                  <input
                    ref={coverImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => validateAndSetImage(e.target.files?.[0], setCoverImageFile, setCoverImagePreview, '인트로 커버', coverImageInputRef)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-22 bg-white rounded-xl overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center shadow-xs">
                      {coverImagePreview ? (
                        <img src={coverImagePreview} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-stone-300 p-1 text-center">
                          <svg className="w-5 h-5 mb-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                          </svg>
                          <span className="text-[9px] font-mono font-medium">COVER</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {coverImagePreview ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>사진 등록 완료</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => coverImageInputRef.current?.click()}
                              className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                            >
                              사진 변경
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearSingleImage(setCoverImageFile, setCoverImagePreview, coverImageInputRef)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 text-xs font-medium rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                            >
                              <span>✕</span>
                              <span>삭제</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            onClick={() => coverImageInputRef.current?.click()}
                            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/80 text-xs font-medium rounded-xl transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>+</span>
                            <span>커버 사진 선택</span>
                          </button>
                          <p className="text-[10px] text-stone-400 mt-1 font-light">선택 사항 (미등록 시 메인 사진 적용)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 시안 4 (시네마틱) 전용: 신랑 & 신부 단독 흑백 인물 스냅 사진 */}
              {formData.template_type === 'cinematic' && (
                <div className="p-5 bg-stone-50/80 rounded-2xl border-2 border-stone-900/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-stone-900">
                      신랑 & 신부 개별 인물 스냅 사진 (선택)
                    </label>
                    <span className="text-[10px] font-mono bg-stone-900 text-white px-2 py-0.5 rounded-full font-semibold">
                      OPTION 04 전용
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-4 font-light">
                    시안 4의 2분할 흑백 인물 스냅(Bride & Groom)에 들어가는 개별 단독 사진입니다. (미등록 시 사진 없이 성함 텍스트만 깔끔하게 노출됩니다)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 신부 단독 사진 */}
                    <div className="p-4 bg-white rounded-xl border border-stone-200">
                      <span className="block text-xs font-semibold text-stone-800 mb-2">신부 단독 사진</span>
                      <input
                        ref={bridePhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => validateAndSetImage(e.target.files?.[0], setBridePhotoFile, setBridePhotoPreview, '신부 단독 사진', bridePhotoInputRef)}
                        className="hidden"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-18 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center">
                          {bridePhotoPreview ? (
                            <img src={bridePhotoPreview} alt="Bride" className="w-full h-full object-cover grayscale" />
                          ) : (
                            <span className="text-[9px] text-stone-400 font-mono text-center">BRIDE</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {bridePhotoPreview ? (
                            <div className="space-y-1.5">
                              <span className="text-[11px] text-emerald-600 font-medium block">● 등록됨</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => bridePhotoInputRef.current?.click()}
                                  className="px-2.5 py-1 bg-stone-900 text-white text-[11px] rounded-lg cursor-pointer"
                                >
                                  변경
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleClearSingleImage(setBridePhotoFile, setBridePhotoPreview, bridePhotoInputRef)}
                                  className="px-2 py-1 bg-rose-50 text-rose-600 text-[11px] rounded-lg cursor-pointer border border-rose-200/60"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => bridePhotoInputRef.current?.click()}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg cursor-pointer"
                            >
                              + 사진 선택
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 신랑 단독 사진 */}
                    <div className="p-4 bg-white rounded-xl border border-stone-200">
                      <span className="block text-xs font-semibold text-stone-800 mb-2">신랑 단독 사진</span>
                      <input
                        ref={groomPhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => validateAndSetImage(e.target.files?.[0], setGroomPhotoFile, setGroomPhotoPreview, '신랑 단독 사진', groomPhotoInputRef)}
                        className="hidden"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-18 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center">
                          {groomPhotoPreview ? (
                            <img src={groomPhotoPreview} alt="Groom" className="w-full h-full object-cover grayscale" />
                          ) : (
                            <span className="text-[9px] text-stone-400 font-mono text-center">GROOM</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {groomPhotoPreview ? (
                            <div className="space-y-1.5">
                              <span className="text-[11px] text-emerald-600 font-medium block">● 등록됨</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => groomPhotoInputRef.current?.click()}
                                  className="px-2.5 py-1 bg-stone-900 text-white text-[11px] rounded-lg cursor-pointer"
                                >
                                  변경
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleClearSingleImage(setGroomPhotoFile, setGroomPhotoPreview, groomPhotoInputRef)}
                                  className="px-2 py-1 bg-rose-50 text-rose-600 text-[11px] rounded-lg cursor-pointer border border-rose-200/60"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => groomPhotoInputRef.current?.click()}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg cursor-pointer"
                            >
                              + 사진 선택
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 커플 사진 & 엔딩 사진 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 축하 와이드 사진 / 커플 사진 */}
                <div className="p-4.5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-800">
                      {formData.template_type === 'cinematic' ? '축하 와이드 사진 (CELEBRATE)' : '커플 화보 사진 (인용구용)'}
                    </label>
                    <span className="text-[10px] font-mono text-stone-500">선택</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mb-3">
                    {formData.template_type === 'cinematic' ? '시안 4 상단 CELEBRATE 16:9 와이드 화보용' : '미등록 시 메인 사진이 자동 적용됩니다.'}
                  </p>
                  <input
                    ref={coupleImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => validateAndSetImage(e.target.files?.[0], setCoupleImageFile, setCoupleImagePreview, '커플 사진', coupleImageInputRef)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center shadow-xs">
                      {coupleImagePreview ? (
                        <img src={coupleImagePreview} alt="Couple" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-stone-300 font-mono">COUPLE</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {coupleImagePreview ? (
                        <div className="space-y-1.5">
                          <span className="text-[11px] text-emerald-600 font-medium block">● 등록됨</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => coupleImageInputRef.current?.click()}
                              className="px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-xl cursor-pointer"
                            >
                              변경
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearSingleImage(setCoupleImageFile, setCoupleImagePreview, coupleImageInputRef)}
                              className="px-2.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-200/60 text-xs font-medium rounded-xl cursor-pointer"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => coupleImageInputRef.current?.click()}
                          className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/80 text-xs font-medium rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span>+</span>
                          <span>사진 선택하기</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 캘린더 감성 스냅 사진 / 엔딩 사진 */}
                <div className="p-4.5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-stone-800">
                      {formData.template_type === 'cinematic' ? '캘린더 감성 스냅 사진' : '엔딩 감사 사진 (최하단)'}
                    </label>
                    <span className="text-[10px] font-mono text-stone-500">선택</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mb-3">
                    {formData.template_type === 'cinematic' ? '시안 4 DATE 캘린더 상단 정사각형 스냅용' : '미등록 시 메인 사진이 자동 적용됩니다.'}
                  </p>
                  <input
                    ref={endingImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => validateAndSetImage(e.target.files?.[0], setEndingImageFile, setEndingImagePreview, '엔딩 사진', endingImageInputRef)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-stone-200 shrink-0 flex items-center justify-center shadow-xs">
                      {endingImagePreview ? (
                        <img src={endingImagePreview} alt="Ending" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-stone-300 font-mono">ENDING</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {endingImagePreview ? (
                        <div className="space-y-1.5">
                          <span className="text-[11px] text-emerald-600 font-medium block">● 등록됨</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => endingImageInputRef.current?.click()}
                              className="px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-xl cursor-pointer"
                            >
                              변경
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearSingleImage(setEndingImageFile, setEndingImagePreview, endingImageInputRef)}
                              className="px-2.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-200/60 text-xs font-medium rounded-xl cursor-pointer"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => endingImageInputRef.current?.click()}
                          className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/80 text-xs font-medium rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span>+</span>
                          <span>사진 선택하기</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 갤러리 다중 사진 */}
              <div className="p-5 bg-[#FAFAF9] rounded-2xl border border-stone-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800">
                      웨딩 갤러리 화보 사진 (최대 20장)
                    </label>
                    <p className="text-[11px] text-stone-400 font-light mt-0.5">
                      여러 장을 한 번에 선택하여 등록하실 수 있습니다.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500 font-medium bg-stone-200/60 px-2.5 py-0.5 rounded-full">
                    현재 총 {existingGalleryUrls.length + newGalleryPreviews.length} / 20장
                  </span>
                </div>

                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewGalleryImagesChange}
                  className="hidden"
                />

                <div className="flex items-center gap-2 my-3">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>+</span>
                    <span>갤러리 사진 추가</span>
                  </button>
                  {(existingGalleryUrls.length > 0 || newGalleryPreviews.length > 0) && (
                    <button
                      type="button"
                      onClick={clearAllGalleryImages}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 text-xs font-medium rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <span>✕</span>
                      <span>전체 삭제</span>
                    </button>
                  )}
                </div>

                {/* 갤러리 썸네일 그리드 */}
                {(existingGalleryUrls.length > 0 || newGalleryPreviews.length > 0) && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 pt-1">
                    {/* 기존 유지 중인 사진들 */}
                    {existingGalleryUrls.map((src, idx) => (
                      <div key={`existing-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group shadow-xs">
                        <img src={src} alt={`기존 ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingGalleryUrl(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-rose-600 text-white rounded-full text-xs flex items-center justify-center transition-colors cursor-pointer shadow-sm active:scale-90"
                          title="삭제"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* 새로 추가된 사진들 */}
                    {newGalleryPreviews.map((src, idx) => (
                      <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-500 group shadow-xs">
                        <img src={src} alt={`새 사진 ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] px-1 rounded">신규</span>
                        <button
                          type="button"
                          onClick={() => removeNewGalleryImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-rose-600 text-white rounded-full text-xs flex items-center justify-center transition-colors cursor-pointer shadow-sm active:scale-90"
                          title="삭제"
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

          {/* 05. 축의금 계좌번호 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">05</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  축의금 계좌번호
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              {/* 신랑측 계좌 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-stone-800">신랑측 계좌</h3>
                  <button
                    type="button"
                    onClick={addGroomAccount}
                    className="text-xs text-stone-600 hover:text-stone-900 font-medium underline cursor-pointer"
                  >
                    + 계좌 추가
                  </button>
                </div>
                <div className="space-y-2.5">
                  {groomAccounts.map((acc, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-[#FAFAF9] rounded-xl border border-stone-200/70">
                      <input
                        type="text"
                        value={acc.title}
                        onChange={(e) => updateGroomAccount(idx, 'title', e.target.value)}
                        placeholder="구분 (예: 신랑)"
                        className="w-full sm:w-24 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                      <select
                        value={acc.bank}
                        onChange={(e) => updateGroomAccount(idx, 'bank', e.target.value)}
                        className="w-full sm:w-28 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      >
                        {BANK_OPTIONS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={acc.number}
                        onChange={(e) => updateGroomAccount(idx, 'number', e.target.value)}
                        placeholder="계좌번호 (- 포함)"
                        className="w-full sm:flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={acc.holder}
                        onChange={(e) => updateGroomAccount(idx, 'holder', e.target.value)}
                        placeholder="예금주"
                        className="w-full sm:w-24 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                      {groomAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGroomAccount(idx)}
                          className="text-stone-400 hover:text-rose-500 text-xs px-2 py-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 신부측 계좌 */}
              <div className="pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-stone-800">신부측 계좌</h3>
                  <button
                    type="button"
                    onClick={addBrideAccount}
                    className="text-xs text-stone-600 hover:text-stone-900 font-medium underline cursor-pointer"
                  >
                    + 계좌 추가
                  </button>
                </div>
                <div className="space-y-2.5">
                  {brideAccounts.map((acc, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-[#FAFAF9] rounded-xl border border-stone-200/70">
                      <input
                        type="text"
                        value={acc.title}
                        onChange={(e) => updateBrideAccount(idx, 'title', e.target.value)}
                        placeholder="구분 (예: 신부)"
                        className="w-full sm:w-24 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                      <select
                        value={acc.bank}
                        onChange={(e) => updateBrideAccount(idx, 'bank', e.target.value)}
                        className="w-full sm:w-28 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      >
                        {BANK_OPTIONS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={acc.number}
                        onChange={(e) => updateBrideAccount(idx, 'number', e.target.value)}
                        placeholder="계좌번호 (- 포함)"
                        className="w-full sm:flex-1 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={acc.holder}
                        onChange={(e) => updateBrideAccount(idx, 'holder', e.target.value)}
                        placeholder="예금주"
                        className="w-full sm:w-24 px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                      {brideAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBrideAccount(idx)}
                          className="text-stone-400 hover:text-rose-500 text-xs px-2 py-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 06. 배경음악(BGM) 설정 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">06</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  배경음악 (BGM)
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'preset', label: '추천 피아노 곡' },
                  { id: 'file', label: '내 음원 파일 등록' },
                  { id: 'url', label: '웹 링크 입력' },
                  { id: 'none', label: '무음 (BGM 끄기)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBgmMode(item.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
                      bgmMode === item.id
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {bgmMode === 'preset' && (
                <div className="p-4 bg-[#FAFAF9] rounded-2xl border border-stone-200/70 text-xs text-stone-600">
                  클래식 감성 피아노 멜로디가 적용됩니다.
                </div>
              )}

              {bgmMode === 'file' && (
                <div className="p-4 bg-[#FAFAF9] rounded-2xl border border-stone-200/70 space-y-2">
                  <input
                    ref={bgmFileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleBgmFileChange}
                    className="text-xs text-stone-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-stone-900 file:text-white"
                  />
                  {customBgmFileName && (
                    <div className="flex items-center justify-between text-xs text-stone-700 bg-white p-2 rounded-lg border border-stone-200">
                      <span>{customBgmFileName} ({customBgmFileSize})</span>
                      <button type="button" onClick={handleRemoveBgmFile} className="text-rose-500 font-bold">✕</button>
                    </div>
                  )}
                </div>
              )}

              {bgmMode === 'url' && (
                <div className="p-4 bg-[#FAFAF9] rounded-2xl border border-stone-200/70">
                  <input
                    type="url"
                    value={customBgmUrl}
                    onChange={(e) => setCustomBgmUrl(e.target.value)}
                    placeholder="https://... MP3 직접 링크 주소"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 07. 세부 섹션 표시 제어 */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-100">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs text-stone-400 tracking-wider">07</span>
                <h2 className="text-base sm:text-lg font-serif text-stone-900 tracking-tight font-medium">
                  세부 섹션 노출 옵션
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {[
                { name: 'show_intro', label: '오프닝 인트로' },
                { name: 'show_countdown', label: '웨딩 디데이 달력' },
                { name: 'show_gallery', label: '사진 갤러리' },
                { name: 'show_accounts', label: '축의금 계좌 안내' },
                { name: 'show_rsvp', label: '참석 의사(RSVP)' },
                { name: 'show_guestbook', label: '축하 방명록' },
              ].map((opt) => (
                <label key={opt.name} className="flex items-center gap-2 p-3 bg-[#FAFAF9] rounded-xl border border-stone-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    name={opt.name}
                    checked={formData[opt.name]}
                    onChange={handleChange}
                    className="rounded text-stone-900"
                  />
                  <span className="text-stone-700 font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 하단 고정 플로팅 액션 바 (100% 불투명 솔리드 배경으로 하단 텍스트 겹침 완벽 차단) */}
          <div className="sticky bottom-4 z-40 bg-white p-3.5 sm:p-4 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.12)] border border-stone-200/90 flex gap-3 items-center">
            <button
              type="button"
              onClick={openPreviewModal}
              className="flex-1 py-4 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              <span>실시간 미리보기</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-2 py-4 px-6 bg-stone-900 hover:bg-black disabled:bg-stone-400 text-white rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{submitting ? '수정 내용 반영 중...' : '수정사항 저장하기 (즉시 반영)'}</span>
              <span className="text-xs font-mono opacity-60">✓</span>
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closePreviewModal(e);
            }
          }}
        >
          {/* 데스크톱용 상단 우측 플로팅 닫기 버튼 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closePreviewModal(e);
            }}
            className="hidden sm:flex fixed top-5 right-6 z-[100] items-center gap-1.5 px-4 py-2 bg-stone-900/90 hover:bg-black text-stone-200 hover:text-white text-xs font-medium rounded-full shadow-lg border border-stone-700/80 backdrop-blur-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title="ESC 키로도 닫을 수 있습니다"
          >
            <span className="text-sm font-bold">✕</span>
            <span>닫기 (ESC)</span>
          </button>

          {/* 모바일/PC 공통 하단 중앙 플로팅 닫기 버튼 */}
          <div 
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closePreviewModal(e);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-stone-900/95 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md border border-stone-600/80 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-white/20"
            >
              <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>미리보기 닫기 (작성으로 복귀)</span>
            </button>
          </div>

          <div 
            className="bg-white w-full max-w-[430px] h-[92vh] sm:h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col border border-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 미리보기 상단 헤더 */}
            <div className="py-3 px-4 sm:px-5 bg-stone-950 text-white flex items-center justify-between shrink-0 border-b border-stone-800 z-10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] sm:text-xs font-mono tracking-wider sm:tracking-widest uppercase text-stone-300">
                  LIVE PREVIEW — EDIT
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closePreviewModal(e);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-full text-xs font-medium transition-colors cursor-pointer border border-stone-700 active:scale-95 shadow-sm"
                aria-label="미리보기 닫기"
              >
                <span className="text-xs leading-none font-bold">✕</span>
                <span>닫기</span>
              </button>
            </div>

            {/* 실제 청첩장 템플릿 렌더링 */}
            <div 
              id="preview-scroll-container"
              className={`flex-1 overflow-y-auto relative ${
                previewInvitation?.template_type === 'cinematic'
                  ? 'bg-white'
                  : previewInvitation?.template_type === 'playlist' 
                  ? 'bg-[#FBF9F5]' 
                  : previewInvitation?.template_type === 'editorial' 
                  ? 'bg-white' 
                  : 'bg-[#FCFBF7]'
              }`}
            >
              <BgmPlayer
                bgmUrl={previewInvitation.bgm_url}
                hasIntro={previewInvitation?.template_config?.show_intro !== false}
              />
              {previewInvitation?.template_type === 'cinematic' ? (
                <CinematicTemplate invitation={previewInvitation} />
              ) : previewInvitation?.template_type === 'playlist' ? (
                <PlaylistTemplate invitation={previewInvitation} />
              ) : previewInvitation?.template_type === 'editorial' ? (
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
