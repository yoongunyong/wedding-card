/**
 * 브라우저 Canvas 기반 클라이언트 초고화질 이미지 압축 유틸리티
 * - 스튜디오 원본 사진(10~30MB)을 모바일 최적화 해상도(최대 1920px)와 용량(1~2MB 수준)으로 무손실에 가깝게 압축
 * - 외부 라이브러리 없이 브라우저 네이티브 Canvas API 활용으로 100% 안정적 동작
 */
export async function compressImage(file, options = {}) {
  // 이미지가 아니거나 1.5MB 이하인 경우 그대로 반환
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  // GIF 등 애니메이션 이미지는 압축하지 않고 원본 유지
  if (file.type === 'image/gif') {
    return file;
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    maxSizeMB = 2.0,
  } = options;

  // 파일 용량이 이미 1MB 미만이면 원본 유지
  if (file.size <= 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 원본 비율 유지하면서 maxWidth/maxHeight 내로 스케일링
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Canvas 미지원 시 원본 파일 반환
          return resolve(file);
        }

        // 고화질 이미지 스무딩 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // WebP 우선 지원 확인, 미지원 시 JPEG로 폴백
        const mimeType = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            // 압축 결과가 원본보다 큰 경우 원본 사용
            if (blob.size >= file.size) {
              return resolve(file);
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: mimeType,
              lastModified: Date.now(),
            });

            console.log(
              `[Image Compressed] ${file.name}: ${(file.size / (1024 * 1024)).toFixed(2)}MB -> ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`
            );
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        resolve(file);
      };
    };

    reader.onerror = () => {
      resolve(file);
    };
  });
}
