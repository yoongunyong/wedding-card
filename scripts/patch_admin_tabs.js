const fs = require('fs');

let code = fs.readFileSync('app/admin/page.js', 'utf8');
code = code.replace(/\r\n/g, '\n');

// 1. 탭 버튼 추가
const targetBtn = `<button
            onClick={() => setActiveTab('invitations')}
            className={\`py-3 px-5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 \${
              activeTab === 'invitations'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }\`}
          >
            전체 청첩장 목록 및 활성화 관리 ({invitations.length})
          </button>`;

const newBtn = `<button
            onClick={() => setActiveTab('invitations')}
            className={\`py-3 px-5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 \${
              activeTab === 'invitations'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }\`}
          >
            전체 청첩장 목록 및 활성화 관리 ({invitations.length})
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={\`py-3 px-5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 \${
              activeTab === 'pricing'
                ? 'border-stone-900 text-stone-900 bg-white shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }\`}
          >
            <span>⚙️</span>
            <span>가격 & 이벤트 프로모션 설정</span>
          </button>`;

if (code.includes(targetBtn)) {
  code = code.replace(targetBtn, newBtn);
  console.log('Tab button added successfully.');
} else {
  console.error('Target tab button NOT found!');
  process.exit(1);
}

// 2. TAB 3 컨텐츠 추가
const targetEnd = `                        »
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}`;

const newTab3Content = `                        »
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: 실시간 가격 & 이벤트 프로모션 설정
           ======================================================== */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            
            {/* 설정 폼 카드 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-2xs text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200/80 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                      랜딩페이지 가격 & 이벤트 프로모션 실시간 설정
                    </h2>
                  </div>
                  <p className="text-xs text-stone-500 font-light mt-1">
                    코드 수정이나 재배포 없이, 여기서 금액과 문구를 변경하고 [설정 저장]을 누르면 0초 만에 랜딩페이지에 실시간 반영됩니다.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-3 py-1 bg-stone-100 rounded-full text-stone-600 font-semibold border border-stone-200">
                    현재 할인율: {calculatedDiscountRate}% OFF
                  </span>
                </div>
              </div>

              {pricingMessage && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium leading-relaxed">
                  {pricingMessage}
                </div>
              )}

              <form onSubmit={handleSavePricing} className="mt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* 정상 판매가 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 block">
                      정상 판매가 (원) <span className="text-stone-400 font-normal">(취소선 표시 금액)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">₩</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={pricingForm.regular_price}
                        onChange={(e) => setPricingForm({ ...pricingForm, regular_price: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                        placeholder="59000"
                        required
                      />
                    </div>
                  </div>

                  {/* 실제 판매가 (이벤트 할인가) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 block">
                      실제 판매가 / 이벤트 할인가 (원) <span className="text-amber-600 font-bold">*실제 결제 금액</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">₩</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={pricingForm.discount_price}
                        onChange={(e) => setPricingForm({ ...pricingForm, discount_price: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 bg-stone-50 border border-amber-300 rounded-xl text-xs font-mono font-black text-amber-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        placeholder="39000"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* 이벤트 뱃지 문구 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 block">
                      이벤트 뱃지 타이틀 <span className="text-stone-400 font-normal">(가격표 상단 다크 바)</span>
                    </label>
                    <input
                      type="text"
                      value={pricingForm.badge_text}
                      onChange={(e) => setPricingForm({ ...pricingForm, badge_text: e.target.value })}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                      placeholder="아틀리에 드 무키루 런칭 기념 특가"
                    />
                  </div>

                  {/* 기간 및 조건 안내 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-700 block">
                      기간 및 조건 안내 문구 <span className="text-stone-400 font-normal">(가격표 서브 설명)</span>
                    </label>
                    <input
                      type="text"
                      value={pricingForm.period_text}
                      onChange={(e) => setPricingForm({ ...pricingForm, period_text: e.target.value })}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                      placeholder="제작은 100% 무료 · 완성된 청첩장이 마음에 쏙 들 때만 활성화"
                    />
                  </div>
                </div>

                {/* 네이버 스마트스토어 상품 URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700 block">
                    네이버 스마트스토어 상품 링크 URL <span className="text-stone-400 font-normal">(스토어 개설 후 입력)</span>
                  </label>
                  <input
                    type="url"
                    value={pricingForm.naver_store_url}
                    onChange={(e) => setPricingForm({ ...pricingForm, naver_store_url: e.target.value })}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                    placeholder="https://smartstore.naver.com/your-store-name/products/12345"
                  />
                  <p className="text-[11px] text-stone-400">
                    * 스토어 개설 후 해당 상품 페이지 주소를 입력하시면 결제/활성화 버튼이 즉시 스마트스토어로 연결됩니다.
                  </p>
                </div>

                {/* 저장 버튼 */}
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    저장 시 랜딩페이지에 <strong>즉시 실시간 반영</strong>됩니다.
                  </span>
                  <button
                    type="submit"
                    disabled={savingPricing}
                    className="px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingPricing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>저장 중...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>실시간 가격 설정 저장하기</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Supabase 영구 연동 SQL 원클릭 가이드 카드 */}
            <div className="bg-stone-900 text-stone-200 rounded-3xl p-6 sm:p-7 border border-stone-800 shadow-xl text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⚡</span>
                  <div>
                    <h3 className="text-sm font-bold text-white font-serif">
                      Supabase DB 영구 동기화 설정 (1회만 실행)
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Supabase 대시보드의 SQL Editor에 아래 쿼리를 붙여넣고 [Run]을 누르시면 가격 변경 사항이 DB에 영구 저장됩니다.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5 active:scale-95"
                >
                  {copiedSql ? (
                    <>
                      <span>✓</span>
                      <span>SQL 복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>SQL 쿼리 1초 복사</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4">
                <pre className="p-4 bg-black/60 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 border border-stone-800/80 leading-relaxed">
                  {SITE_SETTINGS_SQL}
                </pre>
              </div>
            </div>

          </div>
        )}`;

if (code.includes(targetEnd)) {
  code = code.replace(targetEnd, newTab3Content);
  console.log('Tab 3 content added successfully.');
} else {
  console.error('Target tab 3 end NOT found!');
  process.exit(1);
}

fs.writeFileSync('app/admin/page.js', code, 'utf8');
console.log('SUCCESS: app/admin/page.js updated completely!');
