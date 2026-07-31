'use client';

import { useMemo, useState } from 'react';
import type { TravelDay } from '../types/travel';

type PageName = 'today' | 'overview' | 'documents' | 'packing';
type OverviewView = 'list' | 'detail';
type DayView = 'detail' | 'level';

/* =========================================================
   ICONS
========================================================= */

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 14h2M14 14h2M8 18h2M14 18h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function OverviewIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="7" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2M9 11v6M15 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M10 7l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="m4 18 5-5 3.5 3.5L15 14l5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* =========================================================
   DATE HELPERS
========================================================= */

function normalizeDate(date: string) {
  return date.replace(/-/g, '/');
}

function dateToNumber(date: string) {
  return Number(normalizeDate(date).replace(/\//g, ''));
}

function formatDate(date: string) {
  const parts = normalizeDate(date).split('/');

  if (parts.length >= 3) {
    return `${parts[1]}.${parts[2]}`;
  }

  return date;
}

function getWeekday(date: string) {
  const normalized = normalizeDate(date).replace(/\//g, '-');
  const parsed = new Date(`${normalized}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat('zh-TW', {
    weekday: 'long',
  }).format(parsed);
}

function getDateInTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';

  return `${year}/${month}/${day}`;
}

/*
  旅行日期邏輯：

  08/13–08/15 Vancouver
  08/16–08/18 Yellowknife
  08/19–08/26 Alberta
  08/27–08/28 Vancouver

  08/13 前 → 固定顯示 08/13
  旅行期間 → 加拿大當地日期
  08/28 後 → 固定顯示 08/28
*/

function getTripTodayDate() {
  const vancouverDate = getDateInTimeZone('America/Vancouver');
  const mountainDate = getDateInTimeZone('America/Edmonton');

  const vancouverNumber = dateToNumber(vancouverDate);
  const mountainNumber = dateToNumber(mountainDate);

  if (vancouverNumber < 20260813 && mountainNumber < 20260813) {
    return '2026/08/13';
  }

  if (vancouverNumber > 20260828 && mountainNumber > 20260828) {
    return '2026/08/28';
  }

  if (vancouverNumber >= 20260813 && vancouverNumber <= 20260815) {
    return vancouverDate;
  }

  if (mountainNumber >= 20260816 && mountainNumber <= 20260826) {
    return mountainDate;
  }

  if (vancouverNumber >= 20260827 && vancouverNumber <= 20260828) {
    return vancouverDate;
  }

  return vancouverDate;
}

/* =========================================================
   LEVEL SYSTEM
========================================================= */

const levelGuides = {
  1: {
    title: '夏季輕裝',
    temperature: '20°C 以上',
    summary: '天氣溫暖，以透氣、輕量與防曬為主。',
    morning: '短袖或透氣上衣即可；怕冷的人可帶一件薄襯衫。',
    daytime: '短袖、薄長褲或輕量下身，注意防曬與補水。',
    evening: '若靠海或有風，可加一件非常薄的外層。',
    base: '短袖 T-shirt、透氣排汗上衣',
    mid: '通常不需要',
    outer: '薄襯衫、超輕量外套',
    bottom: '薄長褲、休閒褲',
    shoes: '舒適步行鞋、運動鞋',
    bring: '墨鏡、防曬、帽子、薄外套',
  },

  2: {
    title: '薄外層',
    temperature: '15–20°C',
    summary: '白天舒適，但早晚、陰影處或有風時會明顯偏涼。',
    morning: '短袖或薄長袖，加一件薄外套。',
    daytime: '升溫後可脫外套，以長袖或短袖活動。',
    evening: '重新穿上薄外套；靠海或風大時建議長褲。',
    base: '短袖、薄長袖',
    mid: '薄針織、薄衛衣，可視情況省略',
    outer: '薄風衣、輕量外套',
    bottom: '長褲、休閒褲',
    shoes: '運動鞋、舒適步行鞋',
    bring: '薄外套、墨鏡、帽子',
  },

  3: {
    title: '保暖＋防風',
    temperature: '10–15°C',
    summary: '開始需要真正的分層穿搭，尤其湖區、山區與有風環境。',
    morning: '長袖底層＋刷毛或薄中層＋防風外套。',
    daytime: '活動後可脫中層，但防風外層建議隨身攜帶。',
    evening: '氣溫下降後重新加上中層，怕冷者可加輕羽絨。',
    base: '長袖上衣、排汗底層',
    mid: '刷毛、衛衣、薄針織',
    outer: '防風外套、輕量 Shell',
    bottom: '長褲、機能褲',
    shoes: '抓地力較好的步行鞋或健行鞋',
    bring: '防風外套、薄羽絨或刷毛中層',
  },

  4: {
    title: '羽絨分層',
    temperature: '5–10°C',
    summary: '低溫環境需要完整三層穿法，久站時體感會比數字更冷。',
    morning: '保暖底層＋刷毛中層＋輕羽絨。',
    daytime: '活動時可依體感脫掉羽絨，但中層不要離身。',
    evening: '羽絨重新穿上，風大時外加防風 Shell。',
    base: '保暖長袖、機能底層',
    mid: '刷毛、保暖針織',
    outer: '輕羽絨＋視情況加 Shell',
    bottom: '厚長褲、機能長褲',
    shoes: '健行鞋、防滑步行鞋',
    bring: '羽絨、Shell、薄帽、保暖配件',
  },

  5: {
    title: '高山禦寒',
    temperature: '0–5°C／高山強風',
    summary: '以保暖、防風與保持乾燥為優先，不適合只靠單件厚外套。',
    morning: '保暖底層＋刷毛中層＋羽絨＋防風防水 Shell。',
    daytime: '依活動量調整中層，但外層需隨時可穿回。',
    evening: '完整保暖層穿回，必要時加帽子、手套與頸部保暖。',
    base: '保暖機能底層',
    mid: '厚刷毛、保暖中層',
    outer: '羽絨＋防風防水 Shell',
    bottom: '厚長褲、機能褲，怕冷可加底層',
    shoes: '防滑健行鞋、防水鞋款',
    bring: '羽絨、Shell、帽子、手套、保暖配件',
  },
} as const;

function safeLevel(level: number): 1 | 2 | 3 | 4 | 5 {
  if (level <= 1) return 1;
  if (level >= 5) return 5;

  return Math.round(level) as 1 | 2 | 3 | 4 | 5;
}

function levelName(level: number) {
  return levelGuides[safeLevel(level)].title;
}

/* =========================================================
   PACKING
========================================================= */

const packingItems = [
  '護照',
  '加拿大 eTA',
  '國際駕照',
  '台灣駕照正本',
  '信用卡',
  '旅遊保險資料',
  '航班與住宿憑證',
  '租車預約資料',
  '手機與充電器',
  '行動電源',
  '加拿大轉接插頭',
  '常用藥品',
  '薄外套',
  '防風防水外套',
  '保暖中層',
  '舒適步行鞋',
  '墨鏡',
  '防曬用品',
  '帽子',
  '水壺',
];

/* =========================================================
   MAIN APP
========================================================= */

export default function TravelApp({
  days,
}: {
  days: TravelDay[];
}) {
  const publishedDays = useMemo(
    () => days.filter((day) => day.published !== false),
    [days]
  );

  const chapters = useMemo(
    () => [...new Set(publishedDays.map((day) => day.chapter))],
    [publishedDays]
  );

  const [page, setPage] = useState<PageName>('today');

  const [todayView, setTodayView] =
    useState<DayView>('detail');

  const [overviewView, setOverviewView] =
    useState<OverviewView>('list');

  const [overviewDayView, setOverviewDayView] =
    useState<DayView>('detail');

  const [overviewDate, setOverviewDate] =
    useState('');

  const [overviewChapter, setOverviewChapter] =
    useState('全部');

  const [checkedItems, setCheckedItems] =
    useState<string[]>([]);

  const todayDate = getTripTodayDate();

  const todayDay =
    publishedDays.find(
      (day) =>
        normalizeDate(day.date) === normalizeDate(todayDate)
    ) || publishedDays[0];

  const overviewDay =
    publishedDays.find(
      (day) => day.date === overviewDate
    ) || publishedDays[0];

  const overviewDays = useMemo(() => {
    if (overviewChapter === '全部') {
      return publishedDays;
    }

    return publishedDays.filter(
      (day) => day.chapter === overviewChapter
    );
  }, [publishedDays, overviewChapter]);

  function goTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function switchPage(nextPage: PageName) {
    setPage(nextPage);

    if (nextPage === 'today') {
      setTodayView('detail');
    }

    if (nextPage === 'overview') {
      setOverviewView('list');
      setOverviewDayView('detail');
    }

    goTop();
  }

  function openOverviewDay(date: string) {
    setOverviewDate(date);
    setOverviewView('detail');
    setOverviewDayView('detail');
    goTop();
  }

  function backToOverview() {
    setOverviewView('list');
    setOverviewDayView('detail');
    goTop();
  }

  function openTodayLevel() {
    setTodayView('level');
    goTop();
  }

  function closeTodayLevel() {
    setTodayView('detail');
    goTop();
  }

  function openOverviewLevel() {
    setOverviewDayView('level');
    goTop();
  }

  function closeOverviewLevel() {
    setOverviewDayView('detail');
    goTop();
  }

  function togglePacking(item: string) {
    setCheckedItems((current) =>
      current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item]
    );
  }

  const navItems = [
    {
      id: 'today' as PageName,
      label: '今日',
      icon: <CalendarIcon />,
    },
    {
      id: 'overview' as PageName,
      label: '總覽',
      icon: <OverviewIcon />,
    },
    {
      id: 'documents' as PageName,
      label: '檔案',
      icon: <FileIcon />,
    },
    {
      id: 'packing' as PageName,
      label: '行李',
      icon: <BagIcon />,
    },
  ];

  if (!publishedDays.length) {
    return (
      <main>
        <SiteHeader />

        <section className="contentPage">
          <p className="eyebrow">CANADA 2026</p>
          <h2>目前沒有可顯示的行程</h2>
          <p>請確認至少有一天行程設定為發布。</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <SiteHeader />

      {/* TODAY */}

      {page === 'today' &&
        todayDay &&
        todayView === 'detail' && (
          <DayDetail
            day={todayDay}
            mode="today"
            onOpenLevel={openTodayLevel}
          />
        )}

      {page === 'today' &&
        todayDay &&
        todayView === 'level' && (
          <LevelGuidePage
            day={todayDay}
            onBack={closeTodayLevel}
            backLabel={`返回 ${formatDate(todayDay.date)} 行程`}
          />
        )}

      {/* OVERVIEW */}

      {page === 'overview' &&
        overviewView === 'list' && (
          <OverviewPage
            days={overviewDays}
            chapters={chapters}
            activeChapter={overviewChapter}
            onChapterChange={setOverviewChapter}
            onOpenDay={openOverviewDay}
          />
        )}

      {page === 'overview' &&
        overviewView === 'detail' &&
        overviewDay &&
        overviewDayView === 'detail' && (
          <div>
            <div className="subPageHeader">
              <button
                className="backButton"
                onClick={backToOverview}
              >
                <BackIcon />
                返回行程總覽
              </button>
            </div>

            <DayDetail
              day={overviewDay}
              mode="overview"
              onOpenLevel={openOverviewLevel}
            />
          </div>
        )}

      {page === 'overview' &&
        overviewView === 'detail' &&
        overviewDay &&
        overviewDayView === 'level' && (
          <LevelGuidePage
            day={overviewDay}
            onBack={closeOverviewLevel}
            backLabel={`返回 ${formatDate(overviewDay.date)} 行程`}
          />
        )}

      {/* DOCUMENTS */}

      {page === 'documents' && <DocumentsPage />}

      {/* PACKING */}

      {page === 'packing' && (
        <PackingPage
          checkedItems={checkedItems}
          onToggle={togglePacking}
        />
      )}

      {/* NAV */}

      <nav
        className="bottomNav"
        aria-label="主要導覽"
      >
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={
              page === item.id ? 'active' : ''
            }
            onClick={(event) => {
              event.preventDefault();
              switchPage(item.id);
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}

/* =========================================================
   HEADER
========================================================= */

function SiteHeader() {
  return (
    <header className="siteHeader">
      <div>
        <strong>CANADA 2026</strong>
        <span>旅行手冊</span>
      </div>

      <p>08.13 — 08.28</p>
    </header>
  );
}

/* =========================================================
   DAY DETAIL

   新結構：

   1. 日期 / 主題
   2. LEVEL 穿搭入口
   3. 天氣
   4. HERO
   5. 行程

   DAILY WARDROBE 已完全移除
========================================================= */

function DayDetail({
  day,
  mode,
  onOpenLevel,
}: {
  day: TravelDay;
  mode: 'today' | 'overview';
  onOpenLevel: () => void;
}) {
  return (
    <div className="todayPage">

      {/* HERO INFO */}

      <section className="todayHero">
        <p className="dateLabel">
          {formatDate(day.date)} ・ {getWeekday(day.date)}
        </p>

        <h1>{day.title}</h1>

        <p className="chapterLabel">
          {day.chapter}
        </p>

        {/* 穿搭唯一入口 */}

        <button
          className="levelButton"
          onClick={onOpenLevel}
        >
          <div>
            <span>建議穿著</span>

            <strong>
              LEVEL {safeLevel(day.level)}
              ｜{levelName(day.level)}
            </strong>
          </div>

          <ArrowIcon />
        </button>

        {/* WEATHER */}

        <div className="weatherGrid">
          <div>
            <span>白天</span>
            <strong>{day.dayTemp}</strong>
          </div>

          <div>
            <span>早晚</span>
            <strong>{day.nightTemp}</strong>
          </div>
        </div>

        <p className="weatherText">
          {day.weather}
        </p>
      </section>

      {/* =====================================================
          DAILY HERO IMAGE

          有 heroImage → 顯示圖片
          沒有 heroImage → 保留完整 Hero 位置
      ===================================================== */}

      <figure className="destinationHero">
        {day.heroImage ? (
          <>
            <img
              src={day.heroImage}
              alt={`${day.title} 當日精選景色`}
            />

            <figcaption>
              <span>
                {mode === 'today'
                  ? "TODAY'S HIGHLIGHT"
                  : 'DAY HIGHLIGHT'}
              </span>

              <strong>{day.title}</strong>
            </figcaption>
          </>
        ) : (
          <div className="heroPlaceholder">
            <ImageIcon />

            <div>
              <span>TODAY'S HIGHLIGHT</span>

              <strong>
                當日精選景色
              </strong>

              <p>
                {formatDate(day.date)} ・ {day.title}
              </p>
            </div>
          </div>
        )}
      </figure>

      {/* DAILY JOURNEY */}

      <section className="routeSection">
        <p className="eyebrow">
          DAILY JOURNEY
        </p>

        <h2>當日行程</h2>

        <div className="timeline">
          {day.itinerary.map(
            (item, index) => (
              <div
                className="stop"
                key={`${item.time}-${item.place}-${index}`}
              >
                <time>
                  {item.time}
                </time>

                <div>
                  <b>{item.place}</b>

                  {item.description && (
                    <p>
                      {item.description}
                    </p>
                  )}

                  {item.mapUrl && (
                    <a
                      className="mapLink"
                      href={item.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapIcon />
                      Google Maps
                    </a>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   LEVEL GUIDE
========================================================= */

function LevelGuidePage({
  day,
  onBack,
  backLabel,
}: {
  day: TravelDay;
  onBack: () => void;
  backLabel: string;
}) {
  const level = safeLevel(day.level);
  const guide = levelGuides[level];

  return (
    <div className="levelGuidePage">

      <div className="subPageHeader">
        <button
          className="backButton"
          onClick={onBack}
        >
          <BackIcon />
          {backLabel}
        </button>
      </div>

      {/* LEVEL HERO */}

      <section className="levelGuideHero">
        <p className="eyebrow lightEyebrow">
          WARDROBE LEVEL
        </p>

        <span className="levelNumber">
          LEVEL {level}
        </span>

        <h1>{guide.title}</h1>

        <p className="levelTemperature">
          {guide.temperature}
        </p>

        <p className="levelSummary">
          {guide.summary}
        </p>

        <div className="dayContext">
          <span>套用到這一天</span>

          <strong>
            {formatDate(day.date)}
            {' ・ '}
            {day.title}
          </strong>

          <small>
            白天 {day.dayTemp}
            {' ／ '}
            早晚 {day.nightTemp}
          </small>
        </div>
      </section>

      {/* TIME OF DAY */}

      <section className="levelContent">
        <p className="eyebrow">
          HOW TO DRESS
        </p>

        <h2>早晚怎麼穿</h2>

        <div className="timeWearGrid">

          <article>
            <span>早上</span>
            <strong>MORNING</strong>
            <p>{guide.morning}</p>
          </article>

          <article>
            <span>白天</span>
            <strong>DAYTIME</strong>
            <p>{guide.daytime}</p>
          </article>

          <article>
            <span>傍晚</span>
            <strong>EVENING</strong>
            <p>{guide.evening}</p>
          </article>

        </div>
      </section>

      {/* LAYERS */}

      <section className="layerSection">
        <p className="eyebrow">
          LAYERING SYSTEM
        </p>

        <h2>分層穿搭</h2>

        <div className="layerList">

          <div>
            <span>01</span>

            <div>
              <b>
                底層 Base Layer
              </b>

              <p>{guide.base}</p>
            </div>
          </div>

          <div>
            <span>02</span>

            <div>
              <b>
                中層 Mid Layer
              </b>

              <p>{guide.mid}</p>
            </div>
          </div>

          <div>
            <span>03</span>

            <div>
              <b>
                外層 Outer Layer
              </b>

              <p>{guide.outer}</p>
            </div>
          </div>

          <div>
            <span>04</span>

            <div>
              <b>
                下身 Bottom
              </b>

              <p>{guide.bottom}</p>
            </div>
          </div>

          <div>
            <span>05</span>

            <div>
              <b>
                鞋款 Shoes
              </b>

              <p>{guide.shoes}</p>
            </div>
          </div>

        </div>
      </section>

      {/* BRING */}

      <section className="bringSection">
        <p className="eyebrow">
          DON'T FORGET
        </p>

        <h2>記得帶</h2>

        <div className="bringCard">
          <BagIcon />

          <p>
            {guide.bring}
          </p>
        </div>

        {day.notice && (
          <p className="notice">
            {day.notice}
          </p>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function OverviewPage({
  days,
  chapters,
  activeChapter,
  onChapterChange,
  onOpenDay,
}: {
  days: TravelDay[];
  chapters: string[];
  activeChapter: string;
  onChapterChange: (chapter: string) => void;
  onOpenDay: (date: string) => void;
}) {
  return (
    <section className="contentPage">
      <p className="eyebrow">
        TRIP OVERVIEW
      </p>

      <h2>行程總覽</h2>

      <div className="chapterTabs">

        <button
          className={
            activeChapter === '全部'
              ? 'active'
              : ''
          }
          onClick={() =>
            onChapterChange('全部')
          }
        >
          全部
        </button>

        {chapters.map((chapter) => (
          <button
            key={chapter}
            className={
              activeChapter === chapter
                ? 'active'
                : ''
            }
            onClick={() =>
              onChapterChange(chapter)
            }
          >
            {chapter}
          </button>
        ))}

      </div>

      <div className="dayList">

        {days.map((day) => (
          <button
            key={day.date}
            onClick={() =>
              onOpenDay(day.date)
            }
          >
            <span>
              {formatDate(day.date)}
              <br />
              {getWeekday(day.date)}
            </span>

            <strong>
              {day.title}
            </strong>

            <small>
              {day.chapter}
            </small>
          </button>
        ))}

      </div>
    </section>
  );
}

/* =========================================================
   DOCUMENTS
========================================================= */

function DocumentsPage() {
  return (
    <section className="contentPage">
      <p className="eyebrow">
        TRAVEL DOCUMENTS
      </p>

      <h2>重要檔案</h2>

      <div className="emptyCard">
        <FileIcon />

        <strong>
          旅行文件
        </strong>

        <p>
          航班、住宿、租車、景點、保險等重要憑證與下載連結，
          之後統一整理在這裡。
        </p>
      </div>
    </section>
  );
}

/* =========================================================
   PACKING
========================================================= */

function PackingPage({
  checkedItems,
  onToggle,
}: {
  checkedItems: string[];
  onToggle: (item: string) => void;
}) {
  const completed =
    checkedItems.length;

  const total =
    packingItems.length;

  return (
    <section className="contentPage">
      <p className="eyebrow">
        PACKING CHECKLIST
      </p>

      <h2>行李清單</h2>

      <div className="packingProgress">
        <span>
          準備進度
        </span>

        <strong>
          {completed} / {total}
        </strong>
      </div>

      <div className="checklistPreview">

        {packingItems.map((item) => (
          <label key={item}>

            <input
              type="checkbox"
              checked={
                checkedItems.includes(item)
              }
              onChange={() =>
                onToggle(item)
              }
            />

            <span>
              {item}
            </span>

          </label>
        ))}

      </div>
    </section>
  );
}
