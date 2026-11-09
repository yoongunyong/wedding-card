'use client';

/**
 * 정갈하고 단아한 모바일 청첩장 전용 전통 한 송이 국화꽃(Chrysanthemum) 심볼 아이콘
 * - 돌아가신 혼주(고인) 표기 시 품격 있고 차분하게 성함 앞에 배치
 * - 풍성한 돔형 꽃머리와 단아한 줄기로 구성된 전통 한 송이 국화꽃 실루엣
 * - currentColor를 지원하여 부모 텍스트 색상 및 폰트 크기에 자연스럽게 동기화
 */
export default function ChrysanthemumIcon({ 
  className = "w-[12px] h-[14px] inline-block align-[-1.5px] text-stone-500 shrink-0",
  ...props 
}) {
  return (
    <svg
      viewBox="0 0 24 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="국화꽃"
      {...props}
    >
      {/* 1. 돔 형태 외곽 꽃송이 윤곽 (둥글고 풍성한 백국화 실루엣) */}
      <path
        d="M12 2.8C10.4 2.8 9.2 3.4 8.2 4.4C7.2 4.8 6.2 5.5 5.5 6.6C4.5 7.8 3.9 9.2 3.9 10.8C3.9 12.6 4.8 14.2 6.3 15.2C7.8 16 9.8 16.4 12 16.4C14.2 16.4 16.2 16 17.7 15.2C19.2 14.2 20.1 12.6 20.1 10.8C20.1 9.2 19.5 7.8 18.5 6.6C17.8 5.5 16.8 4.8 15.8 4.4C14.8 3.4 13.6 2.8 12 2.8Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. 내부 꽃잎 결 (봉긋하게 모여있는 촘촘한 꽃잎 텍스처) */}
      {/* 중앙 타원형 꽃잎들 */}
      <path
        d="M12 3.2C11.2 5 11.2 7.2 12 9.2C12.8 7.2 12.8 5 12 3.2Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.2C11.2 11.4 11.2 13.8 12 15.8C12.8 13.8 12.8 11.4 12 9.2Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 좌측 꽃잎 루프들 */}
      <path
        d="M9.5 4.2C8.6 5.8 8.5 7.8 9.2 9.8C10 8 10.5 6 9.5 4.2Z"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinecap="round"
      />
      <path
        d="M6.8 6.5C6 8.2 6.2 10.4 7.2 12.2C8 10.4 8.2 8.2 6.8 6.5Z"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinecap="round"
      />
      <path
        d="M5.2 9.8C5 11.6 5.6 13.2 6.8 14.4"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* 우측 꽃잎 루프들 */}
      <path
        d="M14.5 4.2C15.4 5.8 15.5 7.8 14.8 9.8C14 8 13.5 6 14.5 4.2Z"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinecap="round"
      />
      <path
        d="M17.2 6.5C18 8.2 17.8 10.4 16.8 12.2C16 10.4 15.8 8.2 17.2 6.5Z"
        stroke="currentColor"
        strokeWidth="0.95"
        strokeLinecap="round"
      />
      <path
        d="M18.8 9.8C19 11.6 18.4 13.2 17.2 14.4"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* 볼륨감을 주는 가로 층 아치선 */}
      <path
        d="M8.2 7.2C10.5 6.2 13.5 6.2 15.8 7.2"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeLinecap="round"
      />
      <path
        d="M6.8 10.8C9.5 9.5 14.5 9.5 17.2 10.8"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeLinecap="round"
      />

      {/* 3. 꽃받침 (꽃머리와 줄기를 잇는 단정한 마디) */}
      <path
        d="M10.8 16.4C11 17.8 11.4 18.6 12 18.6C12.6 18.6 13 17.8 13.2 16.4Z"
        stroke="currentColor"
        strokeWidth="1.1"
        fill="currentColor"
      />

      {/* 4. 꽃대 / 줄기 (곧게 아래로 뻗어내리는 단아한 라인) */}
      <path
        d="M12 18.6C11.95 21.2 12.05 24 12 26.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
