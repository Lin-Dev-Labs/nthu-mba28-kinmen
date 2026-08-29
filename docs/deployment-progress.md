# 部署進度紀錄

最後更新：2026-08-29

## 已完成 ✅ 網站已上線
- Next.js 靜態網站已依 `mba-learning-portfolio-spec.md` 建置完成（見專案根目錄 `CLAUDE.md` 了解架構）
- Git repo 已建立並 push 到 GitHub：`https://github.com/Lin-Dev-Labs/nthu-mba28-kinmen`（分支 `main`）
- Repo 已設為 **Public**（GitHub Pages 免費方案不支援 private repo）
- Settings → Pages → Source 已設定為 **GitHub Actions**
- `Check File Size` 與 `Deploy to GitHub Pages` 兩個 workflow 皆執行成功（綠色勾勾）
- **網站已確認可正常訪問**：`https://lin-dev-labs.github.io/nthu-mba28-kinmen/`，首頁個人資料表單顯示正常
- 部署流程已打通：之後每次 push 到 `main` 都會自動觸發重新部署

## 曾經卡住過的地方（已解決，僅留紀錄）
2026-08-07 push 之後，兩個 workflow 一度失敗/卡住不動，錯誤訊息：

```
The job was not acquired by Runner of type hosted even after multiple attempts
Internal server error
```

當時確認是 GitHub 官方的 **Actions/Pages 大規模事故**（約自 2026-08-06 16:33 UTC 起），不是這個 repo 的程式碼或設定問題。
2026-08-29 GitHub 事故解決後重新 push，兩個 workflow 皆順利跑完，問題已排除。

## 之後要做的事（內容維護，非部署問題）
1. 加入中文字型檔 `public/fonts/NotoSansTC-Regular.ttf`（Noto Sans TC），否則匯出個人化PDF時中文顯示不出來（目前尚未確認是否已加入）
2. `data/courses/course-01.json`、`course-02.json` 目前是空白樣板，需填入實際課程資料，並依需要新增更多課程 json
3. `public/reports/`、`public/graduation/`、`public/images/courses/` 目前都是空的，需陸續上傳分組報告、畢業證書/論文、課堂照片
   - **上傳前的隱私檢查**：畢業證書需馬賽克身分證字號/出生年月日；分組報告要確認沒有真實公司機密資料；課堂照片要取得同學同意、必要時去除 EXIF 定位資訊
4. 建議實際點過每個頁面（課程列表、單堂課、下載、畢業證書）確認在正式部署環境（有 basePath 子路徑）下圖片與連結都正常，不只在本機開發環境測試
