'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import QrCodeModal from '@/components/QrCodeModal';
import GuestPhotoManager from '@/components/manage/GuestPhotoManager';

export default function ManageRsvpPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token');

  // 핵심 상태
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [rsvpList, setRsvpList] = useState([]);
  const [guestbookList, setGuestbookList] = useState([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeTab, setActiveTab] = useState('rsvp');

  // 2차 보안 PIN 상태
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showSetPinModal, setShowSetPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [registerPinError, setRegisterPinError] = useState('');

  // 비밀번호 변경 모달 상태
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [changeNewPin, setChangeNewPin] = useState('');
  const [changeNewPinConfirm, setChangeNewPinConfirm] = useState('');
  const [changePinError, setChangePinError] = useState('');
  const [changePinSuccess, setChangePinSuccess] = useState('');

  // 링크 재발급 상태
  const [isReissuing, setIsReissuing] = useState(false);
  const [reissuedModalData, setReissuedModalData] = useState(null);

  // 보호된 데이터 (RSVP, 방명록) 로드 헬퍼
  const loadProtectedData = useCallback(async (invId) => {
    try {
      const [rsvpsRes, guestbooksRes] = await Promise.all([
        supabase
          .from('rsvp')
          .select('*')
          .eq('invitation_id', invId)
          .order('created_at', { ascending: false }),
        supabase
          .from('guestbook')
          .select('*')
          .eq('invitation_id', invId)
          .order('created_at', { ascending: false }),
      ]);

      setRsvpList(rsvpsRes.data || []);
      setGuestbookList(guestbooksRes.data || []);
    } catch (err) {
      console.error('보호된 데이터 로드 실패:', err);
    }
  }, []);

  // 1단계: 링크 토큰 유효성 검증 및 청첩장 기본정보 로드
  useEffect(() => {
    async function checkTokenAndAuth() {
      if (!token) {
        setLoading(false);
        setAuthorized(false);
        return;
      }

      setLoading(true);

      const { data: inv, error: invError } = await supabase
        .from('invitations')
        .select('*')
        .eq('slug', slug)
        .eq('manage_token', token)
        .single();

      if (invError || !inv) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setInvitation(inv);
      setAuthorized(true);

      // 세션 스토리지 기반 2차 인증 상태 확인 (브라우저 세션 유지)
      const sessionKey = `manage_auth_${slug}`;
      const savedAuthToken = typeof window !== 'undefined' ? sessionStorage.getItem(sessionKey) : null;
      const registeredPin = inv.template_config?.manage_password;

      if (savedAuthToken === token) {
        // 이미 본 브라우저 세션에서 PIN 인증을 통과한 경우 즉시 해제
        setIsUnlocked(true);
        await loadProtectedData(inv.id);
      } else if (!registeredPin) {
        // 기존 청첩장이라 PIN이 등록되지 않은 경우: 최초 설정 화면 유도
        setIsUnlocked(false);
        setShowSetPinModal(true);
      } else {
        // PIN이 등록되어 있고 세션에 없으면: 4자리 PIN 입력 요구
        setIsUnlocked(false);
        setShowSetPinModal(false);
      }

      setLoading(false);
    }

    checkTokenAndAuth();
  }, [slug, token, loadProtectedData]);

  // 2차 PIN 검증 제출
  const handleVerifyPin = async (e) => {
    if (e) e.preventDefault();
    if (!invitation) return;

    const registeredPin = invitation.template_config?.manage_password;

    if (!pinInput || pinInput.length !== 4) {
      setPinError('4자리 숫자를 모두 입력해 주세요.');
      return;
    }

    if (pinInput === registeredPin) {
      // 인증 성공
      setPinError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`manage_auth_${slug}`, token);
      }
      setIsUnlocked(true);
      await loadProtectedData(invitation.id);
    } else {
      setPinError('비밀번호가 일치하지 않습니다. 다시 입력해 주세요.');
      setPinInput('');
    }
  };

  // 최초 4자리 PIN 등록 (기존 고객 또는 미설정 시)
  const handleRegisterPin = async (e) => {
    if (e) e.preventDefault();
    if (!invitation) return;

    if (!/^\d{4}$/.test(newPin)) {
      setRegisterPinError('비밀번호는 숫자 4자리로 입력해 주세요.');
      return;
    }

    if (newPin !== newPinConfirm) {
      setRegisterPinError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setRegisterPinError('');

    try {
      const updatedConfig = {
        ...(invitation.template_config || {}),
        manage_password: newPin,
      };

      const { error } = await supabase
        .from('invitations')
        .update({ template_config: updatedConfig })
        .eq('id', invitation.id);

      if (error) {
        console.error('PIN 등록 오류:', error);
        setRegisterPinError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
        return;
      }

      // 등록 성공 시 상태 및 세션 갱신
      setInvitation((prev) => ({ ...prev, template_config: updatedConfig }));
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`manage_auth_${slug}`, token);
      }
      setIsUnlocked(true);
      setShowSetPinModal(false);
      await loadProtectedData(invitation.id);
    } catch (err) {
      console.error(err);
      setRegisterPinError('오류가 발생했습니다.');
    }
  };

  // 2차 비밀번호 변경 처리 (관리 화면 내부에서 실행)
  const handleChangePin = async (e) => {
    if (e) e.preventDefault();
    if (!invitation) return;

    const registeredPin = invitation.template_config?.manage_password;
    if (registeredPin && currentPinInput !== registeredPin) {
      setChangePinError('현재 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!/^\d{4}$/.test(changeNewPin)) {
      setChangePinError('새 비밀번호는 숫자 4자리로 입력해 주세요.');
      return;
    }

    if (changeNewPin !== changeNewPinConfirm) {
      setChangePinError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setChangePinError('');

    try {
      const updatedConfig = {
        ...(invitation.template_config || {}),
        manage_password: changeNewPin,
      };

      const { error } = await supabase
        .from('invitations')
        .update({ template_config: updatedConfig })
        .eq('id', invitation.id);

      if (error) {
        setChangePinError('변경 중 오류가 발생했습니다.');
        return;
      }

      setInvitation((prev) => ({ ...prev, template_config: updatedConfig }));
      setChangePinSuccess('비밀번호가 성공적으로 변경되었습니다!');
      setTimeout(() => {
        setShowChangePinModal(false);
        setCurrentPinInput('');
        setChangeNewPin('');
        setChangeNewPinConfirm('');
        setChangePinSuccess('');
      }, 1200);
    } catch (err) {
      console.error(err);
      setChangePinError('오류가 발생했습니다.');
    }
  };

  // 원클릭 보안 관리 링크 재발급 (기존 토큰 즉시 무효화)
  const handleReissueManageToken = async () => {
    if (!invitation) return;

    const confirmed = confirm(
      '⚠️ [보안 주의] 관리 링크를 재발급하시겠습니까?\n\n' +
      '• 새 링크가 발급되는 즉시 기존 링크는 영구 무효화되어 더 이상 접속할 수 없습니다.\n' +
      '• 단톡방이나 외부에 노출된 기존 링크의 접속을 완벽하게 차단할 수 있습니다.\n\n' +
      '정말 새 링크로 재발급하시겠습니까?'
    );

    if (!confirmed) return;

    setIsReissuing(true);

    try {
      const newToken = crypto.randomUUID();

      const { error } = await supabase
        .from('invitations')
        .update({ manage_token: newToken })
        .eq('id', invitation.id);

      if (error) {
        console.error('링크 재발급 오류:', error);
        alert('링크 재발급 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        setIsReissuing(false);
        return;
      }

      // 새 토큰으로 상태 및 세션 갱신
      setToken(newToken);
      setInvitation((prev) => ({ ...prev, manage_token: newToken }));
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`manage_auth_${slug}`, newToken);
        const origin = window.location.origin;
        const newManageUrl = `${origin}/manage/${slug}?token=${newToken}`;
        
        // 브라우저 주소창 URL 교체 (페이지 새로고침 없이)
        window.history.replaceState(null, '', newManageUrl);

        // 클립보드 자동 복사 시도
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(newManageUrl);
          }
        } catch (clipErr) {
          console.warn('클립보드 자동 복사 실패:', clipErr);
        }

        // 완료 모달 띄우기
        setReissuedModalData({
          newUrl: newManageUrl,
          newToken: newToken,
        });
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    } finally {
      setIsReissuing(false);
    }
  };

  // 통계 계산
  const attendingList = rsvpList.filter((r) => r.attend);
  const totalGuests = attendingList.reduce((acc, cur) => acc + 1 + (cur.companion_count || 0), 0);
  const groomGuests = attendingList.filter((r) => r.side === 'groom').reduce((acc, cur) => acc + 1 + (cur.companion_count || 0), 0);
  const brideGuests = attendingList.filter((r) => r.side === 'bride').reduce((acc, cur) => acc + 1 + (cur.companion_count || 0), 0);

  // 한국 시간 포맷팅 헬퍼 (YYYY.MM.DD HH:mm)
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${y}.${m}.${day} ${hours}:${minutes}`;
  };

  // CSV 엑셀 다운로드 (UTF-8 BOM 포함)
  const downloadCSV = () => {
    if (rsvpList.length === 0) return alert('다운로드할 참석자 내역이 없습니다.');

    const headers = ['구분', '성함', '연락처', '참석여부', '동행인원', '식사여부', '전세버스', '등록일시'];
    const rows = rsvpList.map((r) => [
      r.side === 'groom' ? '신랑측' : '신부측',
      r.name,
      r.phone || '-',
      r.attend ? '참석' : '불참',
      r.attend ? (r.companion_count || 0) : '-',
      r.attend ? (r.meal || '-') : '-',
      r.attend ? (r.bus || '-') : '-',
      new Date(r.created_at).toLocaleString('ko-KR'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${invitation.groom_name}_${invitation.bride_name}_하객명단.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 관리자 RSVP 참석 정보 삭제
  const handleDeleteRsvp = async (id, name) => {
    if (!confirm(`'${name}' 님의 참석 정보를 정말 삭제하시겠습니까?`)) {
      return;
    }

    const { error } = await supabase
      .from('rsvp')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('RSVP 삭제 오류:', error);
      alert('삭제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } else {
      setRsvpList((prev) => prev.filter((item) => item.id !== id));
      alert('참석 정보가 삭제되었습니다.');
    }
  };

  // 관리자 방명록 삭제 (비밀번호 불필요)
  const handleDeleteGuestbook = async (id, author) => {
    if (!confirm(`'${author}' 님의 방명록을 정말 삭제하시겠습니까?`)) {
      return;
    }

    const { error } = await supabase
      .from('guestbook')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('방명록 삭제 오류:', error);
      alert('삭제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } else {
      setGuestbookList((prev) => prev.filter((item) => item.id !== id));
      alert('방명록이 삭제되었습니다.');
    }
  };

  // 1. 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500 text-sm">
        데이터를 안전하게 불러오는 중입니다...
      </div>
    );
  }

  // 2. 권한 없음 (잘못된 토큰 or 기존 토큰 폐기됨)
  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200/60 flex items-center justify-center text-2xl mb-4 shadow-xs">
          🔒
        </div>
        <h1 className="text-lg font-bold text-stone-900 mb-1.5">관리 페이지 접근 권한이 없습니다</h1>
        <p className="text-xs text-stone-500 max-w-sm leading-relaxed mb-4">
          올바른 관리용 보안 링크로 접속해 주세요.<br />
          보안 링크를 재발급받으셨다면 새 링크를 확인해 주시기 바랍니다.
        </p>
        <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-stone-600 max-w-xs">
          링크를 분실하셨다면 <a href="http://pf.kakao.com/_RJamX/chat" target="_blank" rel="noreferrer" className="text-amber-700 underline font-semibold">카카오톡 고객센터</a>로 문의해 주세요.
        </div>
      </div>
    );
  }

  // 3. 2차 보안 PIN 인증 대기 화면 (미인증 상태)
  if (!isUnlocked) {
    // 3-A. 최초 비밀번호 설정 유도 모달/화면 (기존 청첩장 등 PIN 미설정 시)
    if (showSetPinModal) {
      return (
        <div className="min-h-screen bg-stone-100 py-12 px-4 flex justify-center items-center">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-stone-200/80 p-7 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-2xl mb-4 shadow-2xs">
              🛡️
            </div>
            <div className="inline-flex items-center text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full mb-2">
              SECURITY SETUP
            </div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">
              둘만의 4자리 비밀번호 등록
            </h1>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              신랑·신부 관리 페이지를 안전하게 보호하기 위해<br />
              <strong className="text-stone-800 font-medium">지인이 알 수 없는 둘만의 4자리 PIN</strong>을 설정해 주세요.
            </p>

            <form onSubmit={handleRegisterPin} className="mt-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  4자리 비밀번호 (숫자)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="예: 2504 (둘만의 기념일 등)"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-center text-lg font-mono tracking-widest text-stone-900 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="한 번 더 입력해 주세요"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-center text-lg font-mono tracking-widest text-stone-900 focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                />
              </div>

              {registerPinError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-600 text-xs text-center font-medium">
                  {registerPinError}
                </div>
              )}

              <button
                type="submit"
                disabled={newPin.length !== 4 || newPinConfirm.length !== 4}
                className="w-full py-3.5 bg-stone-900 hover:bg-black disabled:bg-stone-300 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed mt-2"
              >
                비밀번호 등록 및 관리 페이지 입장
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-stone-100 text-[11px] text-stone-400">
              설정한 비밀번호는 언제든 관리 페이지 및 수정 화면에서 변경하실 수 있습니다.
            </div>
          </div>
        </div>
      );
    }

    // 3-B. 2차 보안 PIN 번호 입력 화면
    return (
      <div className="min-h-screen bg-stone-100 py-12 px-4 flex justify-center items-center">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border border-stone-200/80 p-7 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-900 text-white flex items-center justify-center text-2xl mb-4 shadow-sm">
            🔒
          </div>
          <div className="inline-flex items-center text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 bg-stone-100 text-stone-600 rounded-full mb-2">
            2-FACTOR AUTH
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            신랑·신부 2차 보안 인증
          </h1>
          <p className="text-xs text-stone-500 mt-2 leading-relaxed">
            {invitation.groom_name} &middot; {invitation.bride_name} 님의 소중한 하객 정보 보호를 위해<br />
            <strong className="text-stone-800 font-medium">4자리 비밀번호</strong>를 입력해 주세요.
          </p>

          <form onSubmit={handleVerifyPin} className="mt-6 space-y-4">
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinInput(val);
                  if (val.length === 4) {
                    setPinError('');
                  }
                }}
                placeholder="••••"
                className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-center text-2xl font-mono tracking-[0.5em] text-stone-900 focus:outline-none focus:border-stone-900 focus:bg-white transition-all"
                autoFocus
              />
            </div>

            {pinError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-600 text-xs font-medium">
                {pinError}
              </div>
            )}

            <button
              type="submit"
              disabled={pinInput.length !== 4}
              className="w-full py-3.5 bg-stone-900 hover:bg-black disabled:bg-stone-300 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              인증하고 입장하기
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col items-center gap-1.5 text-xs text-stone-500">
            <span>비밀번호를 잊으셨나요?</span>
            <a
              href="http://pf.kakao.com/_RJamX/chat"
              target="_blank"
              rel="noreferrer"
              className="text-amber-700 hover:text-amber-800 font-medium underline inline-flex items-center gap-1"
            >
              <span>카카오톡 고객센터로 문의하기</span>
              <span className="text-[10px]">↗</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 4. 인증 통과 후 관리자 대시보드 렌더링
  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        
        {/* 상단 헤더 */}
        <div className="pb-6 border-b border-stone-200/80">
          {/* 1행: 뱃지 & 청첩장 바로가기 링크 */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 bg-stone-100 text-stone-600 rounded-md whitespace-nowrap">
              신랑·신부 전용 관리 페이지
            </span>
            <Link
              href={`/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors shrink-0"
            >
              <span>내 청첩장 바로보기</span>
              <span className="text-[10px] opacity-70">↗</span>
            </Link>
          </div>

          {/* 2행: 메인 타이틀 */}
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            {invitation.groom_name} &middot; {invitation.bride_name} 참석자 현황
          </h1>

          {/* 3행: 3등분 균형 액션 툴바 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 mt-4">
            <Link
              href={`/manage/${slug}/edit?token=${token}`}
              className="px-3.5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <span>✏️</span>
              <span>내용·사진 수정</span>
            </Link>
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200/90 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>종이 QR코드</span>
            </button>
            <button
              onClick={downloadCSV}
              className="px-3.5 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200/90 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <span>📊</span>
              <span>엑셀 다운로드</span>
            </button>
          </div>

          {/* 4행: 보안 안심 컨트롤 바 (2차 PIN 변경 & 원클릭 링크 재발급) */}
          <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>2차 보안 인증 보호 중</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowChangePinModal(true)}
                className="px-2.5 py-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200/70 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <span>🔒</span>
                <span>비밀번호 변경</span>
              </button>
              <button
                type="button"
                onClick={handleReissueManageToken}
                disabled={isReissuing}
                className="px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:text-rose-800 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200/60 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
              >
                <span>🔄</span>
                <span>{isReissuing ? '재발급 중...' : '관리 링크 재발급'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 카카오톡 1:1 고객센터 바로가기 배너 */}
        <div className="mt-4 p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs text-stone-700">
          <div className="flex items-center gap-2">
            <span>💬</span>
            <span className="font-medium text-[12px]">이용 중 문의사항이나 도움이 필요하신가요?</span>
          </div>
          <a
            href="http://pf.kakao.com/_RJamX/chat"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-medium rounded-lg text-[11px] shadow-2xs transition-transform active:scale-95 shrink-0"
          >
            카카오톡 1:1 문의
          </a>
        </div>

        {/* 상단 안내 배너 */}
        <div className="mt-4 p-3.5 bg-stone-50 border border-stone-200/70 rounded-xl flex items-start sm:items-center gap-2.5 text-xs text-stone-600">
          <span className="text-base shrink-0">💡</span>
          <div className="leading-relaxed">
            <span className="font-semibold text-stone-800">실시간 연동 안내:</span> 하객들이 모바일 청첩장에서 등록한 참석 정보, 축하 방명록, 현장 스냅 사진이 실시간으로 집계됩니다.
          </div>
        </div>

        {/* 3단 전환 탭 세그먼트 (참석자 명단 / 축하 방명록 / 📷 하객 포토 스냅) */}
        <div className="mt-6 flex border-b border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('rsvp')}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'rsvp'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <span className="whitespace-nowrap sm:hidden">참석자</span>
            <span className="whitespace-nowrap hidden sm:inline">참석자 명단</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
              activeTab === 'rsvp' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
            }`}>
              {rsvpList.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guestbook')}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'guestbook'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <span className="whitespace-nowrap sm:hidden">방명록</span>
            <span className="whitespace-nowrap hidden sm:inline">축하 방명록</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
              activeTab === 'guestbook' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
            }`}>
              {guestbookList.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'photos'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <span className="whitespace-nowrap sm:hidden">📷 사진스냅</span>
            <span className="whitespace-nowrap hidden sm:inline">📷 하객 포토 스냅</span>
            <span className="text-[10px] px-1 py-0.2 bg-rose-50 text-rose-600 border border-rose-200/60 rounded font-semibold shrink-0">
              NEW
            </span>
          </button>
        </div>

        {/* 1. 참석자 명단 탭 */}
        {activeTab === 'rsvp' && (
          <div>
            {/* 통계 요약 카드 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
              <div className="bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/60 text-center">
                <span className="text-[11px] text-stone-500 font-medium block">총 응답</span>
                <span className="text-xl font-bold text-stone-900 mt-0.5 block">{rsvpList.length}명</span>
              </div>
              <div className="bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/60 text-center">
                <span className="text-[11px] text-stone-500 font-medium block">총 참석 예정</span>
                <span className="text-xl font-bold text-stone-900 mt-0.5 block">{totalGuests}명</span>
              </div>
              <div className="bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/60 text-center">
                <span className="text-[11px] text-stone-500 font-medium block">신랑측 (동행포함)</span>
                <span className="text-xl font-bold text-stone-900 mt-0.5 block">{groomGuests}명</span>
              </div>
              <div className="bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/60 text-center">
                <span className="text-[11px] text-stone-500 font-medium block">신부측 (동행포함)</span>
                <span className="text-xl font-bold text-stone-900 mt-0.5 block">{brideGuests}명</span>
              </div>
            </div>

            {/* 참석자 테이블 */}
            {rsvpList.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                아직 등록된 참석 정보가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto border border-stone-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">구분</th>
                      <th className="py-2.5 px-3">성함</th>
                      <th className="py-2.5 px-3">연락처</th>
                      <th className="py-2.5 px-3 text-center">참석</th>
                      <th className="py-2.5 px-3 text-center">동행</th>
                      <th className="py-2.5 px-3 text-center">식사</th>
                      <th className="py-2.5 px-3 text-center">버스</th>
                      <th className="py-2.5 px-3 text-right">등록일</th>
                      <th className="py-2.5 px-3 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rsvpList.map((row) => (
                      <tr key={row.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              row.side === 'groom' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                            }`}
                          >
                            {row.side === 'groom' ? '신랑측' : '신부측'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-900 whitespace-nowrap">{row.name}</td>
                        <td className="py-3 px-3 text-stone-600 whitespace-nowrap">{row.phone || '-'}</td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {row.attend ? (
                            <span className="text-emerald-700 font-semibold">참석</span>
                          ) : (
                            <span className="text-stone-400">불참</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {row.attend ? `${(row.companion_count || 0)}명` : '-'}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {row.attend ? row.meal || '-' : '-'}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {row.attend ? row.bus || '-' : '-'}
                        </td>
                        <td className="py-3 px-3 text-right text-stone-400 text-[11px] whitespace-nowrap">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteRsvp(row.id, row.name)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium rounded text-[11px] transition-colors cursor-pointer"
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
        )}

        {/* 2. 방명록 탭 */}
        {activeTab === 'guestbook' && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-stone-900">
                축하 방명록 ({guestbookList.length}개)
              </h2>
            </div>

            {guestbookList.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                아직 등록된 축하 방명록이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto border border-stone-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">작성자</th>
                      <th className="py-2.5 px-3">축하 메시지</th>
                      <th className="py-2.5 px-3 text-right">작성일</th>
                      <th className="py-2.5 px-3 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {guestbookList.map((row) => (
                      <tr key={row.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-stone-900 whitespace-nowrap align-top">
                          {row.author}
                        </td>
                        <td className="py-3 px-3 text-stone-700 leading-relaxed max-w-xs sm:max-w-md break-words align-top">
                          {row.message}
                        </td>
                        <td className="py-3 px-3 text-right text-stone-400 text-[11px] whitespace-nowrap align-top">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="py-3 px-3 text-center align-top whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteGuestbook(row.id, row.author)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium rounded text-[11px] transition-colors cursor-pointer"
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
        )}

        {/* 3. 하객 포토 스냅 탭 */}
        {activeTab === 'photos' && (
          <div>
            <GuestPhotoManager invitation={invitation} />
          </div>
        )}

        {/* 종이 청첩장용 QR코드 모달 */}
        {invitation && (
          <QrCodeModal
            isOpen={showQrModal}
            onClose={() => setShowQrModal(false)}
            url={typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`}
            title={`${invitation.groom_name}_${invitation.bride_name}`}
            slug={slug}
          />
        )}

        {/* ========================================================
            비밀번호 변경 모달
           ======================================================== */}
        {showChangePinModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setShowChangePinModal(false)}
          >
            <div 
              className="bg-white w-full max-w-sm rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 text-left animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔒</span>
                  <h3 className="text-base font-bold text-stone-900">2차 비밀번호 변경</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChangePinModal(false)}
                  className="text-stone-400 hover:text-stone-700 text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleChangePin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4자리 숫자"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm font-mono tracking-widest focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    새 비밀번호 (숫자 4자리)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={changeNewPin}
                    onChange={(e) => setChangeNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="새로운 4자리 숫자"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm font-mono tracking-widest focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={changeNewPinConfirm}
                    onChange={(e) => setChangeNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="한 번 더 입력"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm font-mono tracking-widest focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
                  />
                </div>

                {changePinError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-600 text-xs font-medium">
                    {changePinError}
                  </div>
                )}

                {changePinSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-700 text-xs font-medium">
                    {changePinSuccess}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowChangePinModal(false)}
                    className="px-4 py-2.5 text-xs text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    변경 저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            관리 링크 재발급 완료 안내 모달
           ======================================================== */}
        {reissuedModalData && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setReissuedModalData(null)}
          >
            <div 
              className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 text-center animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-2xl mb-4 shadow-2xs">
                ✨
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                새 관리 링크 발급 완료
              </h3>
              <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                기존 관리 링크는 <strong className="text-rose-600 font-semibold">즉시 무효화(폐기)</strong>되었으며,<br />
                새로운 링크가 클립보드에 복사되었습니다.
              </p>

              <div className="mt-4 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-left">
                <span className="block text-[11px] font-semibold text-stone-500 mb-1">
                  새 관리 링크 URL
                </span>
                <p className="text-xs font-mono text-stone-800 break-all select-all leading-snug">
                  {reissuedModalData.newUrl}
                </p>
              </div>

              <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 text-left leading-relaxed">
                📌 <strong>보관 권장:</strong> 새 관리 링크를 카카오톡 [나와의 채팅방] 또는 메모장에 꼭 저장해 두세요.
              </div>

              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (navigator?.clipboard?.writeText) {
                        await navigator.clipboard.writeText(reissuedModalData.newUrl);
                        alert('새 관리 링크가 클립보드에 복사되었습니다.');
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="flex-1 py-3 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-xl border border-stone-200 transition-colors cursor-pointer"
                >
                  📋 링크 다시 복사
                </button>
                <button
                  type="button"
                  onClick={() => setReissuedModalData(null)}
                  className="flex-1 py-3 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  확인 완료
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
