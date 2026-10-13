'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import QrCodeModal from '@/components/QrCodeModal';
import ExpiryAdjustModal from '@/components/ExpiryAdjustModal';

// 관리자 로그인용 기본 비밀번호 (환경변수 또는 로컬 설정)
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'weddingadmin1234!';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState('codes'); // 'codes' | 'invitations'

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
        .select('id, slug, groom_name, bride_name, wedding_date, template_type, is_active, template_config, order_code, created_at, manage_token, service_expired_at')
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
          supabase.from('invitations').select('id, slug, groom_name, bride_name, wedding_date, template_type, is_active, template_config, order_code, created_at, manage_token, service_expired_at').order('created_at', { ascending: false }),
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
    if (passwordInput === ADMIN_PASSWORD) {
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
            ATELIER DE MARIAGE
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
    <div className="min-h-screen bg-[#F6F5F2] py-10 px-4 sm:px-8 text-stone-900 font-sans">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        
        {/* 상단 네비게이션 헤더 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest text-white bg-stone-900 px-2.5 py-0.5 rounded-full font-semibold uppercase">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-stone-400 font-mono">ATELIER MASTER</span>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-900">제작된 청첩장 목록</h3>
                <p className="text-xs text-stone-500 font-light">
                  지인이 코드 없이 제작한 경우, 아래 활성화 스위치를 켜주시면 즉시 워터마크가 제거되고 정식 오픈됩니다.
                </p>
              </div>
              <button
                onClick={loadInvitations}
                className="text-xs text-stone-400 hover:text-stone-700 font-mono underline"
              >
                새로고침
              </button>
            </div>

            {loadingInvs ? (
              <p className="text-center py-10 text-xs text-stone-400">청첩장 목록을 불러오고 있습니다...</p>
            ) : invitations.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                제작된 청첩장이 아직 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full min-w-[1080px] text-left text-xs text-stone-700 border-collapse">
                  <thead className="bg-[#FAFAF9] text-stone-500 uppercase font-mono text-[11px] border-b border-stone-200/80">
                    <tr>
                      <th className="py-3.5 px-4 whitespace-nowrap font-medium">신랑 & 신부</th>
                      <th className="py-3.5 px-4 whitespace-nowrap font-medium">시안</th>
                      <th className="py-3.5 px-4 whitespace-nowrap font-medium">예식 일시</th>
                      <th className="py-3.5 px-4 whitespace-nowrap font-medium">서비스 만료일</th>
                      <th className="py-3.5 px-4 whitespace-nowrap font-medium">영문 주소 (URL)</th>
                      <th className="py-3.5 px-4 whitespace-nowrap font-medium">정식 활성화 상태</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {invitations.map((inv) => {
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

                      return (
                        <tr key={inv.id} className="hover:bg-stone-50/70 transition-colors">
                          {/* 1. 신랑 & 신부 */}
                          <td className="py-4 px-4 whitespace-nowrap font-semibold text-stone-900 text-sm">
                            {inv.groom_name} & {inv.bride_name}
                          </td>

                          {/* 2. 시안 */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-medium border border-stone-200/60 inline-block">
                              {inv.template_type === 'playlist' ? '시안 3 (플레이리스트)' : inv.template_type === 'editorial' ? '시안 2 (에디토리얼)' : '시안 1 (모던)'}
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

                          {/* 6. 정식 활성화 상태 (슬림 & 세련된 스위치 버튼) */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <button
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

                          {/* 7. 관리 버튼 그룹 */}
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
