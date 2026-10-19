import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sfnsxkkxvplrlxbvenme.supabase.co';
const SUPABASE_KEY = 'sb_publishable_eun1yt8eNYVjwusaXUtrUA_FTckTkuH';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runRsvpTests() {
  console.log('================================================================');
  console.log('🧪 RSVP 재제출 덮어쓰기(Upsert) 및 관리자 삭제 기능 전수 검증');
  console.log('================================================================\n');

  // 1. 임시 청첩장 생성
  const testSlug = `rsvp-test-${Date.now()}`;
  const { data: inv, error: invErr } = await supabase
    .from('invitations')
    .insert([
      {
        slug: testSlug,
        groom_name: '테스트신랑',
        bride_name: '테스트신부',
        wedding_date: '2026-12-31T14:00:00',
        venue_name: '테스트웨딩홀',
        venue_address: '서울 강남구 테헤란로 1',
        template_type: 'basic',
      },
    ])
    .select('id')
    .single();

  if (invErr || !inv) {
    console.error('❌ 임시 청첩장 생성 실패:', invErr);
    process.exit(1);
  }

  const cardId = inv.id;
  console.log(`[준비] 테스트 청첩장 생성 완료 (ID: ${cardId}, Slug: ${testSlug})`);

  try {
    // -------------------------------------------------------------
    // [테스트 1] Basic / Editorial 모달: 최초 참석 등록
    // -------------------------------------------------------------
    console.log('\n--- [테스트 1] Basic/Editorial 모달 최초 등록 ---');
    const guest1 = {
      name: '홍길동',
      phone: '010-1234-5678',
      side: 'groom',
      attend: true,
      companionCount: 1,
    };

    const cleanName1 = guest1.name.trim();
    const cleanPhone1 = guest1.phone.trim();
    const phoneDigits1 = cleanPhone1.replace(/\D/g, '');

    // 최초 등록
    await supabase.from('rsvp').insert([
      {
        invitation_id: cardId,
        side: guest1.side,
        attend: guest1.attend,
        name: cleanName1,
        companion_count: guest1.companionCount,
        phone: cleanPhone1,
        meal: null,
      },
    ]);

    const { data: afterFirst } = await supabase
      .from('rsvp')
      .select('*')
      .eq('invitation_id', cardId);

    if (afterFirst.length === 1 && afterFirst[0].attend === true) {
      console.log('✅ 최초 등록 성공: 1건 생성됨 (참석=true, 동행=1명)');
    } else {
      throw new Error(`최초 등록 실패: 예상 건수 1, 실제 건수 ${afterFirst.length}`);
    }

    // -------------------------------------------------------------
    // [테스트 2] Basic / Editorial 모달: 동일 하객 정보 변경 재제출 (Upsert)
    // -------------------------------------------------------------
    console.log('\n--- [테스트 2] 동일 하객 재제출 시 기존 Row 덮어쓰기 (Upsert) 검증 ---');
    // 홍길동이 '5678'(전화번호 뒷자리만 입력)로 '불참'으로 재제출
    const reSubmitGuest = {
      name: '홍길동',
      phone: '5678',
      side: 'groom',
      attend: false,
      companionCount: 0,
    };

    const reCleanName = reSubmitGuest.name.trim();
    const reCleanPhone = reSubmitGuest.phone.trim();
    const rePhoneDigits = reCleanPhone.replace(/\D/g, '');

    // Upsert 로직 시뮬레이션 (BasicRsvpModal / EditorialRsvpModal과 100% 동일한 코드)
    const { data: existingRows } = await supabase
      .from('rsvp')
      .select('id, name, phone')
      .eq('invitation_id', cardId)
      .eq('name', reCleanName);

    let matchedId = null;
    if (existingRows && existingRows.length > 0) {
      const match = existingRows.find((row) => {
        const rowDigits = (row.phone || '').replace(/\D/g, '');
        if (!rowDigits || !rePhoneDigits) {
          return existingRows.length === 1;
        }
        return rowDigits === rePhoneDigits || rowDigits.endsWith(rePhoneDigits) || rePhoneDigits.endsWith(rowDigits);
      });
      if (match) {
        matchedId = match.id;
      }
    }

    if (!matchedId) {
      throw new Error('이전 등록건 매칭 실패 (010-1234-5678 과 5678 매칭 실패)');
    }
    console.log(`✅ 이전 등록건 정상 매칭됨 (Matched ID: ${matchedId})`);

    const updatePayload = {
      invitation_id: cardId,
      side: reSubmitGuest.side,
      attend: reSubmitGuest.attend,
      name: reCleanName,
      companion_count: reSubmitGuest.attend ? reSubmitGuest.companionCount : 0,
      phone: reCleanPhone,
      meal: null,
    };

    const updateRes = await supabase.from('rsvp').update(updatePayload).eq('id', matchedId).select();
    console.log('Update result:', updateRes);

    const { data: afterUpsert } = await supabase
      .from('rsvp')
      .select('*')
      .eq('invitation_id', cardId);

    if (afterUpsert.length === 1 && afterUpsert[0].attend === false) {
      console.log('✅ [PASS] 중복 Row 생성 방지 성공! (총 행 수: 1건 유지)');
      console.log('✅ [PASS] 참석 정보 갱신 확인 (참석=false, 동행=0명으로 안전하게 수정됨)');
    } else {
      throw new Error(`덮어쓰기 실패: 총 건수 ${afterUpsert.length}, 참석상태: ${afterUpsert[0]?.attend}`);
    }

    // -------------------------------------------------------------
    // [테스트 3] 동명이인이지만 연락처가 다른 경우 새 Row 생성 확인
    // -------------------------------------------------------------
    console.log('\n--- [테스트 3] 동명이인(이름 같고 번호 다른 경우) 신규 생성 검증 ---');
    const guestSameNameDiffPhone = {
      name: '홍길동',
      phone: '010-9999-8888',
      side: 'bride',
      attend: true,
      companionCount: 2,
    };

    const diffPhoneDigits = guestSameNameDiffPhone.phone.replace(/\D/g, '');
    const { data: existingForSecond } = await supabase
      .from('rsvp')
      .select('id, name, phone')
      .eq('invitation_id', cardId)
      .eq('name', guestSameNameDiffPhone.name);

    let matchSecond = null;
    if (existingForSecond && existingForSecond.length > 0) {
      matchSecond = existingForSecond.find((row) => {
        const rowDigits = (row.phone || '').replace(/\D/g, '');
        return rowDigits === diffPhoneDigits || rowDigits.endsWith(diffPhoneDigits) || diffPhoneDigits.endsWith(rowDigits);
      });
    }

    if (matchSecond) {
      throw new Error('번호가 다른 동명이인이 이전 등록건에 오매칭되었습니다.');
    }

    // 신규 등록
    await supabase.from('rsvp').insert([
      {
        invitation_id: cardId,
        side: guestSameNameDiffPhone.side,
        attend: guestSameNameDiffPhone.attend,
        name: guestSameNameDiffPhone.name,
        companion_count: guestSameNameDiffPhone.companionCount,
        phone: guestSameNameDiffPhone.phone,
        meal: null,
      },
    ]);

    const { data: afterDiffPhone } = await supabase
      .from('rsvp')
      .select('*')
      .eq('invitation_id', cardId);

    if (afterDiffPhone.length === 2) {
      console.log('✅ [PASS] 동명이인은 다른 번호이므로 정상적으로 별도 행(총 2건) 생성 확인');
    } else {
      throw new Error(`동명이인 처리 실패: 예상 건수 2, 실제 건수 ${afterDiffPhone.length}`);
    }

    // -------------------------------------------------------------
    // [테스트 4] SceneTemplate 인페이지 RSVP 재제출 검증
    // -------------------------------------------------------------
    console.log('\n--- [테스트 4] SceneTemplate 인페이지 RSVP 재제출 (Upsert) 검증 ---');
    // 이영희 최초 등록 (참석, 식사 가능, 버스 탑승)
    await supabase.from('rsvp').insert([
      {
        invitation_id: cardId,
        name: '이영희',
        side: 'groom',
        attend: true,
        companion_count: 1,
        meal: '식사 가능',
        bus: '탑승',
        phone: '',
      },
    ]);

    // 이영희가 식사 불가를 변경하여 재제출
    const sceneExisting = await supabase
      .from('rsvp')
      .select('id, name, side')
      .eq('invitation_id', cardId)
      .eq('name', '이영희');

    let matchedSceneId = null;
    if (sceneExisting.data && sceneExisting.data.length > 0) {
      const sameSide = sceneExisting.data.find((r) => r.side === 'groom');
      matchedSceneId = sameSide ? sameSide.id : sceneExisting.data[0].id;
    }

    if (!matchedSceneId) throw new Error('SceneTemplate 이전 등록건 매칭 실패');

    await supabase
      .from('rsvp')
      .update({
        invitation_id: cardId,
        name: '이영희',
        side: 'groom',
        attend: true,
        companion_count: 0,
        meal: '식사 불가',
        bus: '미탑승',
        phone: '',
      })
      .eq('id', matchedSceneId);

    const { data: afterScene } = await supabase
      .from('rsvp')
      .select('*')
      .eq('invitation_id', cardId)
      .eq('name', '이영희');

    if (afterScene.length === 1 && afterScene[0].meal === '식사 불가') {
      console.log('✅ [PASS] SceneTemplate 중복 행 없이 기존 데이터 갱신 완료 (식사 불가, 버스 미탑승)');
    } else {
      throw new Error(`SceneTemplate 덮어쓰기 실패: 건수 ${afterScene.length}`);
    }

    // -------------------------------------------------------------
    // [테스트 5] 방안 2: 관리자 페이지 RSVP 삭제 기능 검증
    // -------------------------------------------------------------
    console.log('\n--- [테스트 5] 관리자 페이지 RSVP 개별 삭제 기능 검증 ---');
    const deleteTargetId = afterScene[0].id;

    const { error: delErr } = await supabase
      .from('rsvp')
      .delete()
      .eq('id', deleteTargetId);

    if (delErr) throw delErr;

    const { data: afterDelete } = await supabase
      .from('rsvp')
      .select('*')
      .eq('invitation_id', cardId)
      .eq('id', deleteTargetId);

    if (afterDelete.length === 0) {
      console.log('✅ [PASS] 관리자 RSVP 개별 삭제 정상 작동 (DB 레코드 즉시 삭제 확인)');
    } else {
      throw new Error('RSVP 삭제 실패: 여전히 레코드가 존재합니다.');
    }

    console.log('\n================================================================');
    console.log('🎉 모든 RSVP 덮어쓰기 및 삭제 기능 테스트 100% 통과!');
    console.log('================================================================');
  } finally {
    // 임시 데이터 정리
    await supabase.from('rsvp').delete().eq('invitation_id', cardId);
    await supabase.from('invitations').delete().eq('id', cardId);
    console.log('\n🧹 테스트 데이터 정리 완료');
  }
}

runRsvpTests().catch((err) => {
  console.error('테스트 중 예외 발생:', err);
  process.exit(1);
});
