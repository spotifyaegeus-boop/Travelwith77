import { parseCSV } from './csv';

import type {
  TravelDay,
  TravelDocument,
  PackingItem,
} from '../types/travel';

/* =========================================================
   FALLBACK
   Google Sheet 暫時讀不到時，至少讓網站可以正常顯示。
========================================================= */

const fallback: TravelDay[] = [
  {
    date: '2026/8/13',
    chapter: '溫哥華',
    title: '抵達溫哥華・海邊夕陽',

    dayTemp: '20–25°C',
    nightTemp: '13–17°C',
    level: 1,
    weather: '舒適偏暖｜夏裝即可',

    maleOutfit: 'T 恤＋直筒輕薄長褲＋薄襯衫',
    femaleOutfit: 'T 恤／背心＋寬褲＋薄針織',

    shoes: '生活休閒鞋',
    outerLayer: '薄襯衫／Cardigan',

    notice: '長程移動日，傍晚海邊可能較涼。',

    heroImage: '',
    maleImage: '',
    femaleImage: '',

    published: true,

    itinerary: [],
  },
];

/* =========================================================
   HELPERS
========================================================= */

function clean(value: string | undefined): string {
  return (value ?? '').trim();
}

/* =========================================================
   DAYS
========================================================= */

export async function getTravelData(): Promise<TravelDay[]> {
  const url = process.env.GOOGLE_SHEET_CSV_URL;

  if (!url) {
    console.error('GOOGLE_SHEET_CSV_URL is missing');
    return fallback;
  }

  try {
    const res = await fetch(url, {
      next: {
        revalidate: 60,
      },
    });

    if (!res.ok) {
      throw new Error(
        `Google Sheet request failed: ${res.status}`
      );
    }

    const csvText = await res.text();

    const rows = parseCSV(csvText);

    if (!rows || rows.length < 2) {
      throw new Error('Days CSV has no data');
    }

    /* -----------------------------------------------------
       第一列 = Google Sheet 欄位名稱
    ----------------------------------------------------- */

    const headers = rows[0].map((header) =>
      clean(header)
    );

    /* -----------------------------------------------------
       找欄位位置
       同時支援中文與舊版英文欄位
    ----------------------------------------------------- */

    const getIndex = (...names: string[]): number => {
      for (const name of names) {
        const found = headers.indexOf(name);

        if (found !== -1) {
          return found;
        }
      }

      return -1;
    };

    const getValue = (
      row: string[],
      ...names: string[]
    ): string => {
      const index = getIndex(...names);

      if (index === -1) {
        return '';
      }

      return clean(row[index]);
    };

    /* -----------------------------------------------------
       Google Sheet → TravelDay
    ----------------------------------------------------- */

    const days: TravelDay[] = rows
      .slice(1)

      /* 只顯示「發布」 */
      .filter((row) => {
        const status = getValue(
          row,
          '狀態',
          'status'
        );

        return status === '發布';
      })

      .map((row) => {
        const rawLevel = Number(
          getValue(
            row,
            '厚度等級',
            '厚度',
            'level'
          ) || '1'
        );

        const level =
          Number.isFinite(rawLevel) &&
          rawLevel >= 1 &&
          rawLevel <= 5
            ? rawLevel
            : 1;

        const day: TravelDay = {
          date: getValue(
            row,
            '日期',
            'date'
          ),

          chapter: getValue(
            row,
            '篇章',
            'chapter'
          ),

          title: getValue(
            row,
            '每日主題',
            'title'
          ),

          dayTemp: getValue(
            row,
            '白天氣溫',
            'dayTemp'
          ),

          nightTemp: getValue(
            row,
            '早晚氣溫',
            'nightTemp'
          ),

          level,

          weather: getValue(
            row,
            '厚度結論',
            '天氣說明',
            'weather'
          ),

          maleOutfit: getValue(
            row,
            '男生穿搭',
            'maleOutfit'
          ),

          femaleOutfit: getValue(
            row,
            '女生穿搭',
            'femaleOutfit'
          ),

          shoes: getValue(
            row,
            '鞋款',
            'shoes'
          ),

          outerLayer: getValue(
            row,
            '外層',
            '要帶的外層',
            'outerLayer'
          ),

          notice: getValue(
            row,
            '提醒',
            '注意事項',
            'notice'
          ),

          heroImage: getValue(
            row,
            'Hero 圖',
            'Hero圖片',
            'Hero 圖片',
            'heroImage'
          ),

          maleImage: getValue(
            row,
            '男生圖片',
            '男生穿搭圖片',
            'maleImage'
          ),

          femaleImage: getValue(
            row,
            '女生圖片',
            '女生穿搭圖片',
            'femaleImage'
          ),

          published: true,

          /*
            下一階段：
            從 Itinerary 工作表加入資料
          */
          itinerary: [],
        };

        return day;
      })

      /* 避免空白日期資料進網站 */
      .filter((day) => Boolean(day.date));

    console.log(
      `Loaded ${days.length} published travel days`
    );

    if (days.length === 0) {
      console.warn(
        'No published Days found. Using fallback.'
      );

      return fallback;
    }

    return days;
  } catch (error) {
    console.error(
      'Failed to load Days CSV:',
      error
    );

    return fallback;
  }
}

/* =========================================================
   DOCUMENTS

   目前先保留 API，避免 page.tsx Build Error。
   下一階段再接 Documents Google Sheet。
========================================================= */

export async function getTravelDocuments(): Promise<
  TravelDocument[]
> {
  return [];
}

/* =========================================================
   PACKING

   目前先保留 API，避免 page.tsx Build Error。
   下一階段再接 Packing Google Sheet。
========================================================= */

export async function getPackingItems(): Promise<
  PackingItem[]
> {
  return [];
}
