# CANADA 2026 V2
架構：Google Sheets（內容）→ Next.js/Vercel（網站）＋ Cloudinary（圖片）＋ GitHub（程式碼）。

## Google Sheets 欄位
`status,date,chapter,title,dayTemp,nightTemp,level,weather,maleOutfit,femaleOutfit,shoes,outerLayer,notice,heroImage,maleImage,femaleImage,time,place,description,type,priority,mapUrl`

同一天可有多列行程；每日基本資料重複即可。網站只顯示 `status=發布`。

## 環境變數
- `GOOGLE_SHEET_CSV_URL`: Google Sheet 發布為 CSV 後的網址
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name（預留；目前圖片欄可直接放 Cloudinary delivery URL）

沒有設定 Sheet 時會顯示 fallback demo，避免網站壞掉。
## V3 Development
V3 travel website redesign.
