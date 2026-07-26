# 清華MBA金門班學習歷程網站 — 架構規劃

## 專案目標
建立一個靜態網站，讓同學能：
1. 填入個人資料（姓名、學歷、經歷、照片、自介文字）
2. 瀏覽兩年期所有課程內容（授課教師、課程內容、個案討論、分組報告）
3. 一鍵生成「個人化封面 + 完整課程內容」的PDF，作為學習歷程證明，供主管或求職使用

## 技術棄用原因（重要，避免過度設計）
- **不使用資料庫**（Supabase / Firebase 等）：內容為靜態、單向瀏覽，無需即時協作、無需多使用者關聯查詢
- **不使用後端伺服器**：所有邏輯（表單填寫、PDF生成）在前端瀏覽器完成
- 部署方式：靜態網站，GitHub 存原始碼並直接用 **GitHub Pages** 部署（不使用 Vercel），因整站無伺服器邏輯（表單、PDF生成、照片上傳、Modal預覽皆為前端client-side完成），純靜態頁面即可滿足需求，可少維護一個平台依賴

## 技術棄用比較（討論脈絡記錄）
| 方案 | 結論 |
|---|---|
| Supabase / Firebase | 不需要，屬於小題大作，無關聯查詢或即時同步需求 |
| Notion | 帳號存續風險較高於GitHub，且無法做客製化PDF生成 |
| Google Sheet/Doc | 不夠專業，無法做互動式個人化生成 |
| Next.js（靜態）+ pdf-lib + GitHub + Vercel | 曾考慮，但整站無伺服器邏輯，Vercel優勢用不到 |
| **Next.js（靜態，`next export`）+ pdf-lib + GitHub Pages** | ✅ 採用方案，省去維護Vercel |

## 資料模型

### `/data/profile-template.json`
```json
{
  "name": "",
  "education": [
    { "school": "", "degree": "", "year": "" }
  ],
  "experience": [
    { "company": "", "title": "", "period": "", "desc": "" }
  ],
  "photo": "/images/profile.jpg",
  "bio": ""
}
```

### `/data/courses/course-XX.json`（每堂課一個檔案，同一schema）
```json
{
  "courseTitle": "",
  "week": "",
  "instructor": {
    "name": "",
    "title": "",
    "bio": "",
    "photo": ""
  },
  "content": "",
  "caseDiscussion": "",
  "groupProject": ""
}
```

## 頁面架構

```
/                     首頁 — 個人資料表單（姓名/學歷/經歷/照片上傳/自介）
/courses              課程總覽列表（依學期/週次排序）
/courses/[slug]       單堂課頁面（同一template渲染，資料來自對應json；含課堂照片區塊）
/graduation           畢業證書 + 畢業論文頁面
/download             輸入/確認個人資料 → 生成個人化PDF並下載
```

## 檔案結構（實際 repo）

```
/pages
  index.js              首頁表單
  courses/
    index.js            課程列表
    [slug].js            單堂課動態路由模板
  download.js            PDF生成頁
/data
  profile-template.json
  courses/
    course-01.json
    course-02.json
    ...（依實際課程數量增加）
/components
  ProfileForm.jsx        個人資料輸入表單元件
  CourseCard.jsx          課程列表卡片元件
  PdfGenerator.jsx        封裝pdf-lib的PDF生成邏輯
/public
  images/                教師照片、課程截圖等靜態圖片資源
```

## 關鍵技術決策

| 需求 | 方案 | 原因 |
|---|---|---|
| 首頁表單資料 | React state（不寫入後端） | 使用者填完直接用於PDF生成，無需持久化儲存 |
| 照片上傳 | `<input type="file">` 讀取為 base64，直接嵌入PDF | 不需額外的Storage服務 |
| 每堂課頁面 | 單一動態路由 `[slug].js` + 多份json資料 | 一套模板、多份資料，新增課程只需加json檔，不用改程式碼 |
| 個人化PDF生成 | pdf-lib，將「個人資料頁」當封面 + 「課程內容」轉為PDF頁，於前端合併輸出 | 完全前端運算，零伺服器成本 |
| 部署 | Next.js `next export` 產生靜態檔案，直接部署於 **GitHub Pages**（不使用Vercel） | 全站無伺服器邏輯（表單/PDF生成/照片上傳/Modal預覽皆前端完成），GitHub Pages即可滿足，且GitHub帳號穩定性較高、少一個平台依賴 |

**GitHub Pages部署注意事項**：若repo部署在子路徑（如 `username.github.io/repo-name`），需在 `next.config.js` 設定 `basePath` 與 `assetPrefix`，否則圖片與連結路徑會跑掉；若有自訂網域指向root則不需處理。

## 分組報告呈現機制

### 核心原則：「線上瀏覽」與「個人化PDF匯出」分開處理
兩者需求不同，不能用同一套邏輯：
- **線上瀏覽**：長官/同學快速看內容，不想下載、不想切換頁面
- **PDF匯出**：產出一份完整、可列印的紙本學習歷程文件

| 情境 | 技術方案 | 說明 |
|---|---|---|
| 線上瀏覽分組報告 | Modal彈出視窗 + `pdf.js` / `react-pdf` 內嵌預覽 | 課程頁面顯示報告縮圖（PDF第一頁），點擊後在原頁面內用Modal展開閱讀，內建上一頁/下一頁，不跳轉網址；Modal下方保留「下載原始檔案」連結 |
| PDF匯出時收錄分組報告 | `pdf-lib` 的頁面複製功能（`copyPages`） | 使用者勾選要收錄的報告後，直接把該PDF的頁面整頁複製貼入最終匯出的個人化PDF，變成完整文件的一部分（非連結、非圖片） |

### 檔案格式統一
PPT報告需先轉成PDF再上傳（用LibreOffice或線上工具轉檔），確保網站上的預覽與匯出機制都用同一套PDF處理邏輯，不用另外處理PPT格式。

### 上傳與資料結構（漸進式上傳）
分組報告採**一次性上傳為網站固定內容**，同學匯出個人化PDF時只需勾選要收錄哪些現成報告，不需重新上傳。上傳採漸進式：先上傳自己那組的報告，之後有空再補其他組。

```
/data/reports/
  course-01-group-self.pdf      ← 先上傳（自己那組）
  course-02-group-self.pdf
  ...
  (之後陸續補: course-01-group-B.pdf 等其他組別)
```

網站端依實際存在的檔案動態產生「可勾選清單」，不用因應上傳進度修改程式邏輯。

### 匯出流程
1. 填寫個人資料（首頁表單）
2. 逐堂課勾選是否收錄該堂課的分組報告
3. 按下生成 → `pdf-lib` 依序：個人資料封面頁 → 課程內容頁 → 勾選的分組報告頁面（整頁複製貼入）
4. 輸出一份完整、可列印的個人化學習歷程PDF

## 畢業證書與論文頁面

新增一個獨立頁面，用於收錄畢業證書與畢業論文，作為學習歷程的「結業證明」層級內容，與逐堂課程內容互補。

```
/graduation           畢業證書 + 畢業論文頁面
```

- 畢業證書：圖片或PDF上傳，網站上以圖片方式展示
- 畢業論文：PDF上傳，同樣採用課程頁面的Modal內嵌預覽機制（點擊展開閱讀，不跳轉頁面）
- 匯出個人化PDF時，這兩份文件可勾選收錄，用`pdf-lib`整頁複製貼入（與分組報告機制相同）

## 課堂照片

每堂課頁面新增「課堂照片」區塊，用於上傳上課時拍攝的照片，作為課程內容之外的臨場紀錄。

- 資料結構：`course-XX.json` 增加 `photos` 欄位，存放照片路徑陣列
```json
{
  "courseTitle": "",
  "instructor": { ... },
  "content": "",
  "caseDiscussion": "",
  "groupProject": "",
  "photos": ["/images/courses/course-01-photo1.jpg", "/images/courses/course-01-photo2.jpg"]
}
```
- 呈現方式：課程頁面下方以縮圖網格(gallery)呈現，點擊可放大檢視(Lightbox)，不影響頁面其他內容排版
- 匯出個人化PDF時，照片可選擇是否收錄（若收錄則以圖片頁面形式插入PDF，而非整頁報告的頁面複製邏輯）

## 檔案大小監控機制

因同學普遍不熟悉技術操作，門檻設定寬鬆（90MB），避免造成使用壓力；上傳機會不多，由本人（repo管理者）在CI跳出警告後手動下載、壓縮、重新上傳即可，不要求同學自行處理。

### GitHub Actions 自動檢查（擋在合併之前）
每次 push 或開 PR 時自動掃描，超過90MB就讓 CI 失敗並標示出檔名與大小，管理者看到警告後手動下載該檔案、壓縮後重新上傳。

```yaml
# .github/workflows/check-file-size.yml
name: Check File Size
on: [push, pull_request]
jobs:
  file-size-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check for large files
        run: |
          find . -type f -not -path "./.git/*" -size +90M -exec ls -lh {} \; | \
          awk '{print "⚠️ 超過90MB: " $NF " (" $5 ")"}'
          if find . -type f -not -path "./.git/*" -size +90M | grep -q .; then
            echo "有檔案超過90MB門檻，請管理者下載壓縮後再上傳"
            exit 1
          fi
```

### 手動檢查方式（備用/定期確認）
- GitHub repo 首頁右側欄可看整體repo大小（有延遲，非即時）
- 點進單個檔案頁面，GitHub會顯示該檔案大小
- 本機用GitHub CLI掃描並依大小排序：
```bash
git ls-tree -r -l HEAD | sort -k4 -n -r | head -20
```

### 總容量注意事項
GitHub建議repo總容量控制在1GB內（非硬性限制，硬性上限100GB）。兩年課程內容累積下來可能落在1-3GB左右，超過建議值但遠低於硬性上限，不會被擋，只是clone/fetch效能略降，不影響網站瀏覽速度，暫不需特別處理。

## 長期保存考量
- 原始碼、資料與部署都在 GitHub 一個平台完成（GitHub repo + GitHub Pages）：GitHub 帳號活躍度天然較高，且純靜態檔案不依賴任何後端服務持續運作，不需另外維護Vercel帳號
- 建議每學期至少登入一次帳號、推送新課程內容，同時滿足「保持帳號活躍」與「更新內容」

## 待辦（未來擴充，非目前範圍）
- 若未來需要記錄「誰下載過」、收作業、登入權限控管等功能，才需要考慮加入資料庫（如Supabase）
