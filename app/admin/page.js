'use client';
import Link from 'next/link';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import QrCodeModal from '@/components/QrCodeModal';
import ExpiryAdjustModal from '@/components/ExpiryAdjustModal';

// 관리자 로그인 비밀번호 (Vercel 및 .env.local 환경변수로만 제어, 하드코딩 완전 제거)
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState('invitations'); // 'codes' | 'invitations' (기본: 청첩장 목록)

  // 1. 코드 목록 상태
  const [codes, setCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [newCodeType, setNewCodeType] = useState('store'); // 'store' | 'gift'
  const [newCodeNote, setNewCodeNote] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  // 2. 청첩장 목록 상태
  const [invitations, setInvitations] = useState([]);
  const [loadingInvs, setLoadingInvs] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // { inv, nextActive }
  const [selectedQrInv, setSelectedQrInv] = useState(null); // QR코드 모달 대상 청첩장
  const [selectedExpiryInv, setSelectedExpiryInv] = useState(null); // 만료일 조정 모달 대상 청첩장
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [copiedNoticeSlug, setCopiedNoticeSlug] = useState(null); // 톡톡 안내문 복사 상태 피드백

  // 3. 청첩장 필터 & 검색 & 페이지네이션 상태
  const [searchCategory, setSearchCategory] = useState('all'); // 'all' | 'groom' | 'bride' | 'phone' | 'slug'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterActiveStatus, setFilterActiveStatus] = useState('all'); // 'all' | 'active' | 'sample'
  const [filterTemplate, setFilterTemplate] = useState('all'); // 'all' | 'basic' | 'editorial' | 'playlist' | 'cinematic' | 'scene'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 페이지당 노출 건수 (10, 20, 50)

  // 4. 청첩장 안전 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState(null); // 단일 삭제 대상
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmSlugInput, setConfirmSlugInput] = useState('');
  const [showBatchPurgeModal, setShowBatchPurgeModal] = useState(false); // 30일 경과 미활성화 샘플 일괄 정리 모달
  const [isBatchPurging, setIsBatchPurging] = useState(false);

  // 청첩장 필터링 및 검색 계산
  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      // 1. 활성화 상태 필터
      const isActive = Boolean(inv.is_active ?? inv.template_config?.is_active ?? false);
      if (filterActiveStatus === 'active' && !isActive) return false;
      if (filterActiveStatus === 'sample' && isActive) return false;

      // 2. 시안(템플릿) 필터
      if (filterTemplate !== 'all') {
        const tType = inv.template_type || 'basic';
        if (tType !== filterTemplate) return false;
      }

      // 3. 검색어 필터
      const keyword = searchKeyword.trim().toLowerCase();
      if (!keyword) return true;

      const groomName = (inv.groom_name || '').toLowerCase();
      const brideName = (inv.bride_name || '').toLowerCase();
      const slug = (inv.slug || '').toLowerCase();

      // 공백 무시 비교를 위한 정규화
      const noSpaceKeyword = keyword.replace(/\s+/g, '');
      const noSpaceGroom = groomName.replace(/\s+/g, '');
      const noSpaceBride = brideName.replace(/\s+/g, '');
      const groomMatched = groomName.includes(keyword) || (noSpaceKeyword && noSpaceGroom.includes(noSpaceKeyword));
      const brideMatched = brideName.includes(keyword) || (noSpaceKeyword && noSpaceBride.includes(noSpaceKeyword));

      // 모든 연락처 수집 (신랑, 신부, 혼주 연락처)
      const phones = [
        inv.groom_phone,
        inv.bride_phone,
        inv.groom_father_phone,
        inv.bride_father_phone,
        inv.groom_mother_phone,
        inv.bride_mother_phone,
        inv.template_config?.groom_phone,
        inv.template_config?.bride_phone,
      ].filter(Boolean);

      const phoneRawJoined = phones.join(' ').toLowerCase();
      const numericKeyword = keyword.replace(/[^0-9]/g, '');
      const phonesNumeric = phones.map((p) => String(p).replace(/[^0-9]/g, '')).join(' ');

      const phoneMatched =
        phoneRawJoined.includes(keyword) ||
        (numericKeyword.length > 0 && phonesNumeric.includes(numericKeyword));

      if (searchCategory === 'groom') {
        return groomMatched;
      }
      if (searchCategory === 'bride') {
        return brideMatched;
      }
      if (searchCategory === 'phone') {
        return phoneMatched;
      }
      if (searchCategory === 'slug') {
        return slug.includes(keyword);
      }

      // 'all' (통합 검색)
      return (
        groomMatched ||
        brideMatched ||
        slug.includes(keyword) ||
        phoneMatched
      );
    });
  }, [invitations, searchCategory, searchKeyword, filterActiveStatus, filterTemplate]);

  // 페이지네이션 계산
  const totalItems = filteredInvitations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedInvitations = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredInvitations.slice(start, start + pageSize);
  }, [filteredInvitations, safeCurrentPage, pageSize]);

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchCategory('all');
    setSearchKeyword('');
    setFilterActiveStatus('all');
    setFilterTemplate('all');
    setCurrentPage(1);
  };

  // 30일 이상 지난 미활성화(샘플) 청첩장 목록 계산
  const oldSampleInvitations = useMemo(() => {
    if (!currentTimestamp) return [];
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    return invitations.filter((inv) => {
      const isActive = Boolean(inv.is_active ?? inv.template_config?.is_active ?? false);
      if (isActive) return false;
      if (!inv.created_at) return false;
      const createdTime = new Date(inv.created_at).getTime();
      return (currentTimestamp - createdTime) > THIRTY_DAYS_MS;
    });
  }, [invitations, currentTimestamp]);

  // 스토리지 파일 삭제 공통 함수 (DB 레코드 삭제 전 연결된 모든 사진/음원 파일 영구 삭제)
  const deleteInvitationStorageFiles = async (inv) => {
    const storageFilesToDelete = {
      'wedding-images': [],
      'wedding-bgm': [],
    };

    const extractStoragePath = (url) => {
      if (!url || typeof url !== 'string') return;
      if (url.startsWith('/') || url.includes('/presets/') || url.includes('/samples/')) return;

      const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      if (match) {
        const bucket = match[1];
        const filePath = decodeURIComponent(match[2].split('?')[0]);
        if (storageFilesToDelete[bucket]) {
          storageFilesToDelete[bucket].push(filePath);
        } else {
          storageFilesToDelete[bucket] = [filePath];
        }
      }
    };

    // 1) images 객체 내 모든 사진 (main, cover, ending, profile 등 - 문자열 파싱 방어)
    let parsedImages = inv.images;
    if (typeof parsedImages === 'string') {
      try { parsedImages = JSON.parse(parsedImages); } catch (e) { parsedImages = null; }
    }
    if (parsedImages && typeof parsedImages === 'object') {
      Object.values(parsedImages).forEach((u) => extractStoragePath(u));
    }

    // 2) gallery_images 배열 내 모든 사진 (문자열 파싱 방어)
    let parsedGallery = inv.gallery_images;
    if (typeof parsedGallery === 'string') {
      try { parsedGallery = JSON.parse(parsedGallery); } catch (e) { parsedGallery = null; }
    }
    if (Array.isArray(parsedGallery)) {
      parsedGallery.forEach((u) => extractStoragePath(u));
    }

    // 3) 커스텀 업로드 음원
    if (inv.bgm_url) {
      extractStoragePath(inv.bgm_url);
    }

    // 4) slug 폴더 내 잔여 파일 전체 검색
    if (inv.slug) {
      try {
        const { data: folderFiles } = await supabase.storage.from('wedding-images').list(inv.slug);
        if (folderFiles && folderFiles.length > 0) {
          folderFiles.forEach((f) => {
            if (f.name) storageFilesToDelete['wedding-images'].push(`${inv.slug}/${f.name}`);
          });
        }
      } catch (e) {
        console.warn('Storage folder list warning:', e);
      }
    }

    // 5) 하객 포토 스냅 사진
    try {
      const { data: guestPhotos } = await supabase.from('guest_photos').select('photo_url').eq('invitation_id', inv.id);
      if (guestPhotos && guestPhotos.length > 0) {
        guestPhotos.forEach((gp) => extractStoragePath(gp.photo_url));
      }
    } catch (e) {
      console.warn('Guest photos check warning:', e);
    }

    // Storage 삭제 실행
    for (const [bucket, files] of Object.entries(storageFilesToDelete)) {
      const uniqueFiles = [...new Set(files)];
      if (uniqueFiles.length > 0) {
        try {
          await supabase.storage.from(bucket).remove(uniqueFiles);
        } catch (storageErr) {
          console.warn(`Storage delete error in ${bucket}:`, storageErr);
        }
      }
    }
  };

  // 단일 청첩장 영구 삭제 핸들러 (스토리지 + DB 완전 정리)
  const handleDeleteInvitation = async () => {
    if (!deleteTarget) return;
    const inv = deleteTarget;
    const isActive = Boolean(inv.is_active ?? inv.template_config?.is_active ?? false);

    if (isActive && confirmSlugInput.trim() !== inv.slug) {
      alert(`정식 서비스 중인 청첩장은 영문 주소(${inv.slug})를 정확히 입력해야 삭제할 수 있습니다.`);
      return;
    }

    setIsDeleting(true);
    try {
      // 1. 스토리지 파일 영구 삭제
      await deleteInvitationStorageFiles(inv);

      // 2. 연관 DB 테이블 삭제 (외래키 제약조건 방지)
      await Promise.allSettled([
        supabase.from('rsvp').delete().eq('invitation_id', inv.id),
        supabase.from('guestbook').delete().eq('invitation_id', inv.id),
        supabase.from('guest_photos').delete().eq('invitation_id', inv.id),
      ]);

      // 3. invitations 메인 테이블 삭제
      const { error: invErr } = await supabase.from('invitations').delete().eq('id', inv.id);
      if (invErr) throw invErr;

      // 4. 연결된 1회용 인증코드가 있었다면 '사용 가능' 상태로 안전하게 자동 복원
      if (inv.slug) {
        try {
          await supabase
            .from('order_codes')
            .update({ is_used: false, used_at: null, used_by_slug: null })
            .eq('used_by_slug', inv.slug);
        } catch (codeErr) {
          console.warn('order_codes restore warning:', codeErr);
        }
      }

      // 4. 로컬 상태 업데이트
      setInvitations((prev) => prev.filter((item) => item.id !== inv.id));
      setDeleteTarget(null);
      setConfirmSlugInput('');
      alert(`[${inv.groom_name} & ${inv.bride_name}] 청첩장과 업로드된 모든 사진 파일이 안전하게 영구 삭제되었습니다.`);
    } catch (err) {
      console.error('Delete invitation error:', err);
      alert('삭제 중 오류가 발생했습니다: ' + (err.message || err));
    } finally {
      setIsDeleting(false);
    }
  };

  // 30일 경과 미활성화 샘플 일괄 정리 핸들러
  const handleBatchPurgeOldSamples = async () => {
    if (oldSampleInvitations.length === 0) return;
    setIsBatchPurging(true);

    try {
      let successCount = 0;
      for (const inv of oldSampleInvitations) {
        try {
          await deleteInvitationStorageFiles(inv);
          await Promise.allSettled([
            supabase.from('rsvp').delete().eq('invitation_id', inv.id),
            supabase.from('guestbook').delete().eq('invitation_id', inv.id),
            supabase.from('guest_photos').delete().eq('invitation_id', inv.id),
          ]);
          await supabase.from('invitations').delete().eq('id', inv.id);
          successCount++;
        } catch (subErr) {
          console.warn(`Batch purge item error (${inv.slug}):`, subErr);
        }
      }

      const purgedIds = new Set(oldSampleInvitations.map((i) => i.id));
      setInvitations((prev) => prev.filter((item) => !purgedIds.has(item.id)));
      setShowBatchPurgeModal(false);
      alert(`30일 이상 지난 미활성화 샘플 총 ${successCount}건과 저장 공간이 모두 성공적으로 정리되었습니다.`);
    } catch (err) {
      console.error('Batch purge failed:', err);
      alert('일괄 정리 중 오류가 발생했습니다: ' + (err.message || err));
    } finally {
      setIsBatchPurging(false);
    }
  };

  // 컴포넌트 마운트 시 현재 타임스탬프 설정 (렌더 중 Date.now 호출 방지)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTimestamp(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 세션 복원
  useEffect(() => {
    try {
      const savedAuth = sessionStorage.getItem('atelier_admin_auth');
      if (savedAuth === 'true') {
        const timer = setTimeout(() => {
          setIsAuthenticated(true);
        }, 0);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Session restore error:', e);
    }
  }, []);

  // 코드 목록 수동 새로고침
  const loadCodes = async () => {
    setLoadingCodes(true);
    try {
      const { data, error } = await supabase
        .from('order_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCodes(data);
      }
    } catch (err) {
      console.warn('order_codes load error:', err);
    } finally {
      setLoadingCodes(false);
    }
  };

  // 청첩장 목록 수동 새로고침
  const loadInvitations = async () => {
    setLoadingInvs(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('id, slug, groom_name, bride_name, groom_phone, bride_phone, groom_father_phone, bride_father_phone, groom_mother_phone, bride_mother_phone, wedding_date, template_type, is_active, template_config, order_code, created_at, manage_token, service_expired_at, images, gallery_images, bgm_url')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInvitations(data);
      }
    } catch (err) {
      console.warn('invitations load error:', err);
    } finally {
      setLoadingInvs(false);
    }
  };

  // 초기 데이터 로드 (React 19 / Compiler 호환 비동기 패턴)
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const [codesRes, invsRes] = await Promise.all([
          supabase.from('order_codes').select('*').order('created_at', { ascending: false }),
          supabase.from('invitations').select('id, slug, groom_name, bride_name, groom_phone, bride_phone, groom_father_phone, bride_father_phone, groom_mother_phone, bride_mother_phone, wedding_date, template_type, is_active, template_config, order_code, created_at, manage_token, service_expired_at, images, gallery_images, bgm_url').order('created_at', { ascending: false }),
        ]);

        if (isMounted) {
          if (codesRes.data) setCodes(codesRes.data);
          if (invsRes.data) setInvitations(invsRes.data);
        }
      } catch (err) {
        console.warn('Admin load error:', err);
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // 로그인 핸들러
  const handleLogin = (e) => {
    e.preventDefault();
    if (!ADMIN_PASSWORD) {
      alert('관리자 비밀번호 환경변수(NEXT_PUBLIC_ADMIN_PASSWORD)가 설정되지 않았습니다.');
      return;
    }
    if (passwordInput && passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('atelier_admin_auth', 'true');
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('atelier_admin_auth');
  };

  // 1회용 랜덤 코드 생성 함수 (예: WED-8492-1049, GIFT-3948-2819)
  const generateRandomCode = (type) => {
    const prefix = type === 'store' ? 'WED' : 'GIFT';
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${part1}-${part2}`;
  };

  // 신규 1회용 코드 발행 (중복 자동 검증 및 실시간 재발급 Auto-Retry)
  const handleCreateCode = async (e) => {
    e.preventDefault();
    setGeneratingCode(true);

    try {
      let uniqueCode = '';
      let isUnique = false;
      let attempts = 0;
      const MAX_ATTEMPTS = 10;

      // 1. 이미 존재하는 코드인지 실시간 검사 후, 겹치면 즉시 새 난수로 재발급
      while (!isUnique && attempts < MAX_ATTEMPTS) {
        attempts++;
        const candidate = generateRandomCode(newCodeType);

        const { data: existing, error: checkError } = await supabase
          .from('order_codes')
          .select('id')
          .eq('code', candidate)
          .maybeSingle();

        if (checkError) {
          console.warn('Code uniqueness check warning:', checkError);
        }

        if (!existing) {
          uniqueCode = candidate;
          isUnique = true;
        } else {
          console.info(`[코드 중복 감지] '${candidate}' 코드가 이미 존재하여 즉시 재발급을 시도합니다. (시도 ${attempts}회)`);
        }
      }

      if (!uniqueCode) {
        throw new Error('고유 코드 생성에 실패했습니다. 다시 시도해 주세요.');
      }

      const newEntry = {
        code: uniqueCode,
        type: newCodeType,
        note: newCodeNote.trim() || (newCodeType === 'store' ? '스마트스토어 주문' : '지인 선물'),
        is_used: false,
      };

      const { data, error } = await supabase
        .from('order_codes')
        .insert([newEntry])
        .select()
        .single();

      if (error) {
        alert(`코드 생성 실패: ${error.message}\n(Supabase SQL 테이블 생성이 완료되었는지 확인해 주세요)`);
      } else {
        setCodes((prev) => [data, ...prev]);
        setNewCodeNote('');
        navigator.clipboard.writeText(uniqueCode);
        alert(`[${uniqueCode}] 코드가 안전하게 발급되어 클립보드에 복사되었습니다!\n고객이나 지인에게 바로 전달해 주세요.`);
      }
    } catch (err) {
      alert(`오류: ${err.message}`);
    } finally {
      setGeneratingCode(false);
    }
  };

  // 코드 삭제
  const handleDeleteCode = async (id, codeStr) => {
    if (!confirm(`'${codeStr}' 코드를 삭제하시겠습니까?`)) return;
    try {
      const { error } = await supabase
        .from('order_codes')
        .delete()
        .eq('id', id);

      if (!error) {
        setCodes((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 고객 전달용 안내문 원클릭 복사 (네이버 톡톡 / 카카오톡 전송용)
  const handleCopyCustomerNotice = (inv) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const guestUrl = `${origin}/${inv.slug}`;
    const manageUrl = `${origin}/manage/${inv.slug}?token=${inv.manage_token}`;

    const text = `[ATELIER DE MUKIRU] 모바일 청첩장 안내

안녕하세요, 신랑 ${inv.groom_name} ♥ 신부 ${inv.bride_name} 고객님!
두 분의 모바일 청첩장이 정식 활성화되었습니다.

🔗 하객 공유용 청첩장
${guestUrl}

⚙️ 신랑·신부 전용 관리 페이지
${manageUrl}

📌 전용 관리 페이지에서 하객 참석 여부(RSVP) 및 방명록을 실시간으로 확인하고, 사진이나 예식 정보를 언제든 수정하실 수 있습니다.
📌 관리 링크는 분실되지 않도록 카카오톡 [나와의 채팅방] 또는 메모장에 꼭 보관해 두세요!

감사합니다.
ATELIER DE MUKIRU 드림`;

    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedNoticeSlug(inv.slug);
      setTimeout(() => {
        setCopiedNoticeSlug(null);
      }, 2500);
    } catch (copyErr) {
      console.error('Copy notice error:', copyErr);
      alert('안내문 복사 중 오류가 발생했습니다. 브라우저 권한을 확인해 주세요.');
    }
  };

  // 청첩장 활성화 토글 클릭 시 (컨펌 모달 오픈)
  const handleToggleActive = (inv) => {
    const currentActive = Boolean(inv.is_active ?? inv.template_config?.is_active ?? false);
    const nextActive = !currentActive;
    setConfirmTarget({ inv, nextActive });
  };

  // 컨펌 모달에서 최종 확인 클릭 시 실제 업데이트 실행
  const handleConfirmToggle = async () => {
    if (!confirmTarget) return;
    const { inv, nextActive } = confirmTarget;
    setConfirmTarget(null);
    setTogglingSlug(inv.slug);

    try {
      // 1. is_active 컬럼 업데이트 시도
      const updatedConfig = {
        ...(inv.template_config || {}),
        is_active: nextActive,
      };

      const { error } = await supabase
        .from('invitations')
        .update({
          is_active: nextActive,
          template_config: updatedConfig,
        })
        .eq('id', inv.id);

      if (error) {
        // is_active 컬럼이 아직 없을 경우 template_config에만 저장 시도
        const { error: confError } = await supabase
          .from('invitations')
          .update({ template_config: updatedConfig })
          .eq('id', inv.id);

        if (confError) {
          alert(`상태 변경 실패: ${confError.message}`);
          return;
        }
      }

      setInvitations((prev) =>
        prev.map((item) =>
          item.id === inv.id
            ? { ...item, is_active: nextActive, template_config: updatedConfig }
            : item
        )
      );

      alert(
        nextActive
          ? `'${inv.groom_name} & ${inv.bride_name}' 청첩장이 정식 활성화되었습니다! (워터마크 제거됨)`
          : `'${inv.groom_name} & ${inv.bride_name}' 청첩장이 샘플(미승인) 모드로 전환되었습니다.`
      );
    } catch (err) {
      alert(`오류: ${err.message}`);
    } finally {
      setTogglingSlug(null);
    }
  };

  // 서비스 만료일 업데이트 함수 (+6개월, +1년, 무제한, 직접 지정)
  const handleUpdateExpiry = async (invId, newExpiryIsoOrNull) => {
    try {
      const targetInv = invitations.find((i) => i.id === invId);
      const updatedConfig = {
        ...(targetInv?.template_config || {}),
        service_expired_at: newExpiryIsoOrNull,
      };

      const { error } = await supabase
        .from('invitations')
        .update({
          service_expired_at: newExpiryIsoOrNull,
          template_config: updatedConfig,
        })
        .eq('id', invId);

      if (error) {
        // service_expired_at 컬럼이 아직 DB에 없을 때를 대비한 하위 호환
        const { error: confError } = await supabase
          .from('invitations')
          .update({ template_config: updatedConfig })
          .eq('id', invId);

        if (confError) {
          alert(`만료일 변경 실패: ${confError.message}`);
          return;
        }
      }

      setInvitations((prev) =>
        prev.map((item) =>
          item.id === invId
            ? { ...item, service_expired_at: newExpiryIsoOrNull, template_config: updatedConfig }
            : item
        )
      );

      setSelectedExpiryInv(null);
      alert('서비스 만료일이 성공적으로 변경되었습니다.');
    } catch (err) {
      alert(`오류: ${err.message}`);
    }
  };

  // 로그인 폼
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F6F5F2] flex items-center justify-center p-4 text-stone-900 font-sans">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-200 text-center">
          <p className="text-[11px] font-mono tracking-[0.25em] text-stone-400 uppercase mb-2">
            ATELIER DE MUKIRU
          </p>
          <h1 className="text-xl font-serif text-stone-900 mb-6 font-semibold">
            총괄 관리자 로그인
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="관리자 마스터 비밀번호 입력"
              className="w-full px-4 py-3 bg-[#FAFAF9] border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 text-center"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-3 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              대시보드 접속
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 대시보드 화면
  const totalInvs = invitations.length;
  const activeInvs = invitations.filter((i) => i.is_active ?? i.template_config?.is_active).length;
  const pendingInvs = totalInvs - activeInvs;
  const unusedCodes = codes.filter((c) => !c.is_used).length;

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-stone-900 font-sans">
      {/* 1. 글로벌 상단 브랜드 네비게이션 헤더 */}
      <header className="w-full sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex flex-col text-left group">
            <span className="font-editorial-serif text-[16px] sm:text-[18px] tracking-[0.2em] font-bold uppercase text-stone-900 group-hover:text-amber-800 transition-colors">
              ATELIER DE MUKIRU
            </span>
            <span className="text-[8.5px] sm:text-[9px] font-mono tracking-widest text-stone-400 uppercase -mt-0.5">
              BOUTIQUE WEDDING ATELIER — MASTER
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl font-medium transition-all"
            >
              <span>🏠</span>
              <span>홈으로</span>
            </Link>
            <a
              href="/create"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-all shadow-xs"
            >
              제작 화면 ↗
            </a>
          </div>
        </div>
      </header>

      <div className="w-full max-w-5xl mx-auto py-8 sm:py-10 px-4 sm:px-8 space-y-8">
        
        {/* 상단 네비게이션 헤더 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest text-white bg-stone-900 px-2.5 py-0.5 rounded-full font-semibold uppercase">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-stone-400 font-mono">MUKIRU MASTER</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
              모바일 청첩장 총괄 관리 대시보드
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href="/create"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-all"
            >
              제작 화면 열기 ↗
            </a>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-stone-200/70 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-all cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 상단 통계 카드 4종 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-mono text-stone-400 uppercase block mb-1">TOTAL CARDS</span>
            <p className="text-2xl font-bold font-mono text-stone-900">{totalInvs}건</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-emerald-200/70 shadow-2xs bg-emerald-50/20">
            <span className="text-[11px] font-mono text-emerald-600 uppercase block mb-1 font-medium">ACTIVE (정식)</span>
            <p className="text-2xl font-bold font-mono text-emerald-700">{activeInvs}건</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-amber-200/70 shadow-2xs bg-amber-50/20">
            <span className="text-[11px] font-mono text-amber-600 uppercase block mb-1 font-medium">SAMPLE (미승인)</span>
            <p className="text-2xl font-bold font-mono text-amber-700">{pendingInvs}건</p>
          </div>
          <div className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-mono text-stone-400 uppercase block mb-1">AVAILABLE CODES</span>
            <p className="text-2xl font-bold font-mono text-stone-900">{unusedCodes}개</p>
          </div>
        </div>

        {/* 탭 전환 버튼 */}
        <div className="flex gap-2 border-b border-stone-200 pb-px">
          <button
            onClick={() => setActiveTab('codes')}
            className={`py-3 px-5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'codes'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            1회용 발급 코드 관리 ({codes.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-3 px-5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'invitations'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            전체 청첩장 목록 및 활성화 관리 ({invitations.length})
          </button>
        </div>

        {/* ========================================================
            TAB 1: 1회용 인증코드 관리 & 발급기
           ======================================================== */}
        {activeTab === 'codes' && (
          <div className="space-y-6">
            {/* 신규 코드 발급 폼 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs">
              <h2 className="text-base font-serif font-bold text-stone-900 mb-1">
                신규 1회용 인증코드 발급
              </h2>
              <p className="text-xs text-stone-500 font-light mb-4">
                스마트스토어 주문 고객용 코드 또는 지인 선물용 1회용 코드를 발급합니다.
              </p>

              <form onSubmit={handleCreateCode} className="flex flex-col sm:flex-row gap-3">
                <select
                  value={newCodeType}
                  onChange={(e) => setNewCodeType(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#FAFAF9] border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:border-stone-900"
                >
                  <option value="store">스마트스토어 고객용 (WED-)</option>
                  <option value="gift">지인 선물용 (GIFT-)</option>
                </select>
                <input
                  type="text"
                  value={newCodeNote}
                  onChange={(e) => setNewCodeNote(e.target.value)}
                  placeholder="메모 (예: 스마트스토어 홍길동님, 친구 이민수)"
                  className="flex-1 px-3.5 py-2.5 bg-[#FAFAF9] border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
                />
                <button
                  type="submit"
                  disabled={generatingCode}
                  className="py-2.5 px-6 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
                >
                  {generatingCode ? '생성 중...' : '+ 1회용 코드 발급 & 복사'}
                </button>
              </form>
            </div>

            {/* 발급된 코드 리스트 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-stone-900">발급 내역 목록</h3>
                <button
                  onClick={loadCodes}
                  className="text-xs text-stone-400 hover:text-stone-700 font-mono underline"
                >
                  새로고침
                </button>
              </div>

              {loadingCodes ? (
                <p className="text-center py-10 text-xs text-stone-400">코드 목록을 불러오고 있습니다...</p>
              ) : codes.length === 0 ? (
                <div className="text-center py-12 text-stone-400 space-y-2">
                  <p className="text-sm">발급된 코드가 없습니다.</p>
                  <p className="text-xs text-stone-400">위 폼에서 신규 1회용 코드를 발급해 보세요.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full min-w-[850px] text-left text-xs text-stone-700 border-collapse">
                    <thead className="bg-[#FAFAF9] text-stone-500 uppercase font-mono text-[11px] border-b border-stone-200/80">
                      <tr>
                        <th className="py-3.5 px-4 whitespace-nowrap font-medium">인증코드</th>
                        <th className="py-3.5 px-4 whitespace-nowrap font-medium">구분</th>
                        <th className="py-3.5 px-4 whitespace-nowrap font-medium">메모</th>
                        <th className="py-3.5 px-4 whitespace-nowrap font-medium">상태</th>
                        <th className="py-3.5 px-4 whitespace-nowrap font-medium">사용된 청첩장</th>
                        <th className="py-3.5 px-4 text-right whitespace-nowrap font-medium">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-sans">
                      {codes.map((c) => (
                        <tr key={c.id} className="hover:bg-stone-50/50">
                          <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                            <span
                              onClick={() => {
                                navigator.clipboard.writeText(c.code);
                                alert(`'${c.code}' 코드가 복사되었습니다!`);
                              }}
                              className="cursor-pointer hover:underline text-stone-900 bg-stone-100 px-2 py-1 rounded-md"
                              title="클릭하여 코드 복사"
                            >
                              {c.code}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase ${
                              c.type === 'gift' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {c.type === 'gift' ? '지인 선물' : '스마트스토어'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-stone-600 font-light">{c.note || '-'}</td>
                          <td className="py-3.5 px-4">
                            {c.is_used ? (
                              <span className="text-[11px] text-stone-400 font-medium line-through">사용 완료 (소멸)</span>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">사용 가능</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {c.used_by_slug ? (
                              <a
                                href={`/${c.used_by_slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-stone-900 underline hover:text-black font-medium"
                              >
                                /{c.used_by_slug} ↗
                              </a>
                            ) : (
                              <span className="text-stone-300">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteCode(c.id, c.code)}
                              className="text-stone-400 hover:text-rose-600 font-mono text-xs cursor-pointer"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: 전체 청첩장 관리 & 1초 활성화 토글
           ======================================================== */}
        {activeTab === 'invitations' && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs overflow-hidden">
            {/* 상단 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-serif font-bold text-stone-900">제작된 청첩장 목록</h3>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200/80 shadow-2xs">
                    <span className="text-[10px] text-stone-400 font-normal uppercase">Total</span>
                    <span>{invitations.length}개</span>
                  </span>
                  {(searchKeyword || filterActiveStatus !== 'all' || filterTemplate !== 'all' || searchCategory !== 'all') && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      <span>검색결과</span>
                      <strong>{totalItems}개</strong>
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  활성화 스위치를 켜면 즉시 워터마크가 제거되고 정식 서비스됩니다. <strong>[📋 안내문 복사]</strong>로 완성 링크를 고객에게 1초 만에 전송하세요.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                {oldSampleInvitations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowBatchPurgeModal(true)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-medium border border-rose-200 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                    title="제작된 지 30일 이상 지난 미활성화 샘플 청첩장 일괄 정리"
                  >
                    <span>🧹 30일 경과 샘플 정리</span>
                    <span className="font-mono font-bold">({oldSampleInvitations.length}건)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={loadInvitations}
                  disabled={loadingInvs}
                  className="text-xs text-stone-500 hover:text-stone-900 font-mono underline inline-flex items-center gap-1 cursor-pointer ml-1"
                >
                  <span>{loadingInvs ? '불러오는 중...' : '새로고침 ↻'}</span>
                </button>
              </div>
            </div>

            {loadingInvs ? (
              <p className="text-center py-14 text-xs text-stone-400">청첩장 목록을 불러오고 있습니다...</p>
            ) : invitations.length === 0 ? (
              <div className="text-center py-14 text-stone-400">
                제작된 청첩장이 아직 없습니다.
              </div>
            ) : (
              <>
                {/* ========================================================
                    필터 & 검색 바 (연락처, 신랑이름, 신부이름, 활성화상태, 시안)
                   ======================================================== */}
                <div className="bg-stone-50/80 rounded-2xl p-4 sm:p-5 border border-stone-200/70 mb-5 space-y-3 font-sans">
                  {/* 1행: 검색 필터 컨트롤 */}
                  <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
                    <div className="flex flex-1 flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      {/* 검색 카테고리 셀렉트 */}
                      <select
                        value={searchCategory}
                        onChange={(e) => {
                          setSearchCategory(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 outline-none focus:border-stone-400 cursor-pointer shadow-2xs"
                      >
                        <option value="all">전체 검색 (이름·연락처·URL)</option>
                        <option value="groom">신랑 이름</option>
                        <option value="bride">신부 이름</option>
                        <option value="phone">연락처 (신랑·신부·혼주)</option>
                        <option value="slug">영문 주소 (URL)</option>
                      </select>

                      {/* 검색어 입력창 */}
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={searchKeyword}
                          onChange={(e) => {
                            setSearchKeyword(e.target.value);
                            setCurrentPage(1);
                          }}
                          placeholder={
                            searchCategory === 'phone'
                              ? '전화번호 검색 (예: 01012345678, 5678)...'
                              : searchCategory === 'groom'
                              ? '신랑 이름 입력...'
                              : searchCategory === 'bride'
                              ? '신부 이름 입력...'
                              : searchCategory === 'slug'
                              ? 'URL 주소(slug) 입력...'
                              : '신랑/신부 이름, 연락처, URL 검색...'
                          }
                          className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-8 py-2 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-stone-400 shadow-2xs"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                          🔍
                        </span>
                        {searchKeyword && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchKeyword('');
                              setCurrentPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
                            title="검색어 지우기"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 상태 & 시안 & 페이지 크기 필터 그룹 */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* 정식 활성화 상태 필터 */}
                      <select
                        value={filterActiveStatus}
                        onChange={(e) => {
                          setFilterActiveStatus(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 outline-none focus:border-stone-400 cursor-pointer shadow-2xs"
                      >
                        <option value="all">전체 활성화 상태</option>
                        <option value="active">정식 활성화 ON</option>
                        <option value="sample">샘플 모드 (미활성)</option>
                      </select>

                      {/* 시안 필터 */}
                      <select
                        value={filterTemplate}
                        onChange={(e) => {
                          setFilterTemplate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 outline-none focus:border-stone-400 cursor-pointer shadow-2xs"
                      >
                        <option value="all">전체 시안</option>
                        <option value="basic">시안 1 (모던 클래식)</option>
                        <option value="editorial">시안 2 (에디토리얼)</option>
                        <option value="playlist">시안 3 (플레이리스트)</option>
                        <option value="cinematic">시안 4 (시네마틱)</option>
                        <option value="scene">시안 5 (모던 씬)</option>
                      </select>

                      {/* 페이지당 노출 건수 */}
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-white border border-stone-200 rounded-xl px-2.5 py-2 text-xs font-medium text-stone-700 outline-none focus:border-stone-400 cursor-pointer shadow-2xs"
                        title="페이지당 노출 건수"
                      >
                        <option value={10}>10개씩</option>
                        <option value={20}>20개씩</option>
                        <option value={50}>50개씩</option>
                      </select>

                      {/* 초기화 버튼 */}
                      {(searchKeyword || filterActiveStatus !== 'all' || filterTemplate !== 'all' || searchCategory !== 'all') && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                          title="필터 및 검색어 초기화"
                        >
                          <span>↺ 초기화</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2행: 검색 통계 */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-200/50">
                    <div className="flex items-center gap-2">
                      <span>
                        총 <strong className="text-stone-900 font-mono font-semibold">{invitations.length}</strong>건 중{' '}
                        <strong className="text-stone-900 font-mono font-semibold">{totalItems}</strong>건 일치
                      </span>
                      {totalItems > 0 && (
                        <span className="text-[11px] text-stone-400 font-mono">
                          ({safeCurrentPage} / {totalPages} 페이지)
                        </span>
                      )}
                    </div>
                    {totalItems > 0 && (
                      <div className="text-[11px] font-mono text-stone-400">
                        {(safeCurrentPage - 1) * pageSize + 1} - {Math.min(safeCurrentPage * pageSize, totalItems)}번째 청첩장 표시 중
                      </div>
                    )}
                  </div>
                </div>

                {/* ========================================================
                    청첩장 목록 테이블
                   ======================================================== */}
                {totalItems === 0 ? (
                  <div className="text-center py-16 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 my-4">
                    <p className="text-stone-500 text-xs mb-2">검색 조건과 일치하는 청첩장이 없습니다.</p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-medium hover:bg-black transition-colors cursor-pointer shadow-2xs"
                    >
                      필터 초기화
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="w-full min-w-[1280px] text-left text-xs text-stone-700 border-collapse">
                      <thead className="bg-[#FAFAF9] text-stone-500 uppercase font-mono text-[11px] border-b border-stone-200/80">
                        <tr>
                          <th className="py-3.5 px-3 text-center whitespace-nowrap font-medium w-14">NO</th>
                          <th className="py-3.5 px-4 whitespace-nowrap font-medium">신랑 & 신부 (연락처)</th>
                          <th className="py-3.5 px-4 whitespace-nowrap font-medium">시안</th>
                          <th className="py-3.5 px-4 whitespace-nowrap font-medium">예식 일시</th>
                          <th className="py-3.5 px-4 whitespace-nowrap font-medium">서비스 만료일</th>
                          <th className="py-3.5 px-4 whitespace-nowrap font-medium">영문 주소 (URL)</th>
                          <th className="py-3.5 px-4 whitespace-nowrap font-medium">2차 보안 PIN</th>
                          <th className="py-3.5 px-4 whitespace-nowrap font-medium">정식 활성화 상태</th>
                          <th className="py-3.5 px-4 text-center whitespace-nowrap font-medium">청첩장 관리 & 안내문</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-sans">
                        {paginatedInvitations.map((inv, idx) => {
                          const isActive = Boolean(inv.is_active ?? inv.template_config?.is_active ?? false);
                          
                          // 서비스 만료일 계산
                          const rawExpiry = inv.service_expired_at !== undefined ? inv.service_expired_at : inv.template_config?.service_expired_at;
                          const isUnlimited = rawExpiry === null;
                          const expDate = isUnlimited 
                            ? null 
                            : (rawExpiry ? new Date(rawExpiry) : (inv.wedding_date ? new Date(new Date(inv.wedding_date.replace(' ', 'T')).getTime() + 365 * 24 * 60 * 60 * 1000) : null));
                          const isExpired = !isUnlimited && expDate && currentTimestamp > 0 && currentTimestamp > expDate.getTime();
                          const daysLeft = !isUnlimited && expDate && currentTimestamp > 0 ? Math.ceil((expDate.getTime() - currentTimestamp) / (1000 * 60 * 60 * 24)) : null;

                          const formattedExp = isUnlimited 
                            ? '무제한 (영구)' 
                            : (expDate && !isNaN(expDate.getTime()) 
                                ? `${expDate.getFullYear()}.${String(expDate.getMonth() + 1).padStart(2, '0')}.${String(expDate.getDate()).padStart(2, '0')}` 
                                : '-');

                          // 예식일 파싱 (YYYY.MM.DD HH:mm 깔끔한 포맷)
                          const weddingDateFormatted = (() => {
                            if (!inv.wedding_date) return '-';
                            const parts = inv.wedding_date.replace('T', ' ').split(' ');
                            const d = parts[0] ? parts[0].replace(/-/g, '.') : '-';
                            const t = parts[1] ? parts[1].slice(0, 5) : '';
                            return t ? `${d} ${t}` : d;
                          })();

                          // 신랑 / 신부 연락처
                          const groomPhone = inv.groom_phone || inv.template_config?.groom_phone;
                          const bridePhone = inv.bride_phone || inv.template_config?.bride_phone;

                          return (
                            <tr key={inv.id} className="hover:bg-stone-50/70 transition-colors">
                              {/* 0. NO (넘버링) */}
                              <td className="py-4 px-3 text-center whitespace-nowrap font-mono text-xs text-stone-400 font-medium">
                                {(safeCurrentPage - 1) * pageSize + idx + 1}
                              </td>

                              {/* 1. 신랑 & 신부 + 연락처 */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <div className="font-semibold text-stone-900 text-sm">
                                  {inv.groom_name} & {inv.bride_name}
                                </div>
                                {(groomPhone || bridePhone) ? (
                                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-stone-500 mt-1">
                                    {groomPhone && (
                                      <span className="bg-stone-100/80 border border-stone-200/70 px-1.5 py-0.5 rounded text-stone-700">
                                        신랑 {groomPhone}
                                      </span>
                                    )}
                                    {bridePhone && (
                                      <span className="bg-stone-100/80 border border-stone-200/70 px-1.5 py-0.5 rounded text-stone-700">
                                        신부 {bridePhone}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="font-mono text-[10px] text-stone-300 mt-0.5 block">
                                    연락처 미등록
                                  </span>
                                )}
                              </td>

                              {/* 2. 시안 */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-medium border border-stone-200/60 inline-block">
                                  {inv.template_type === 'scene'
                                    ? '시안 5 (모던 씬)'
                                    : inv.template_type === 'cinematic'
                                    ? '시안 4 (시네마틱)'
                                    : inv.template_type === 'playlist'
                                    ? '시안 3 (플레이리스트)'
                                    : inv.template_type === 'editorial'
                                    ? '시안 2 (에디토리얼)'
                                    : '시안 1 (모던 클래식)'}
                                </span>
                              </td>

                              {/* 3. 예식 일시 */}
                              <td className="py-4 px-4 whitespace-nowrap font-mono text-xs text-stone-600">
                                {weddingDateFormatted}
                              </td>

                              {/* 4. 서비스 만료일 */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1 items-start">
                                  <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-stone-800">
                                    <span>{formattedExp}</span>
                                    {isUnlimited ? (
                                      <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-mono font-bold whitespace-nowrap inline-block">
                                        영구
                                      </span>
                                    ) : isExpired ? (
                                      <span className="text-[10px] bg-stone-100 text-stone-500 border border-stone-200 px-2 py-0.5 rounded-full font-mono font-medium whitespace-nowrap inline-block">
                                        만료됨
                                      </span>
                                    ) : (
                                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold whitespace-nowrap inline-block">
                                        D-{daysLeft}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedExpiryInv(inv)}
                                    className="text-[11px] text-stone-400 hover:text-stone-800 underline font-mono cursor-pointer transition-colors inline-flex items-center gap-0.5"
                                  >
                                    <span>만료일 조정</span>
                                    <span className="text-[10px]">✎</span>
                                  </button>
                                </div>
                              </td>

                              {/* 5. 영문 주소 (URL) */}
                              <td className="py-4 px-4 whitespace-nowrap font-mono font-medium text-stone-700 text-xs">
                                <span className="bg-stone-50 border border-stone-200/80 px-2.5 py-1 rounded-md text-stone-800">
                                  /{inv.slug}
                                </span>
                              </td>

                              {/* 6. 2차 보안 PIN */}
                              <td className="py-4 px-4 whitespace-nowrap font-mono">
                                {(inv.template_config?.manage_password || inv.manage_password) ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-stone-100 text-stone-800 rounded border border-stone-200">
                                    <span>🔒</span>
                                    <span>{inv.template_config?.manage_password || inv.manage_password}</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-stone-400">미설정</span>
                                )}
                              </td>

                              {/* 7. 정식 활성화 상태 */}
                              <td className="py-4 px-4 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(inv)}
                                  disabled={togglingSlug === inv.slug}
                                  className={`py-1.5 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border whitespace-nowrap ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                  }`}
                                  title={isActive ? '정식 서비스 중 (클릭 시 샘플 모드로 전환)' : '샘플 모드 (클릭 시 정식 활성화)'}
                                >
                                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                  <span>{isActive ? '정식 활성화 ON' : '샘플 모드 (클릭 시 ON)'}</span>
                                </button>
                              </td>

                              {/* 8. 관리 버튼 그룹 */}
                              <td className="py-4 px-4 text-center whitespace-nowrap">
                                <div className="inline-flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCustomerNotice(inv)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1 border shadow-2xs active:scale-98 ${
                                      copiedNoticeSlug === inv.slug
                                        ? 'bg-[#6A5A48] text-white border-[#6A5A48]'
                                        : 'bg-[#F7F4EE] hover:bg-[#EFE9DF] text-[#6A5A48] border-[#DDD5C7]'
                                    }`}
                                    title="고객 전달용 완성 안내문 복사 (네이버 톡톡/카톡 전송)"
                                  >
                                    <span>{copiedNoticeSlug === inv.slug ? '✓ 복사완료!' : '📋 안내문 복사'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedQrInv(inv)}
                                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer transition-colors inline-flex items-center gap-1 border border-stone-200/60"
                                  >
                                    <span>QR코드</span>
                                    <span className="text-[10px] text-stone-500">⬇</span>
                                  </button>
                                  <a
                                    href={`/${inv.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium transition-colors border border-stone-200 inline-flex items-center gap-1"
                                  >
                                    <span>하객 화면</span>
                                    <span className="text-[10px] text-stone-400">↗</span>
                                  </a>
                                  <a
                                    href={`/manage/${inv.slug}?token=${inv.manage_token}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1.5 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-medium transition-colors shadow-2xs inline-flex items-center gap-1"
                                  >
                                    <span>참석자 관리</span>
                                    <span className="text-[10px] text-stone-400">↗</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteTarget(inv);
                                      setConfirmSlugInput('');
                                    }}
                                    className="px-2 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg text-xs font-medium transition-colors border border-stone-200 hover:border-rose-300 inline-flex items-center gap-1 cursor-pointer"
                                    title="청첩장 영구 삭제 (스토리지 사진 및 데이터 정리)"
                                  >
                                    <span>🗑️</span>
                                    <span>삭제</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ========================================================
                    페이지네이션 바 (Pagination Controls)
                   ======================================================== */}
                {totalPages > 1 && (
                  <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 pt-5 border-t border-stone-100 font-sans">
                    <div className="sm:absolute sm:left-0 text-xs text-stone-400 font-mono">
                      전체 {totalItems}건 중 {(safeCurrentPage - 1) * pageSize + 1} - {Math.min(safeCurrentPage * pageSize, totalItems)}건
                    </div>

                    <div className="inline-flex items-center gap-1 font-mono text-xs">
                      {/* 맨 처음 페이지 */}
                      <button
                        type="button"
                        disabled={safeCurrentPage <= 1}
                        onClick={() => setCurrentPage(1)}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="처음 페이지"
                      >
                        «
                      </button>

                      {/* 이전 페이지 */}
                      <button
                        type="button"
                        disabled={safeCurrentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="이전 페이지"
                      >
                        ‹
                      </button>

                      {/* 페이지 번호 목록 (최대 5개 동적 표기) */}
                      {(() => {
                        const maxButtons = 5;
                        let startPage = Math.max(1, safeCurrentPage - Math.floor(maxButtons / 2));
                        let endPage = startPage + maxButtons - 1;
                        if (endPage > totalPages) {
                          endPage = totalPages;
                          startPage = Math.max(1, endPage - maxButtons + 1);
                        }

                        const pages = [];
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(i);
                        }

                        return pages.map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              pageNum === safeCurrentPage
                                ? 'bg-stone-900 text-white shadow-2xs'
                                : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ));
                      })()}

                      {/* 다음 페이지 */}
                      <button
                        type="button"
                        disabled={safeCurrentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="다음 페이지"
                      >
                        ›
                      </button>

                      {/* 맨 끝 페이지 */}
                      <button
                        type="button"
                        disabled={safeCurrentPage >= totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="마지막 페이지"
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>

      {/* ========================================================
          정식 활성화 / 샘플 전환 확인 컨펌 모달
         ======================================================== */}
      {confirmTarget && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setConfirmTarget(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 text-left animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상태별 상단 배지 */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full font-bold ${
                confirmTarget.nextActive
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {confirmTarget.nextActive ? 'ACTIVATION CONFIRM' : 'DEACTIVATION CONFIRM'}
              </span>
            </div>

            <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">
              {confirmTarget.nextActive
                ? '정식 활성화로 전환하시겠습니까?'
                : '샘플(미승인) 모드로 전환하시겠습니까?'}
            </h3>

            {/* 청첩장 정보 요약 박스 */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 my-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">신랑 & 신부</span>
                <span className="font-semibold text-stone-900">
                  {confirmTarget.inv.groom_name} & {confirmTarget.inv.bride_name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">청첩장 영문 주소</span>
                <span className="text-stone-700 font-medium">
                  /{confirmTarget.inv.slug}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">예식 일시</span>
                <span className="text-stone-700">
                  {confirmTarget.inv.wedding_date?.replace('T', ' ') || '-'}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed font-light mb-6">
              {confirmTarget.nextActive ? (
                <>
                  <strong className="text-emerald-700 font-medium">정식 활성화 시</strong> 청첩장 화면의 <strong className="text-stone-800 font-medium">워터마크와 샘플 알림 배너가 즉시 제거</strong>되며, 하객 공유 및 모든 기능이 정식 서비스 상태로 오픈됩니다.
                </>
              ) : (
                <>
                  <strong className="text-amber-700 font-medium">샘플 모드 전환 시</strong> 청첩장에 <strong className="text-stone-800 font-medium">워터마크와 샘플 배너가 다시 표시</strong>되며, 카카오톡 공유 시 인증 안내 팝업이 나타납니다.
                </>
              )}
            </p>

            {/* 액션 버튼 */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                className={`flex-1 py-3 px-4 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                  confirmTarget.nextActive
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <span>{confirmTarget.nextActive ? '정식 활성화 실행' : '샘플 모드로 변경'}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          청첩장 개별 영구 삭제 확인 모달 (스토리지 + DB 완전 정리)
         ======================================================== */}
      {deleteTarget && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => {
            if (!isDeleting) {
              setDeleteTarget(null);
              setConfirmSlugInput('');
            }
          }}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 text-left animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 경고 배지 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                PERMANENT DELETE
              </span>
              {Boolean(deleteTarget.is_active ?? deleteTarget.template_config?.is_active ?? false) && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  정식 서비스 중
                </span>
              )}
            </div>

            <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">
              청첩장을 완전히 삭제하시겠습니까?
            </h3>

            {/* 청첩장 정보 요약 박스 */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 my-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">신랑 & 신부</span>
                <span className="font-semibold text-stone-900">
                  {deleteTarget.groom_name} & {deleteTarget.bride_name}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-stone-400">영문 주소 (URL)</span>
                <span className="text-stone-700 font-medium">
                  /{deleteTarget.slug}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">예식 일시</span>
                <span className="text-stone-700">
                  {deleteTarget.wedding_date?.replace('T', ' ') || '-'}
                </span>
              </div>
            </div>

            {/* 삭제 안내 및 경고 */}
            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-xs text-rose-900 leading-relaxed mb-4 space-y-1.5">
              <p className="font-semibold flex items-center gap-1 text-rose-800">
                <span>⚠️</span>
                <span>삭제 시 다음 데이터가 즉시 영구 파기됩니다:</span>
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-rose-700 text-[11.5px]">
                <li>Supabase Storage에 업로드된 <strong>모든 사진 및 음원 파일</strong> (용량 즉시 반환)</li>
                <li>하객 참석 의사(RSVP) 응답 및 방명록 축하 메시지 전체</li>
                <li>청첩장 웹페이지 및 관리자 토큰</li>
              </ul>
            </div>

            {/* 정식 활성화된 청첩장인 경우 안전 가드 (슬러그 직접 입력 확인) */}
            {Boolean(deleteTarget.is_active ?? deleteTarget.template_config?.is_active ?? false) ? (
              <div className="mb-5">
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  안전을 위해 영문 주소 <strong className="text-rose-600 font-mono">&quot;{deleteTarget.slug}&quot;</strong>을 아래에 똑같이 입력하세요:
                </label>
                <input
                  type="text"
                  value={confirmSlugInput}
                  onChange={(e) => setConfirmSlugInput(e.target.value)}
                  placeholder={deleteTarget.slug}
                  disabled={isDeleting}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 outline-none focus:border-rose-500"
                />
              </div>
            ) : null}

            {/* 액션 버튼 */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setConfirmSlugInput('');
                }}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteInvitation}
                disabled={isDeleting || (Boolean(deleteTarget.is_active ?? deleteTarget.template_config?.is_active ?? false) && confirmSlugInput.trim() !== deleteTarget.slug)}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{isDeleting ? '스토리지 및 데이터 삭제 중...' : '영구 삭제 실행'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          30일 경과 미활성화 샘플 일괄 정리 모달
         ======================================================== */}
      {showBatchPurgeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => {
            if (!isBatchPurging) setShowBatchPurgeModal(false);
          }}
        >
          <div 
            className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 text-left animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                BATCH CLEANUP
              </span>
            </div>

            <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">
              오래된 미활성화 샘플 일괄 정리
            </h3>

            <p className="text-xs text-stone-500 leading-relaxed font-light mb-4">
              제작된 지 <strong className="text-stone-800 font-medium">30일이 지난 미활성화(샘플) 청첩장 {oldSampleInvitations.length}건</strong>을 일괄 정리하여 Supabase 스토리지 저장 공간을 확보합니다.
            </p>

            {/* 정리 대상 목록 미리보기 */}
            <div className="max-h-40 overflow-y-auto p-3 bg-stone-50 rounded-xl border border-stone-200/80 mb-4 divide-y divide-stone-100 text-xs font-mono">
              {oldSampleInvitations.map((inv) => (
                <div key={inv.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-stone-600">
                  <span>{inv.groom_name} & {inv.bride_name}</span>
                  <span className="text-stone-400">/{inv.slug}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-xs text-amber-800 mb-5 leading-relaxed">
              정리 실행 시 해당 청첩장들의 <strong>업로드된 사진/오디오 파일과 DB 데이터가 영구 삭제</strong>되며 되돌릴 수 없습니다.
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowBatchPurgeModal(false)}
                disabled={isBatchPurging}
                className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleBatchPurgeOldSamples}
                disabled={isBatchPurging}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{isBatchPurging ? '일괄 정리 중...' : `${oldSampleInvitations.length}건 모두 영구 삭제`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 종이 청첩장 인쇄용 QR코드 모달 */}
      {selectedQrInv && (
        <QrCodeModal
          isOpen={Boolean(selectedQrInv)}
          onClose={() => setSelectedQrInv(null)}
          url={typeof window !== 'undefined' ? `${window.location.origin}/${selectedQrInv.slug}` : `/${selectedQrInv.slug}`}
          title={`${selectedQrInv.groom_name}_${selectedQrInv.bride_name}`}
          slug={selectedQrInv.slug}
        />
      )}

      {/* 서비스 만료일(service_expired_at) 조정 모달 */}
      {selectedExpiryInv && (
        <ExpiryAdjustModal
          key={selectedExpiryInv.id}
          isOpen={Boolean(selectedExpiryInv)}
          onClose={() => setSelectedExpiryInv(null)}
          invitation={selectedExpiryInv}
          onSave={handleUpdateExpiry}
        />
      )}

    </div>
  );
}
