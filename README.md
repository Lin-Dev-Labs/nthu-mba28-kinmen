# 清華MBA金門班 學習歷程網站

Next.js 靜態網站，部署於 GitHub Pages：`https://<username>.github.io/nthu-mba28-kinmen/`

## 開發

```bash
npm install
npm run dev
```

## 建置（靜態輸出至 /out）

```bash
npm run build
```

## 部署

推送到 `main` 分支後，`.github/workflows/deploy.yml` 會自動建置並部署到 GitHub Pages。
首次啟用需到 repo 設定 **Settings → Pages → Source → GitHub Actions**。

## 中文字型（PDF 匯出必要）

`pdf-lib` 內建字型不支援中文字元。請自行下載 [Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC)
的 Regular ttf，放置於 `public/fonts/NotoSansTC-Regular.ttf`（因版權/檔案大小考量未內建於 repo）。
若缺少此檔案，個人化 PDF 生成時中文將無法正確顯示（console 會出現警告）。

## 內容維護

- `data/courses/course-XX.json`：新增課程只需新增 json 檔，不用改程式碼
- `public/reports/course-XX-*.pdf`：分組報告 PDF，檔名需以對應課程 slug（如 `course-01`）開頭
- `public/graduation/`：放置畢業證書圖片與畢業論文 PDF
- `public/images/courses/`：課堂照片，並在對應 `course-XX.json` 的 `photos` 欄位填入路徑

## 檔案大小

CI（`check-file-size.yml`）會在每次 push / PR 檢查是否有檔案超過 90MB，超過會讓 CI 失敗並標示檔名，
需手動下載、壓縮後重新上傳。
