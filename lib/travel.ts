import { parseCSV } from './csv';
import type { TravelDay } from '../types/travel';

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

function clean(value: string | undefined) {
  return (value ?? '').trim();
}

export async function getTravelData(): Promise<TravelDay[]> {
  const url = process.env.GOOGLE_SHEET_CSV_URL;

  if (!url) {
    console.error('GOOGLE_SHEET_CSV_URL is missing');
    return fallback;
  }

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Google Sheet request failed: ${res.status}`);
    }

    const text = await res.text();
    const rows = parseCSV(text);

    if (rows.length < 2) {
      throw new Error('Days CSV has no data');
    }

    const headers = rows[0].map((header) => clean(header));

    const index = (...names: string[]) => {
      for (const name of names) {
        const found = headers.indexOf(name);
        if (found !== -1) return found;
      }
      return -1;
    };

    const value = (row: string[], ...names: string[]) => {
      const i = index(...names);
      return i >= 0 ? clean(row[i]) : '';
    };

    const days: TravelDay[] = rows
      .slice(1)
      .filter((row) => value(row, '狀態', 'status') === '發布')
      .map((row) => {
        const level = Number(
          value(row, '厚度等級', '厚度', 'level') || '1'
        );

        return {
          date: value(row, '日期', 'date'),
          chapter: value(row, '篇章', 'chapter'),
          title: value(row, '每日主題', 'title'),

          dayTemp: value(row, '白天氣溫', 'dayTemp'),
          nightTemp: value(row, '早晚氣溫', 'nightTemp'),

          level:
            Number.isFinite(level) && level >= 1 && level <= 5
              ? level
              : 1,

          weather: value(
            row,
            '厚度結論',
            '天氣說明',
            'weather'
          ),

          maleOutfit: value(row, '男生穿搭', 'maleOutfit'),
          femaleOutfit: value(row, '女生穿搭', 'femaleOutfit'),

          shoes: value(row, '鞋款', 'shoes'),
          outerLayer: value(
            row,
            '外層',
            '要帶的外層',
            'outerLayer'
          ),

          notice: value(
            row,
            '提醒',
            '注意事項',
            'notice'
          ),

          heroImage: value(
            row,
            'Hero 圖',
            'Hero圖片',
            'heroImage'
          ),

          maleImage: value(
            row,
            '男生圖片',
            'maleImage'
          ),

          femaleImage: value(
            row,
            '女生圖片',
            'femaleImage'
          ),

          published: true,

          // 下一步再從 Itinerary 工作表接進來
          itinerary: [],
        };
      })
      .filter((day) => day.date);

    console.log(`Loaded ${days.length} published travel days`);

    return days.length > 0 ? days : fallback;
  } catch (error) {
    console.error('Failed to load Days CSV:', error);
    return fallback;
  }
}
