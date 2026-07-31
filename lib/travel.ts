import { parseCSV } from './csv';
import type {
  TravelDay,
  ItineraryItem,
  TravelDocument,
  PackingItem,
} from '../types/travel';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

/* =========================
   Google Sheet
========================= */

function sheetUrl(sheetName: string) {
  if (!SHEET_ID) return '';

  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName
  )}`;
}

async function fetchSheet(sheetName: string): Promise<string[][]> {
  const url = sheetUrl(sheetName);

  if (!url) {
    throw new Error('GOOGLE_SHEET_ID 尚未設定');
  }

  const response = await fetch(url, {
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    throw new Error(`無法讀取 Google Sheet：${sheetName}`);
  }

  return parseCSV(await response.text());
}

/* =========================
   Helpers
========================= */

function clean(value?: string) {
  return (value || '').trim();
}

function isPublished(value?: string) {
  return clean(value) === '發布';
}

function isYes(value?: string) {
  const v = clean(value).toLowerCase();

  return (
    v === '是' ||
    v === 'true' ||
    v === '1' ||
    v === 'yes'
  );
}

function indexMap(headers: string[]) {
  const map = new Map<string, number>();

  headers.forEach((header, index) => {
    map.set(clean(header), index);
  });

  return map;
}

function value(
  row: string[],
  indexes: Map<string, number>,
  name: string
) {
  const index = indexes.get(name);

  if (index === undefined) return '';

  return clean(row[index]);
}

function normalizeDate(date: string) {
  const match = clean(date).match(
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/
  );

  if (!match) return clean(date);

  return `${match[1]}/${Number(match[2])}/${Number(match[3])}`;
}

/* =========================
   Days
========================= */

export async function getTravelDays(): Promise<TravelDay[]> {
  try {
    const rows = await fetchSheet('Days');

    const headers = rows.shift() || [];
    const indexes = indexMap(headers);

    const days: TravelDay[] = [];

    for (const row of rows) {
      if (!isPublished(value(row, indexes, '狀態'))) {
        continue;
      }

      const date = normalizeDate(
        value(row, indexes, '日期')
      );

      if (!date) continue;

      days.push({
        date,
        chapter: value(row, indexes, '篇章'),
        title: value(row, indexes, '每日主題'),

        dayTemp: value(row, indexes, '白天氣溫'),
        nightTemp: value(row, indexes, '早晚氣溫'),

        level:
          Number(value(row, indexes, '厚度等級')) || 1,

        weather: value(row, indexes, '厚度結論'),

        maleOutfit: value(row, indexes, '男生穿搭'),
        femaleOutfit: value(row, indexes, '女生穿搭'),

        shoes: value(row, indexes, '鞋款'),
        outerLayer: value(row, indexes, '外層'),
        notice: value(row, indexes, '今日提醒'),

        heroImage: value(row, indexes, '主圖網址'),
        maleImage: value(
          row,
          indexes,
          '男生穿搭圖網址'
        ),
        femaleImage: value(
          row,
          indexes,
          '女生穿搭圖網址'
        ),

        published: true,
        itinerary: [],
      });
    }

    return days;
  } catch (error) {
    console.error('Days 讀取失敗：', error);
    return [];
  }
}

/* =========================
   Itinerary
========================= */

export async function getItinerary(): Promise<
  Map<string, ItineraryItem[]>
> {
  const result = new Map<string, ItineraryItem[]>();

  try {
    const rows = await fetchSheet('Itinerary');

    const headers = rows.shift() || [];
    const indexes = indexMap(headers);

    for (const row of rows) {
      if (!isPublished(value(row, indexes, '狀態'))) {
        continue;
      }

      const date = normalizeDate(
        value(row, indexes, '日期')
      );

      if (!date) continue;

      const documentIds = value(
        row,
        indexes,
        '文件IDs'
      )
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      const item: ItineraryItem = {
        time: value(row, indexes, '開始時間'),
        place: value(row, indexes, '景點名稱'),
        description: value(
          row,
          indexes,
          '中文介紹'
        ),
        type: value(row, indexes, '類型'),
        priority: value(row, indexes, '重要性'),

        mapUrl:
          value(
            row,
            indexes,
            'Google 地圖連結'
          ) || undefined,

        documentIds:
          documentIds.length > 0
            ? documentIds
            : undefined,
      };

      if (!result.has(date)) {
        result.set(date, []);
      }

      result.get(date)!.push(item);
    }
  } catch (error) {
    console.error('Itinerary 讀取失敗：', error);
  }

  return result;
}

/* =========================
   Documents
========================= */

export async function getTravelDocuments(): Promise<
  TravelDocument[]
> {
  try {
    const rows = await fetchSheet('Documents');

    const headers = rows.shift() || [];
    const indexes = indexMap(headers);

    const documents: TravelDocument[] = [];

    for (const row of rows) {
      if (!isPublished(value(row, indexes, '狀態'))) {
        continue;
      }

      const id = value(row, indexes, 'ID');
      const name = value(
        row,
        indexes,
        '文件名稱'
      );

      if (!id || !name) continue;

      documents.push({
        id,

        category: (value(
          row,
          indexes,
          '分類'
        ) || '其他') as TravelDocument['category'],

        name,

        description:
          value(row, indexes, '說明') ||
          undefined,

        date:
          value(row, indexes, '日期') ||
          undefined,

        url: value(row, indexes, '檔案連結'),

        published: true,
      });
    }

    return documents;
  } catch (error) {
    console.error('Documents 讀取失敗：', error);
    return [];
  }
}

/* =========================
   Packing
========================= */

export async function getPackingItems(): Promise<
  PackingItem[]
> {
  try {
    const rows = await fetchSheet('Packing');

    const headers = rows.shift() || [];
    const indexes = indexMap(headers);

    const items: PackingItem[] = [];

    for (const row of rows) {
      if (!isPublished(value(row, indexes, '狀態'))) {
        continue;
      }

      const id = value(row, indexes, 'ID');
      const name = value(row, indexes, '項目');

      if (!id || !name) continue;

      items.push({
        id,
        category: value(row, indexes, '分類'),
        name,

        quantity:
          value(row, indexes, '建議數量') ||
          undefined,

        description:
          value(row, indexes, '用途') ||
          undefined,

        important: isYes(
          value(row, indexes, '重要')
        ),

        published: true,
      });
    }

    return items;
  } catch (error) {
    console.error('Packing 讀取失敗：', error);
    return [];
  }
}

/* =========================
   Combined Travel Data
========================= */

export async function getTravelData(): Promise<
  TravelDay[]
> {
  const [days, itinerary] = await Promise.all([
    getTravelDays(),
    getItinerary(),
  ]);

  return days.map((day) => ({
    ...day,
    itinerary:
      itinerary.get(normalizeDate(day.date)) || [],
  }));
}
