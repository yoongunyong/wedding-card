import fs from 'fs';
import path from 'path';

// 1. .env.local 에서 Supabase 접속 정보 로드
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local 파일을 찾을 수 없습니다.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const [k, ...rest] = line.split('=');
  if (k && rest.length > 0) {
    env[k.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 가 .env.local 에 없습니다.');
  process.exit(1);
}

async function run() {
  try {
    console.log('📡 Supabase 전체 테이블 정보를 조회하는 중...');

    // PostgREST OpenAPI 스펙 조회 (모든 테이블 및 컬럼 구조 포함)
    const specRes = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (!specRes.ok) {
      console.error('스키마 조회 실패:', await specRes.text());
      return;
    }

    const spec = await specRes.json();
    const definitions = spec.definitions || {};
    const tableNames = Object.keys(definitions).filter((t) => !t.startsWith('_'));

    console.log(`\n총 ${tableNames.length}개 테이블 발견:`, tableNames.join(', '));

    const result = {
      tables_schema: {},
      tables_data: {},
    };

    for (const tableName of tableNames) {
      const def = definitions[tableName];
      const properties = def.properties || {};
      result.tables_schema[tableName] = Object.entries(properties).map(([col, meta]) => ({
        column: col,
        type: meta.type || meta.format,
        description: meta.description || undefined,
      }));

      // 테이블별 데이터 조회 (최대 10개)
      try {
        const dataRes = await fetch(`${url}/rest/v1/${tableName}?select=*&limit=10`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        });
        if (dataRes.ok) {
          result.tables_data[tableName] = await dataRes.json();
        }
      } catch {
        result.tables_data[tableName] = '조회 실패';
      }
    }

    console.log('\n=============================================');
    console.log('📦 [모든 테이블 스키마 및 데이터 정보 (JSON)]');
    console.log('=============================================\n');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n=============================================');
    console.log('위 전체 내용을 복사해서 전달해주시면 됩니다!');
    console.log('=============================================\n');
  } catch (err) {
    console.error('오류 발생:', err.message);
  }
}

run();
