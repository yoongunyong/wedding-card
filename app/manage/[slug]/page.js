'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import QrCodeModal from '@/components/QrCodeModal';

export default function ManageRsvpPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [rsvpList, setRsvpList] = useState([]);
  const [guestbookList, setGuestbookList] = useState([]);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!token) {
        setLoading(false);
        return;
      }

      // 1. 토큰 일치 여부 확인
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

      // 2. RSVP 명단 조회
      const { data: rsvps } = await supabase
        .from('rsvp')
        .select('*')
        .eq('invitation_id', inv.id)
        .order('created_at', { ascending: false });

      setRsvpList(rsvps || []);

      // 3. 방명록 목록 조회
      const { data: guestbooks } = await supabase
        .from('guestbook')
        .select('*')
        .eq('invitation_id', inv.id)
        .order('created_at', { ascending: false });

      setGuestbookList(guestbooks || []);
      setLoading(false);
    }

    loadData();
  }, [slug, token]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500 text-sm">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="text-lg font-bold text-stone-900 mb-1">접근 권한이 없습니다</h1>
        <p className="text-xs text-stone-500">
          올바른 관리용 보안 토큰 링크로 접속해 주세요.
        </p>
      </div>
    );
  }

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
          <span className="text-base shrink-0 mt-0.5 sm:mt-0">💡</span>
          <p className="leading-relaxed text-[12px]">
            예식 일시, 모시는 글, 대표·갤러리 사진, BGM, 계좌번호 등은 상단의 <strong className="text-stone-900 font-semibold">[내용·사진 수정]</strong> 버튼을 통해 언제든 직접 변경하실 수 있습니다. 
            <span className="text-stone-400 block sm:inline sm:ml-1 font-normal">(기존 청첩장 주소와 QR코드는 그대로 영구 유지됩니다)</span>
          </p>
        </div>

        {/* 카카오톡 공유 캐시 갱신 팁 */}
        <div className="mt-2.5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
          <span className="text-sm shrink-0 mt-0.5">💬</span>
          <div>
            <p className="font-semibold text-amber-950 text-[12px]">
              수정 후 카카오톡으로 보냈을 때 이전 사진이나 예식 정보가 뜨나요?
            </p>
            <p className="text-[11px] text-amber-900/90 mt-1 font-light leading-normal">
              카카오톡 서버가 이전 미리보기를 24시간 동안 기억(캐싱)하기 때문입니다. 카카오톡 앱을 완전히 종료 후 다시 열어보시거나,{' '}
              <a 
                href="https://developers.kakao.com/tool/clear/og" 
                target="_blank" 
                rel="noreferrer" 
                className="font-medium underline underline-offset-2 hover:text-black cursor-pointer"
              >
                카카오 캐시 초기화 도구
              </a>
              에서 청첩장 주소를 넣고 [초기화]를 누르시면 새 사진이 즉시 반영됩니다.
            </p>
          </div>
        </div>

        {/* 요약 대시보드 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="p-4 bg-stone-50 rounded-xl text-center border border-stone-100">
            <span className="text-xs text-stone-500">총 응답 수</span>
            <p className="text-xl font-bold text-stone-900 mt-1">{rsvpList.length}건</p>
          </div>
          <div className="p-4 bg-stone-50 rounded-xl text-center border border-stone-100">
            <span className="text-xs text-stone-500">총 참석 인원</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{totalGuests}명</p>
          </div>
          <div className="p-4 bg-stone-50 rounded-xl text-center border border-stone-100">
            <span className="text-xs text-stone-500">신랑측 하객</span>
            <p className="text-xl font-bold text-blue-600 mt-1">{groomGuests}명</p>
          </div>
          <div className="p-4 bg-stone-50 rounded-xl text-center border border-stone-100">
            <span className="text-xs text-stone-500">신부측 하객</span>
            <p className="text-xl font-bold text-rose-500 mt-1">{brideGuests}명</p>
          </div>
        </div>

        {/* 하객 응답 테이블 */}
        {rsvpList.length === 0 ? (
          <div className="border border-stone-200/80 rounded-2xl bg-white shadow-2xs py-12 px-4 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-stone-600">아직 등록된 참석 의사가 없습니다.</p>
            <p className="text-xs text-stone-400 mt-1">하객분들이 청첩장에서 참석 여부를 제출하면 이곳에 실시간으로 집계됩니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone-200/80 rounded-2xl bg-white shadow-2xs">
            <table className="w-full min-w-[720px] text-left text-xs text-stone-600 border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 font-semibold text-stone-700">
                  <th className="py-3 px-3.5 whitespace-nowrap">구분</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">성함</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">연락처</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">참석 여부</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">동행 인원</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">식사 여부</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">전세버스</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">등록일시</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody>
                {rsvpList.map((row) => (
                  <tr key={row.id} className="border-b border-stone-100 hover:bg-stone-50/60 transition-colors">
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap inline-block ${
                        row.side === 'groom' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {row.side === 'groom' ? '신랑측' : '신부측'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 font-semibold text-stone-900 whitespace-nowrap">{row.name}</td>
                    <td className="py-3.5 px-3.5 whitespace-nowrap font-mono">{row.phone || '-'}</td>
                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      {row.attend ? (
                        <span className="text-emerald-600 font-semibold">참석</span>
                      ) : (
                        <span className="text-stone-400">불참</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3.5 text-center font-medium whitespace-nowrap">
                      {row.attend ? (row.companion_count > 0 ? `+${row.companion_count}명` : '0명') : '-'}
                    </td>
                    <td className="py-3.5 px-3.5 text-center font-medium text-stone-700 whitespace-nowrap">
                      {row.attend ? (row.meal || '-') : '-'}
                    </td>
                    <td className="py-3.5 px-3.5 text-center font-medium text-stone-700 whitespace-nowrap">
                      {row.attend ? (row.bus || '-') : '-'}
                    </td>
                    <td className="py-3.5 px-3.5 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
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

        {/* 방명록 관리 섹션 */}
        <div className="pt-8 mt-8 border-t border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                방명록 축하 메시지 관리
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                하객분들이 남겨주신 메시지입니다. 불필요하거나 부적절한 글은 바로 삭제할 수 있습니다.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-full shrink-0">
              총 {guestbookList.length}건
            </span>
          </div>

          {guestbookList.length === 0 ? (
            <div className="border border-stone-200/80 rounded-2xl bg-white shadow-2xs py-12 px-4 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-stone-600">등록된 방명록 메시지가 없습니다.</p>
              <p className="text-xs text-stone-400 mt-1">하객분들이 남겨주시는 따뜻한 축하 글이 이곳에 차례대로 표시됩니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-stone-200/80 rounded-2xl bg-white shadow-2xs">
              <table className="w-full min-w-[560px] text-left text-xs text-stone-600 border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 font-semibold text-stone-700">
                    <th className="py-3 px-3.5 w-24 whitespace-nowrap">작성자</th>
                    <th className="py-3 px-3.5">메시지 내용</th>
                    <th className="py-3 px-3.5 whitespace-nowrap w-36">작성일시</th>
                    <th className="py-3 px-3.5 text-center w-20 whitespace-nowrap">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {guestbookList.map((row) => (
                    <tr key={row.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                      <td className="py-3 px-3 font-semibold text-stone-900 align-top whitespace-nowrap">
                        {row.author}
                      </td>
                      <td className="py-3 px-3 text-stone-700 whitespace-pre-line leading-relaxed align-top break-keep">
                        {row.content}
                      </td>
                      <td className="py-3 px-3 text-stone-500 whitespace-nowrap align-top">
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

      </div>
    </div>
  );
}