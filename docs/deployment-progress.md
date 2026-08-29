# 部署進度紀錄

最後更新：2026-08-07

## 已完成
- Next.js 靜態網站已依 `mba-learning-portfolio-spec.md` 建置完成（見專案根目錄 `CLAUDE.md` 了解架構）
- Git repo 已建立並 push 到 GitHub：`https://github.com/Lin-Dev-Labs/nthu-mba28-kinmen`（分支 `main`）
- Repo 已設為 **Public**（GitHub Pages 免費方案不支援 private repo）
- Settings → Pages → Source 已設定為 **GitHub Actions**

## 目前卡住的地方
2026-08-07 push 之後，`.github/workflows/` 底下兩個 workflow（`Check File Size`、`Deploy to GitHub Pages`）
執行失敗/卡住不動，錯誤訊息：

```
The job was not acquired by Runner of type hosted even after multiple attempts
Internal server error
```

經確認 [githubstatus.com](https://www.githubstatus.com/) 當時有 GitHub 官方的 **Actions/Pages 大規模事故**
（約自 2026-08-06 16:33 UTC 起），**不是**這個 repo 的程式碼或設定問題，純粹撞上 GitHub 那邊故障。

網站網址 `https://lin-dev-labs.github.io/nthu-mba28-kinmen/` 目前回傳 404（因為還沒有任何一次成功部署）。

## 之後要做的事（依序）
1. 到 [githubstatus.com](https://www.githubstatus.com/) 確認 Actions 事故已顯示 Resolved
2. 回到 repo 的 **Actions** 分頁，把之前失敗/卡住的兩個 run 點 **Re-run all jobs**（或直接 push 一個新 commit 觸發新的一次）
3. 確認 `Deploy to GitHub Pages` 顯示綠色成功，再訪問 `https://lin-dev-labs.github.io/nthu-mba28-kinmen/` 確認網站正常顯示（首頁應該是個人資料表單）
4. 部署成功後，剩下的內容維護事項：
   - 加入中文字型檔 `public/fonts/NotoSansTC-Regular.ttf`（Noto Sans TC），否則匯出 PDF 時中文顯示不出來
   - `data/courses/course-01.json`、`course-02.json` 目前是空白樣板，需填入實際課程資料，並依需要新增更多課程 json
   - `public/reports/`、`public/graduation/`、`public/images/courses/` 目前都是空的，需陸續上傳分組報告、畢業證書/論文、課堂照片
   - **上傳前的隱私檢查**：畢業證書需馬賽克身分證字號/出生年月日；分組報告要確認沒有真實公司機密資料；課堂照片要取得同學同意、必要時去除 EXIF 定位資訊（詳細原因與做法已記錄在對話中，可請 Claude 從 memory 回顧）
