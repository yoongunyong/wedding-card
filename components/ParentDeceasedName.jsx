'use client';

import ChrysanthemumIcon from './ChrysanthemumIcon';

/**
 * 고인 혼주 성함 포맷팅 컴포넌트
 * - markerType이 'flower'이면 단아한 한 송이 국화꽃 아이콘을 이름 앞에 렌더링
 * - markerType이 'hanja'(기본)이면 '故' 한자를 이름 앞에 렌더링
 * - whitespace-nowrap 및 inline-flex로 성함과 심볼이 줄바꿈으로 깨지지 않도록 보호
 */
export default function ParentDeceasedName({
  name,
  isDeceased = false,
  markerType = 'hanja',
  className = '',
  iconClassName = 'w-[12px] h-[14px] inline-block align-[-1.5px] mr-1 text-stone-500 shrink-0',
}) {
  if (!name) return null;
  if (!isDeceased) return <span className={`whitespace-nowrap ${className}`}>{name}</span>;

  if (markerType === 'flower') {
    return (
      <span className={`inline-flex items-center whitespace-nowrap ${className}`}>
        <ChrysanthemumIcon className={iconClassName} />
        <span>{name}</span>
      </span>
    );
  }

  return <span className={`whitespace-nowrap ${className}`}>故 {name}</span>;
}

/**
 * 양가 부모님 두 분 성함 및 고인 표기를 JSX 노드로 안전하게 조합하는 헬퍼 함수
 */
export function renderParentPair({
  father,
  isFatherDeceased,
  mother,
  isMotherDeceased,
  markerType = 'hanja',
  separator = ' · ',
  className = '',
  iconClassName = 'w-[12px] h-[14px] inline-block align-[-1.5px] mr-1 text-stone-500 shrink-0',
}) {
  const fatherNode = father ? (
    <ParentDeceasedName
      name={father}
      isDeceased={Boolean(isFatherDeceased)}
      markerType={markerType}
      className={className}
      iconClassName={iconClassName}
    />
  ) : null;

  const motherNode = mother ? (
    <ParentDeceasedName
      name={mother}
      isDeceased={Boolean(isMotherDeceased)}
      markerType={markerType}
      className={className}
      iconClassName={iconClassName}
    />
  ) : null;

  if (fatherNode && motherNode) {
    return (
      <span className="inline-flex items-center whitespace-nowrap">
        {fatherNode}
        <span className="mx-0.5 select-none">{separator}</span>
        {motherNode}
      </span>
    );
  }

  return fatherNode || motherNode || null;
}
