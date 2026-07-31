import { parseCSV } from './csv';

import type {
  TravelDay,
  TravelDocument,
  PackingItem,
  ItineraryItem,
} from '../types/travel';

/* =========================================================
   FALLBACK
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

function createTable(rows: string[][]) {
  const headers = (rows[0] ?? []).map(clean);

  const getIndex = (...names: string[]): number => {
    for (const name of names) {
      const index = headers.indexOf(name);

      if (index !== -1) {
        return index;
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

  return {
    headers,
    getValue,
  };
}

/*
  支援：

  2026/08/13
  2026/8/13
  2026-08-13
  8/13
  08/13

  統一轉成：

  8/13
*/
function normalizeDate(value: string): string {
  const cleaned = clean(value);

  if (!cleaned) {
    return '';
  }

  const normalized = cleaned
    .replace(/-/g, '/')
    .replace(/\./g, '/');

  const parts = normalized
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 3) {
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      return `${month}/${day}`;
    }
  }

  if (parts.length === 2) {
    const month = Number(parts[0]);
    const day = Number(parts[1]);

    if (
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      return `${month}/${day}`;
    }
  }

  return normalized;
}

async function fetchCSV(
  url: string
): Promise<string[][]> {
  const response = await fetch(url, {
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Google Sheet request failed: ${response.status}`
    );
  }

  const text = await response.text();

  const rows = parseCSV(text);

  if (!rows || rows.length < 2) {
    throw new Error(
      'Google Sheet CSV has no data'
    );
  }

  return rows;
}

/* =========================================================
   ITINERARY
========================================================= */

async function getItineraryMap(): Promise<
  Map<string, ItineraryItem[]>
> {
  const url =
    process.env.GOOGLE_SHEET_ITINERARY_CSV_URL;

  const map =
    new Map<string, ItineraryItem[]>();

  if (!url) {
    console.warn(
      'GOOGLE_SHEET_ITINERARY_CSV_URL is missing'
    );

    return map;
  }

  try {
    const rows = await fetchCSV(url);

    const { getValue } =
      createTable(rows);

    for (const row of rows.slice(1)) {
      const status = getValue(
        row,
        '狀態',
        'status'
      );

      if (status !== '發布') {
        continue;
      }

      const rawDate = getValue(
        row,
        '日期',
        'date'
      );

      const dateKey =
        normalizeDate(rawDate);

      if (!dateKey) {
        continue;
      }

      const startTime = getValue(
        row,
        '開始時間',
        '時間',
        'time'
      );

      const endTime = getValue(
        row,
        '結束時間',
        'endTime'
      );

      const place = getValue(
        row,
        '景點名稱',
        '地點',
        'place'
      );

      const description = getValue(
        row,
        '中文介紹',
        '說明',
        'description'
      );

      const type = getValue(
        row,
        '類型',
        'type'
      );

      const priority = getValue(
        row,
        '重要度',
        '優先度',
        'priority'
      );

      const mapUrl = getValue(
        row,
        '地圖連結',
        'Google Maps',
        'mapUrl'
      );

      /*
        如果未來 Itinerary 新增「文件ID」欄，
        可填：

        DOC001,DOC002

        或：

        DOC001、DOC002
      */
      const rawDocumentIds = getValue(
        row,
        '文件ID',
        '文件 ID',
        'documentIds'
      );

      const documentIds =
        rawDocumentIds
          ? rawDocumentIds
              .split(/[,，、]/)
              .map((id) => id.trim())
              .filter(Boolean)
          : undefined;

      let time = startTime;

      if (startTime && endTime) {
        time =
          `${startTime}–${endTime}`;
      }

      const item: ItineraryItem = {
        time,
        place,
        description,
        type,
        priority,

        mapUrl:
          mapUrl || undefined,

        documentIds:
          documentIds?.length
            ? documentIds
            : undefined,
      };

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }

      map.get(dateKey)!.push(item);
    }

    console.log(
      `Loaded itinerary for ${map.size} travel days`
    );

    return map;
  } catch (error) {
    console.error(
      'Failed to load Itinerary CSV:',
      error
    );

    return map;
  }
}

/* =========================================================
   DAYS
========================================================= */

export async function getTravelData(): Promise<
  TravelDay[]
> {
  const daysUrl =
    process.env.GOOGLE_SHEET_CSV_URL;

  if (!daysUrl) {
    console.error(
      'GOOGLE_SHEET_CSV_URL is missing'
    );

    return fallback;
  }

  try {
    const [rows, itineraryMap] =
      await Promise.all([
        fetchCSV(daysUrl),
        getItineraryMap(),
      ]);

    const { getValue } =
      createTable(rows);

    const days: TravelDay[] = rows
      .slice(1)

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

        const date = getValue(
          row,
          '日期',
          'date'
        );

        const dateKey =
          normalizeDate(date);

        return {
          date,

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

          itinerary:
            itineraryMap.get(dateKey) ??
            [],
        };
      })

      .filter((day) =>
        Boolean(day.date)
      );

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
      'Failed to load travel data:',
      error
    );

    return fallback;
  }
}

/* =========================================================
   DOCUMENTS
========================================================= */

export async function getTravelDocuments(): Promise<
  TravelDocument[]
> {
  const url =
    process.env.GOOGLE_SHEET_DOCUMENTS_CSV_URL;

  if (!url) {
    console.warn(
      'GOOGLE_SHEET_DOCUMENTS_CSV_URL is missing'
    );

    return [];
  }

  try {
    const rows = await fetchCSV(url);

    const { getValue } =
      createTable(rows);

    const documents: TravelDocument[] =
      rows
        .slice(1)

        /* 只讀取發布資料 */
        .filter((row) => {
          const status = getValue(
            row,
            '狀態',
            'status'
          );

          return status === '發布';
        })

        .map((row) => {
          const id = getValue(
            row,
            'ID',
            'id'
          );

          const rawCategory =
            getValue(
              row,
              '分類',
              'category'
            );

          /*
            避免 Sheet 裡出現非型別允許值，
            導致 TypeScript 問題。
          */
          const allowedCategories:
            TravelDocument['category'][] =
            [
              '航班',
              '住宿',
              '租車',
              '景點',
              '保險',
              '其他',
            ];

          const category:
            TravelDocument['category'] =
            allowedCategories.includes(
              rawCategory as TravelDocument['category']
            )
              ? (rawCategory as TravelDocument['category'])
              : '其他';

          const name = getValue(
            row,
            '文件名稱',
            'name'
          );

          const description =
            getValue(
              row,
              '說明',
              'description'
            );

          const rawDate = getValue(
            row,
            '日期',
            'date'
          );

          const url = getValue(
            row,
            '檔案連結',
            '文件連結',
            'url'
          );

          const document:
            TravelDocument = {
            id,
            category,
            name,

            description:
              description || undefined,

            /*
              這裡保留 Sheet 原本日期，
              UI 如果要比對日期再 normalize。
            */
            date:
              rawDate || undefined,

            /*
              url 在 TravelDocument 型別中
              是必填，所以空白時給空字串。
            */
            url,

            published: true,
          };

          return document;
        })

        /*
          ID 與文件名稱至少要存在。
        */
        .filter(
          (document) =>
            Boolean(document.id) &&
            Boolean(document.name)
        );

    console.log(
      `Loaded ${documents.length} published documents`
    );

    return documents;
  } catch (error) {
    console.error(
      'Failed to load Documents CSV:',
      error
    );

    return [];
  }
}

/* =========================================================
   PACKING
   下一階段再接 Google Sheet
========================================================= */

export async function getPackingItems(): Promise<
  PackingItem[]
> {
  return [];
}
