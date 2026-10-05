'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';

export default function ManageRsvpPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [rsvpList, setRsvpList] = useState([]);

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
      setLoading(false);
    }

    loadData();
  }, [slug, token]);

  // 통계 계산
  const attendingList = rsvpList.filter((r) => r.attend);
  const totalGuests = attendingList.reduce((acc, cur) => acc + 1 + (cur.companion_count || 0), 0);
  const mealYesCount = attendingList.filter((r) => r.meal === 'yes').reduce((acc, cur) => acc + 1 + (cur.companion_count || 0), 0);
  const mealNoCount = attendingList.filter((r) => r.meal === 'no').reduce((acc, cur) => acc + 1 + (cur.companion_count || 0), 0);

  // CSV 엑셀 다운로드 (UTF-8 BOM 포함)
  const downloadCSV = () => {
    if (rsvpList.length === 0) return alert('다운로드할 참석자 내역이 없습니다.');

    const headers = ['구분', '성함', '연락처', '참석여부', '동행인원', '식사여부', '메모', '등록일시'];
    const rows = rsvpList.map((r) => [
      r.side === 'groom' ? '신랑측' : '신부측',
      r.name,
      r.phone || '-',
      r.attend ? '참석' : '불참',
      r.companion_count || 0,
      r.meal === 'yes' ? '식사함' : r.meal === 'no' ? '식사안함' : '미정',
      `"${(r.memo || '').replace(/"/g, '""')}"`,
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-stone-200 gap-4">
          <div>
            <span className="text-xs font-semibold px-2 py-1 bg-stone-100 text-stone-600 rounded">
              신랑·신부 전용 관리 페이지
            </span>
            <h1 className="text-xl font-bold text-stone-900 mt-2">
              {invitation.groom_name} &middot; {invitation.bride_name} 참석자 현황
            </h1>
          </div>
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shrink-0"
          >
            <span>📊</span>
            <span>엑셀(CSV) 다운로드</span>
          </button>
        </div>

        {/* 요약 대시보드 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="p-4 bg-stone-50 rounded-xl text-center">
            <span className="text-xs text-stone-500">총 응답 수</span>
            <p className="text-xl font-bold text-stone-900 mt-1">{rsvpList.length}건</p>
          </div>
          <div className="p-4 bg-stone-50 rounded-xl text-center">
            <span className="text-xs text-stone-500">예상 참석 인원</span>
            <p className="text-xl font-bold text-stone-900 mt-1">{totalGuests}명</p>
          </div>
          <div className="p-4 bg-stone-50 rounded-xl text-center">
            <span className="text-xs text-stone-500">식사 희망</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{mealYesCount}명</p>
          </div>
          <div className="p-4 bg-stone-50 rounded-xl text-center">
            <span className="text-xs text-stone-500">식사 안함</span>
            <p className="text-xl font-bold text-stone-500 mt-1">{mealNoCount}명</p>
          </div>
        </div>

        {/* 하객 응답 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600 border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-700">
                <th className="py-2.5 px-3">구분</th>
                <th className="py-2.5 px-3">성함</th>
                <th className="py-2.5 px-3">연락처</th>
                <th className="py-2.5 px-3 text-center">참석</th>
                <th className="py-2.5 px-3 text-center">동행</th>
                <th className="py-2.5 px-3 text-center">식사</th>
                <th className="py-2.5 px-3">메모</th>
              </tr>
            </thead>
            <tbody>
              {rsvpList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    아직 등록된 참석 의사가 없습니다.
                  </td>
                </tr>
              ) : (
                rsvpList.map((row) => (
                  <tr key={row.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                    <td className="py-3 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                        row.side === 'groom' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {row.side === 'groom' ? '신랑측' : '신부측'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-900">{row.name}</td>
                    <td className="py-3 px-3">{row.phone || '-'}</td>
                    <td className="py-3 px-3 text-center">
                      {row.attend ? (
                        <span className="text-emerald-600 font-semibold">참석</span>
                      ) : (
                        <span className="text-stone-400">불참</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-medium">{row.companion_count}명</td>
                    <td className="py-3 px-3 text-center">
                      {row.meal === 'yes' ? '식사' : row.meal === 'no' ? '안함' : '미정'}
                    </td>
                    <td className="py-3 px-3 max-w-[150px] truncate text-stone-500" title={row.memo}>
                      {row.memo || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}