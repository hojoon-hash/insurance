import React, { useState } from 'react';

// 브랜드 이미지(public/ 에 저장)를 표시하되, 파일이 아직 없으면 fallback을 렌더한다.
// 이미지 파일을 나중에 추가해도 코드 수정 없이 자동 반영된다.
export default function BrandImage({ src, alt, className, fallback = null }) {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
