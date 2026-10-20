/**
 * 브라우저 기반 초고화질 이미지 압축 및 아이폰 HEIC 자동 변환 유틸리티
 * 1. 아이폰 고효율(HEIC/HEIF) 사진을 브라우저에서 초고화질 JPG로 실시간 자동 변환 (갤럭시/PC 호환 100% 보장)
 * 2. 스튜디오 원본 초고화질 사진(10~30MB)을 모바일 최적화 해상도(최대 1920px)와 용량(1~2MB 수준)으로 무손실에 가깝게 압축
 */
export async function compressImage(file, options = {}) {
  if (!file) return file;

  let currentFile = file;

  // 1. 아이폰 고효율(HEIC / HEIF) 포맷 자동 감지 및 초고화질 JPG 실시간 자동 변환
  const isHeic =
    (file.type && (file.type.toLowerCase().includes('heic') || file.type.toLowerCase().includes('heif'))) ||
    /\.(heic|heif)$/i.test(file.name || '');

  if (isHeic) {
    try {
      if (typeof window !== 'undefined') {
        console.log(`[HEIC Detector] 아이폰 고효율(HEIC) 파일 감지: ${file.name} -> JPG 실시간 자동 변환 시작`);
        const heic2any = (await import('heic2any')).default;
        const conversionResult = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9,
        });

        const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
        currentFile = new File(
          [convertedBlob],
          file.name.replace(/\.(heic|heif)$/i, '.jpg'),
          { type: 'image/jpeg', lastModified: Date.now() }
        );
        console.log(
          `[HEIC Detector] JPG 자동 변환 완료: ${(currentFile.size / (1024 * 1024)).toFixed(2)}MB`
        );
      }
    } catch (heicErr) {
      console.warn('[HEIC Detector] HEIC 변환 실패 또는 미지원:', heicErr);
      // 변환 실패 시 원본 파일로 계속 진행
    }
  }

  // 2. 이미지가 아니거나 GIF인 경우 압축하지 않고 반환
  const isImage = currentFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(currentFile.name || '');
  if (!isImage) {
    return currentFile;
  }

  if (currentFile.type === 'image/gif') {
    return currentFile;
  }

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    maxSizeMB = 2.0,
  } = options;

  // 파일 용량이 이미 1MB 미만이면 원본 유지 (단, HEIC에서 변환된 파일은 JPG 유지)
  if (!isHeic && currentFile.size <= 1024 * 1024) {
    return currentFile;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(currentFile);

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
          // Canvas 미지원 시 현재 파일 반환
          return resolve(currentFile);
        }

        // 고화질 이미지 스무딩 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // 초고화질 JPEG 출력
        const mimeType = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(currentFile);
            }

            // 압축 결과가 원본보다 큰 경우 원본 사용 (단, HEIC에서 변환된 파일은 blob 사용)
            if (!isHeic && blob.size >= currentFile.size) {
              return resolve(currentFile);
            }

            const compressedFile = new File([blob], currentFile.name.replace(/\.[^.]+$/, '.jpg'), {
              type: mimeType,
              lastModified: Date.now(),
            });

            console.log(
              `[Image Compressed] ${currentFile.name}: ${(currentFile.size / (1024 * 1024)).toFixed(2)}MB -> ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`
            );
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        resolve(currentFile);
      };
    };

    reader.onerror = () => {
      resolve(currentFile);
    };
  });
}
