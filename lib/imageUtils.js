// 統一把上傳的圖片（不論原始格式為何，例如手機常見的 webp/heic）轉成標準 PNG dataURL，
// 確保 pdf-lib 一定能嵌入；瀏覽器無法解碼的格式（例如部分 iPhone 的 HEIC）會 reject。
export function normalizeImageToPngDataUrl(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('這張圖片瀏覽器無法讀取，請改用 JPG 或 PNG 格式的照片再上傳一次'));
    };
    img.src = objectUrl;
  });
}
