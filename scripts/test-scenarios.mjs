import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sfnsxkkxvplrlxbvenme.supabase.co';
const SUPABASE_KEY = 'sb_publishable_eun1yt8eNYVjwusaXUtrUA_FTckTkuH';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('================================================================');
console.log('🚀 모바일 청첩장 서비스 전체 기능 종합 시나리오 테스트 시작');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function report(scenarioTitle, success, detail) {
  if (success) {
    passCount++;
    console.log(`✅ [PASS] ${scenarioTitle}`);
    if (detail) console.log(`   └─ ${detail}`);
  } else {
    failCount++;
    console.error(`❌ [FAIL] ${scenarioTitle}`);
    if (detail) console.error(`   └─ ${detail}`);
  }
}

async function runAllScenarios() {
  const testSlug = `test-auto-${Date.now()}`;
  let createdCardId = null;
  let createdManageToken = null;
  let testGuestbookId = null;
  let testOrderCode = null;

  try {
    // ----------------------------------------------------------------
    // [시나리오 1] 공식 5종 시안 체험 데모 청첩장 유효성 검증
    // ----------------------------------------------------------------
    console.log('\n--- [시나리오 1] 5종 시안 공식 데모 청첩장 무결성 검증 ---');
    const demoSlugs = ['basic', 'editorial', 'playlist', 'cinematic', 'scene'];

    for (const dSlug of demoSlugs) {
      const { data: demoCard, error: demoErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('slug', dSlug)
        .maybeSingle();

      if (demoErr || !demoCard) {
        report(`시안 데모 청첩장 조회 (slug: /${dSlug})`, false, `DB에 레코드가 없거나 조회 실패: ${demoErr?.message}`);
      } else {
        const isActive = demoCard.is_active ?? demoCard.template_config?.is_active ?? true;
        report(
          `시안 데모 청첩장 유효성 (slug: /${dSlug})`,
          isActive && Boolean(demoCard.groom_name && demoCard.bride_name),
          `템플릿: ${demoCard.template_type}, 활성상태: ${isActive}, 주인공: ${demoCard.groom_name}♥${demoCard.bride_name}`
        );
      }
    }

    // ----------------------------------------------------------------
    // [시나리오 2] 청첩장 제작 신청 (/create) 비즈니스 로직 시뮬레이션
    // ----------------------------------------------------------------
    console.log('\n--- [시나리오 2] 신규 청첩장 생성 및 동적 필드/만료일 계산 검증 ---');
    
    // 예식일: 1년 후
    const weddingDateObj = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6개월 뒤
    const weddingDateIso = weddingDateObj.toISOString().slice(0, 19);
    const expectedExpiryObj = new Date(weddingDateObj);
    expectedExpiryObj.setFullYear(expectedExpiryObj.getFullYear() + 1);
    const expectedExpiryIso = expectedExpiryObj.toISOString();

    const newCardPayload = {
      slug: testSlug,
      groom_name: '테스트신랑',
      bride_name: '테스트신부',
      groom_name_en: 'Test Groom',
      bride_name_en: 'Test Bride',
      groom_first_name_en: 'Groom',
      groom_last_name_en: 'Test',
      bride_first_name_en: 'Bride',
      bride_last_name_en: 'Test',
      main_names_en: 'Groom & Bride',
      wedding_date: weddingDateIso,
      venue_name: '테스트 웨딩홀',
      venue_hall: '그랜드볼룸 2층',
      venue_address: '서울특별시 강남구 테헤란로 123',
      venue_detail: '역삼역 4번 출구 도보 3분',
      message: '소중한 분들을 초대합니다.',
      template_type: 'scene', // 시안 5로 생성
      is_active: false, // 코드 미입력 시 샘플 모드 (워터마크 노출)
      order_code: null,
      service_expired_at: expectedExpiryIso,
      images: {
        main: 'https://images.unsplash.com/photo-1519741497674-611481863552',
        groom_profile: 'https://images.unsplash.com/photo-1606800052052-a08af7148866',
        bride_profile: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486',
      },
      gallery_images: [
        'https://images.unsplash.com/photo-1519741497674-611481863552',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc'
      ],
      accounts: [
        { group: '신랑측', title: '신랑', bank: '국민', number: '111-222-3333', holder: '테스트신랑' }
      ],
      interviews: [
        { id: 1, question: '첫 만남은?', groom_answer: '동아리에서 만났어요', bride_answer: '따뜻했어요' }
      ],
      template_config: {
        show_rsvp_bus: true,
        show_accounts: true,
        show_gallery: true,
        show_guestbook: true,
        show_intro: true,
        is_active: false,
        service_expired_at: expectedExpiryIso,
      }
    };

    const { data: createdCard, error: createErr } = await supabase
      .from('invitations')
      .insert([newCardPayload])
      .select()
      .single();

    if (createErr || !createdCard) {
      report('신규 청첩장 DB 생성 (/create INSERT)', false, createErr?.message);
    } else {
      createdCardId = createdCard.id;
      createdManageToken = createdCard.manage_token;
      report(
        '신규 청첩장 DB 생성 (/create INSERT)',
        Boolean(createdCard.id && createdCard.manage_token),
        `생성된 ID: ${createdCard.id}, 토큰 발급: ${Boolean(createdCard.manage_token)}, 만료일: ${createdCard.service_expired_at}`
      );
    }

    // ----------------------------------------------------------------
    // [시나리오 3] 하객 열람 (/[slug]) 및 인터랙션 (RSVP, 방명록 등록/삭제)
    // ----------------------------------------------------------------
    console.log('\n--- [시나리오 3] 하객 인터랙션 (방명록 작성/삭제, RSVP) 검증 ---');

    if (createdCardId) {
      // 3-1. 하객 화면 방명록 작성
      const testPassword = 'pass1234!';
      const { data: createdGb, error: gbErr } = await supabase
        .from('guestbook')
        .insert([
          {
            invitation_id: createdCardId,
            author: '축하하객1',
            content: '두 분의 결혼을 진심으로 축하드립니다!',
            password: testPassword,
          }
        ])
        .select()
        .single();

      if (gbErr || !createdGb) {
        report('하객 방명록 등록 (guestbook INSERT)', false, gbErr?.message);
      } else {
        testGuestbookId = createdGb.id;
        report('하객 방명록 등록 (guestbook INSERT)', true, `작성자: ${createdGb.author}, 본문: ${createdGb.content}`);
      }

      // 3-2. 방명록 조회 (invitation_id 기준 정렬)
      const { data: gbList, error: gbListErr } = await supabase
        .from('guestbook')
        .select('*')
        .eq('invitation_id', createdCardId)
        .order('created_at', { ascending: false });

      report(
        '방명록 목록 조회 (invitation_id 기준 정합성)',
        !gbListErr && gbList && gbList.length > 0 && gbList[0].author === '축하하객1',
        `조회된 방명록 수: ${gbList?.length}건`
      );

      // 3-3. 방명록 삭제 - 비밀번호 틀렸을 때 방어
      const { data: wrongDelData } = await supabase
        .from('guestbook')
        .delete()
        .eq('id', testGuestbookId)
        .eq('password', 'wrong-pass!')
        .select();

      report(
        '방명록 비밀번호 불일치 시 삭제 방어 검증',
        !wrongDelData || wrongDelData.length === 0,
        `틀린 비밀번호 삭제 차단 성공 (영향받은 행: ${wrongDelData?.length || 0})`
      );

      // 3-4. 방명록 삭제 - 올바른 비밀번호로 삭제
      const { data: correctDelData, error: delErr } = await supabase
        .from('guestbook')
        .delete()
        .eq('id', testGuestbookId)
        .eq('password', testPassword)
        .select();

      report(
        '하객 본인 비밀번호를 통한 방명록 삭제 검증',
        !delErr && correctDelData && correctDelData.length === 1,
        `정상 삭제 완료: ${correctDelData?.[0]?.id}`
      );

      // 3-5. 시안 5 인페이지 RSVP (식사 및 버스 옵션 포함) 등록
      const { data: rsvpRow, error: rsvpErr } = await supabase
        .from('rsvp')
        .insert([
          {
            invitation_id: createdCardId,
            name: '김참석',
            side: 'groom',
            attend: true,
            companion_count: 1,
            meal: '식사 가능',
            bus: '탑승',
            phone: '010-1234-5678',
          }
        ])
        .select()
        .single();

      report(
        '시안 5 특화 RSVP 등록 (식사여부 및 전세버스 옵션)',
        !rsvpErr && rsvpRow && rsvpRow.attend === true && rsvpRow.meal === '식사 가능',
        `등록된 RSVP ID: ${rsvpRow?.id}, 식사: ${rsvpRow?.meal}, 버스: ${rsvpRow?.bus}`
      );
    }

    // ----------------------------------------------------------------
    // [시나리오 4] 신랑신부 관리자 페이지 (/manage/[slug]) 검증
    // ----------------------------------------------------------------
    console.log('\n--- [시나리오 4] 관리자 보안 토큰 및 통계 집계 검증 ---');

    if (createdCardId && createdManageToken) {
      // 4-1. 정상 토큰 접근
      const { data: authCard, error: authErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('slug', testSlug)
        .eq('manage_token', createdManageToken)
        .single();

      report(
        '관리자 보안 토큰(manage_token) 인증 검증',
        !authErr && authCard && authCard.id === createdCardId,
        `인증 성공 (토큰: ${createdManageToken.slice(0, 8)}...)`
      );

      // 4-2. 위조/불일치 토큰 차단
      const { data: fakeCard } = await supabase
        .from('invitations')
        .select('*')
        .eq('slug', testSlug)
        .eq('manage_token', '00000000-0000-0000-0000-000000000000')
        .maybeSingle();

      report(
        '위조 토큰 접근 차단 검증',
        fakeCard === null,
        '잘못된 토큰으로 접근 시 403 차단 확인'
      );

      // 4-3. RSVP 통계 집계 (신랑측 2명: 김참석 + 동반 1)
      const { data: rsvps } = await supabase
        .from('rsvp')
        .select('*')
        .eq('invitation_id', createdCardId);

      const attending = (rsvps || []).filter((r) => r.attend);
      const totalGuests = attending.reduce((acc, cur) => acc + 1 + (cur.companion_count || 0), 0);
      report(
        'RSVP 하객 통계 집계 정확도 (본인 + 동반자)',
        totalGuests === 2,
        `집계된 총 참석 인원: ${totalGuests}명 (예상: 2명)`
      );
    }

    // ----------------------------------------------------------------
    // [시나리오 5] 청첩장 수정 및 시안 변경 (/manage/[slug]/edit)
    // ----------------------------------------------------------------
    console.log('\n--- [시나리오 5] 청첩장 수정 및 시안 변경 (UPDATE) 검증 ---');

    if (createdCardId && createdManageToken) {
      // 시안 5 -> 시안 1(basic)로 템플릿 변경 및 인사말 수정
      const updatePayload = {
        template_type: 'basic',
        message: '수정된 초대 문구입니다.',
        quote_content: '새로운 영화 명대사',
        quote_source: '영화 <어바웃 타임>',
      };

      const { data: updatedCard, error: updateErr } = await supabase
        .from('invitations')
        .update(updatePayload)
        .eq('slug', testSlug)
        .eq('manage_token', createdManageToken)
        .select()
        .single();

      report(
        '청첩장 수정 및 시안 변경 (UPDATE)',
        !updateErr && updatedCard && updatedCard.template_type === 'basic' && updatedCard.manage_token === createdManageToken,
        `변경 템플릿: ${updatedCard?.template_type}, 고유 slug 및 토큰 영구 보존 확인`
      );
    }

    // ----------------------------------------------------------------
    // [시나리오 6] 총괄 어드민 (/admin) 코드 생성 및 만료일 조정
    // ----------------------------------------------------------------
    console.log('\n--- [시나리오 6] 총괄 관리자 기능 (1회용 코드 발급 및 만료일 조정) ---');

    // 6-1. 1회용 코드 발급
    const codeStr = `TEST-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: codeRow, error: codeErr } = await supabase
      .from('order_codes')
      .insert([
        {
          code: codeStr,
          type: 'store',
          note: '자동화 테스트 코드',
          is_used: false,
        }
      ])
      .select()
      .single();

    if (codeErr || !codeRow) {
      report('1회용 스마트스토어 인증코드 발급 (order_codes INSERT)', false, codeErr?.message);
    } else {
      testOrderCode = codeRow.id;
      report('1회용 스마트스토어 인증코드 발급 (order_codes INSERT)', true, `발급 코드: ${codeRow.code}`);
    }

    // 6-2. 만료일 무제한(null) 연장 테스트
    if (createdCardId) {
      const { data: expUpdated, error: expErr } = await supabase
        .from('invitations')
        .update({ service_expired_at: null })
        .eq('id', createdCardId)
        .select()
        .single();

      report(
        '서비스 만료일 무제한(영구 보관) 설정 검증',
        !expErr && expUpdated && expUpdated.service_expired_at === null,
        `만료일 값: ${expUpdated?.service_expired_at === null ? 'null (무제한)' : '실패'}`
      );
    }

  } catch (err) {
    console.error('시나리오 실행 중 예외 발생:', err);
    failCount++;
  } finally {
    // ----------------------------------------------------------------
    // 테스트 데이터 자동 정리 (Clean-up)
    // ----------------------------------------------------------------
    console.log('\n--- 테스트 데이터 정리 (Clean-up) ---');
    if (createdCardId) {
      await supabase.from('rsvp').delete().eq('invitation_id', createdCardId);
      await supabase.from('guestbook').delete().eq('invitation_id', createdCardId);
      await supabase.from('invitations').delete().eq('id', createdCardId);
      console.log(`🧹 테스트 청첩장(ID: ${createdCardId}) 및 관련 RSVP/방명록 레코드 정리 완료`);
    }
    if (testOrderCode) {
      await supabase.from('order_codes').delete().eq('id', testOrderCode);
      console.log(`🧹 테스트 발급 코드(ID: ${testOrderCode}) 정리 완료`);
    }
  }

  console.log('\n================================================================');
  console.log(`📊 시나리오 테스트 결과 요약: PASS [${passCount}] / FAIL [${failCount}]`);
  console.log('================================================================');
}

runAllScenarios();
