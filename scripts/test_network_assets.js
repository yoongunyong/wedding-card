const fs = require('fs');

async function testUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { url, status: res.status, ok: res.ok };
  } catch (e) {
    return { url, status: 'ERROR', error: e.message };
  }
}

async function run() {
  const files = ['app/create/page.js', 'lib/kakaoShare.js', 'lib/sampleInvitations.js', 'app/manage/[slug]/edit/page.js'];
  const allUrls = new Set();
  
  files.forEach(f => {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      const matches = content.match(/https:\/\/[a-zA-Z0-9_\-\.\/]+(?:\.mp3|\.jpg|\.png|\.jpeg|\.webp)/g) || [];
      matches.forEach(u => allUrls.add(u));
    }
  });

  console.log('Found ' + allUrls.size + ' unique media assets to check:');
  const results = [];
  for (const url of allUrls) {
    const r = await testUrl(url);
    results.push(r);
    console.log(`${r.status === 200 ? '✅' : '❌'} [${r.status}] ${r.url}`);
  }
}

run();
