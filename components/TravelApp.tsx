'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  TravelDay,
  TravelDocument,
  PackingItem,
} from '../types/travel';

type PageName =
  | 'today'
  | 'overview'
  | 'documents'
  | 'packing';

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
      <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
   DATE
========================================================= */

function normalizeDate(date: string) {
  return date.replace(/-/g, '/');
}

function dateNumber(date: string) {
  const [year, month, day] = normalizeDate(date)
    .split('/')
    .map(Number);

  return year * 10000 + month * 100 + day;
}

function formatDate(date: string) {
  const [, month, day] = normalizeDate(date).split('/');

  return `${String(Number(month)).padStart(2, '0')}.${String(
    Number(day)
  ).padStart(2, '0')}`;
}

function sameTravelDate(a?: string, b?: string) {
  if (!a || !b) return false;

  const parse = (value: string) => {
    const parts = normalizeDate(value).split('/').map(Number);
    if (parts.length === 3) return [parts[1], parts[2]];
    if (parts.length === 2) return [parts[0], parts[1]];
    return [0, 0];
  };

  const [am, ad] = parse(a);
  const [bm, bd] = parse(b);
  return am === bm && ad === bd;
}

function getWeekday(date: string) {
  const [year, month, day] = normalizeDate(date)
    .split('/')
    .map(Number);

  if (!year || !month || !day) return '';

  const parsed = new Date(
    Date.UTC(year, month - 1, day, 12)
  );

  return new Intl.DateTimeFormat('zh-TW', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(parsed);
}

function getDateInTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year =
    parts.find((x) => x.type === 'year')?.value || '';

  const month =
    parts.find((x) => x.type === 'month')?.value || '';

  const day =
    parts.find((x) => x.type === 'day')?.value || '';

  return `${year}/${month}/${day}`;
}

/*
  8/13 前：顯示第一天
  旅行期間：依所在地日期
  8/28 後：顯示最後一天
*/

function getTripTodayDate() {
  const vancouver = getDateInTimeZone(
    'America/Vancouver'
  );

  const mountain = getDateInTimeZone(
    'America/Edmonton'
  );

  const v = dateNumber(vancouver);
  const m = dateNumber(mountain);

  if (v < 20260813 && m < 20260813) {
    return '2026/8/13';
  }

  if (v > 20260828 && m > 20260828) {
    return '2026/8/28';
  }

  if (v >= 20260813 && v <= 20260815) {
    return vancouver;
  }

  if (m >= 20260816 && m <= 20260826) {
    return mountain;
  }

  if (v >= 20260827 && v <= 20260828) {
    return vancouver;
  }

  return vancouver;
}

/* =========================================================
   LEVELS
========================================================= */

const levelGuides = {
  1: {
    title: '夏季輕裝',
    temperature: '20°C 以上',
    summary: '天氣溫暖，以透氣、輕量與防曬為主。',
    morning: '短袖或透氣上衣即可；怕冷的人可帶薄襯衫。',
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

/* =========================================================
   APP
========================================================= */

export default function TravelApp({
  days,
  documents,
  packingItems,
}: {
  days: TravelDay[];
  documents: TravelDocument[];
  packingItems: PackingItem[];
}) {
  const publishedDays = useMemo(
    () =>
      days
        .filter((day) => day.published !== false)
        .sort(
          (a, b) =>
            dateNumber(a.date) - dateNumber(b.date)
        ),
    [days]
  );

  const publishedDocuments = useMemo(
    () =>
      documents.filter(
        (document) => document.published !== false
      ),
    [documents]
  );

  const publishedPacking = useMemo(
    () =>
      packingItems.filter(
        (item) => item.published !== false
      ),
    [packingItems]
  );

  const chapters = useMemo(
    () => [
      ...new Set(
        publishedDays.map((day) => day.chapter)
      ),
    ],
    [publishedDays]
  );

  const [page, setPage] =
    useState<PageName>('today');

  const [todayView, setTodayView] =
    useState<DayView>('detail');

  const [overviewDate, setOverviewDate] =
    useState('');

  const [overviewChapter, setOverviewChapter] =
    useState('全部');

  const [overviewView, setOverviewView] =
    useState<'list' | 'detail'>('list');

  const [overviewDayView, setOverviewDayView] =
    useState<DayView>('detail');

  const [checkedItems, setCheckedItems] =
    useState<string[]>([]);

  const [packingReady, setPackingReady] =
    useState(false);

  useEffect(() => {
    const validIds = new Set(
      publishedPacking.map((item) => item.id)
    );

    const defaultIds = publishedPacking
      .filter((item) => item.defaultCompleted)
      .map((item) => item.id);

    try {
      const raw = window.localStorage.getItem(
        'canada-2026-packing'
      );

      if (!raw) {
        setCheckedItems(defaultIds);
      } else {
        const saved = JSON.parse(raw);

        setCheckedItems(
          Array.isArray(saved)
            ? saved.filter(
                (id): id is string =>
                  typeof id === 'string' &&
                  validIds.has(id)
              )
            : defaultIds
        );
      }
    } catch {
      setCheckedItems(defaultIds);
    }

    setPackingReady(true);
  }, [publishedPacking]);

  useEffect(() => {
    if (!packingReady) {
      return;
    }

    window.localStorage.setItem(
      'canada-2026-packing',
      JSON.stringify(checkedItems)
    );
  }, [checkedItems, packingReady]);

  const todayDate = getTripTodayDate();

  const todayDay =
    publishedDays.find(
      (day) =>
        dateNumber(day.date) ===
        dateNumber(todayDate)
    ) ||
    publishedDays[0];

  const overviewDay =
    publishedDays.find(
      (day) => day.date === overviewDate
    ) ||
    publishedDays[0];

  const overviewDays =
    overviewChapter === '全部'
      ? publishedDays
      : publishedDays.filter(
          (day) =>
            day.chapter === overviewChapter
        );

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

  function togglePacking(id: string) {
    setCheckedItems((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
  }

  function resetPacking() {
    const defaults = publishedPacking
      .filter((item) => item.defaultCompleted)
      .map((item) => item.id);

    setCheckedItems(defaults);
  }

  if (!publishedDays.length) {
    return (
      <main>
        <SiteHeader />

        <section className="contentPage">
          <p className="eyebrow">
            CANADA 2026
          </p>

          <h2>目前沒有可顯示的行程</h2>

          <p>
            請確認 V4 Google Sheet 的 Days
            工作表已有「發布」中的行程。
          </p>
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
            documents={publishedDocuments}
            onOpenLevel={() => {
              setTodayView('level');
              goTop();
            }}
          />
        )}

      {page === 'today' &&
        todayDay &&
        todayView === 'level' && (
          <LevelGuidePage
            day={todayDay}
            onBack={() => {
              setTodayView('detail');
              goTop();
            }}
          />
        )}

      {/* OVERVIEW */}

      {page === 'overview' &&
        overviewView === 'list' && (
          <OverviewPage
            days={overviewDays}
            chapters={chapters}
            activeChapter={overviewChapter}
            onChapterChange={
              setOverviewChapter
            }
            onOpenDay={openOverviewDay}
          />
        )}

      {page === 'overview' &&
        overviewView === 'detail' &&
        overviewDay &&
        overviewDayView === 'detail' && (
          <>
            <div className="subPageHeader">
              <button
                className="backButton"
                onClick={() => {
                  setOverviewView('list');
                  goTop();
                }}
              >
                <BackIcon />
                返回行程總覽
              </button>
            </div>

            <DayDetail
              day={overviewDay}
              documents={publishedDocuments}
              onOpenLevel={() => {
                setOverviewDayView('level');
                goTop();
              }}
            />
          </>
        )}

      {page === 'overview' &&
        overviewView === 'detail' &&
        overviewDay &&
        overviewDayView === 'level' && (
          <LevelGuidePage
            day={overviewDay}
            onBack={() => {
              setOverviewDayView('detail');
              goTop();
            }}
          />
        )}

      {/* DOCUMENTS */}

      {page === 'documents' && (
        <DocumentsPage
          documents={publishedDocuments}
        />
      )}

      {/* PACKING */}

      {page === 'packing' && (
        <PackingPage
          items={publishedPacking}
          checkedItems={checkedItems}
          onToggle={togglePacking}
          onReset={resetPacking}
        />
      )}

      <nav
        className="bottomNav"
        aria-label="主要導覽"
      >
        <a
          href="#today"
          className={
            page === 'today' ? 'active' : ''
          }
          onClick={(event) => {
            event.preventDefault();
            switchPage('today');
          }}
        >
          <CalendarIcon />
          <span>今日</span>
        </a>

        <a
          href="#overview"
          className={
            page === 'overview' ? 'active' : ''
          }
          onClick={(event) => {
            event.preventDefault();
            switchPage('overview');
          }}
        >
          <OverviewIcon />
          <span>總覽</span>
        </a>

        <a
          href="#documents"
          className={
            page === 'documents' ? 'active' : ''
          }
          onClick={(event) => {
            event.preventDefault();
            switchPage('documents');
          }}
        >
          <FileIcon />
          <span>檔案</span>
        </a>

        <a
          href="#packing"
          className={
            page === 'packing' ? 'active' : ''
          }
          onClick={(event) => {
            event.preventDefault();
            switchPage('packing');
          }}
        >
          <BagIcon />
          <span>行李</span>
        </a>
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
   DAY
========================================================= */

function DayDetail({
  day,
  documents,
  onOpenLevel,
}: {
  day: TravelDay;
  documents: TravelDocument[];
  onOpenLevel: () => void;
}) {
  const level = safeLevel(day.level);

  const itineraryDocumentIds = new Set(
    day.itinerary.flatMap((item) => item.documentIds || [])
  );

  const dayDocuments = documents.filter(
    (document) =>
      sameTravelDate(document.date, day.date) &&
      !itineraryDocumentIds.has(document.id)
  );

  return (
    <div className="todayPage">
      <section className="todayHero">
        <p className="dateLabel">
          {formatDate(day.date)} ・{' '}
          {getWeekday(day.date)}
        </p>

        <h1>{day.title}</h1>

        <p className="chapterLabel">
          {day.chapter}
        </p>

        <button
          className="levelButton"
          onClick={onOpenLevel}
        >
          <div>
            <span>建議穿著</span>

            <strong>
              LEVEL {level}｜
              {levelGuides[level].title}
            </strong>
          </div>

          <ArrowIcon />
        </button>

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

      <figure className="destinationHero">
        {day.heroImage ? (
          <>
            <img
              src={day.heroImage}
              alt={`${day.title} 當日精選景色`}
            />

            <figcaption>
              <span>TODAY&apos;S HIGHLIGHT</span>
              <strong>{day.title}</strong>
            </figcaption>
          </>
        ) : (
          <div className="heroPlaceholder">
            <ImageIcon />

            <div>
              <span>TODAY&apos;S HIGHLIGHT</span>
              <strong>當日精選景色</strong>
              <p>
                {formatDate(day.date)} ・{' '}
                {day.title}
              </p>
            </div>
          </div>
        )}
      </figure>

      {dayDocuments.length > 0 && (
        <section className="relatedDocumentsSection">
          <div className="relatedDocumentsHeader">
            <div>
              <p className="eyebrow">RELATED DOCUMENTS</p>
              <h2>當日相關檔案</h2>
            </div>
            <span>{dayDocuments.length} 份</span>
          </div>

          <div className="relatedDocumentTags">
            {dayDocuments.map((document) =>
              document.url ? (
                <a
                  key={document.id}
                  className="relatedDocumentTag"
                  href={document.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileIcon />
                  <span>
                    <small>{document.category}</small>
                    <strong>{document.name}</strong>
                  </span>
                  <ArrowIcon />
                </a>
              ) : (
                <div
                  key={document.id}
                  className="relatedDocumentTag disabled"
                >
                  <FileIcon />
                  <span>
                    <small>{document.category}</small>
                    <strong>{document.name}</strong>
                  </span>
                  <em>尚未上傳</em>
                </div>
              )
            )}
          </div>
        </section>
      )}

      <section className="routeSection">
        <p className="eyebrow">
          DAILY JOURNEY
        </p>

        <h2>當日行程</h2>

        <div className="timeline">
          {day.itinerary.map(
            (item, index) => {
              const linkedDocuments =
                (item.documentIds || [])
                  .map((id) =>
                    documents.find(
                      (document) =>
                        document.id === id
                    )
                  )
                  .filter(
                    (
                      document
                    ): document is TravelDocument =>
                      Boolean(document)
                  );

              return (
                <div
                  className="stop"
                  key={`${item.time}-${item.place}-${index}`}
                >
                  <time>{item.time}</time>

                  <div>
                    <b>{item.place}</b>

                    {item.description && (
                      <p>{item.description}</p>
                    )}

                    <div className="stopActions">
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

                      {linkedDocuments.map(
                        (document) =>
                          document.url ? (
                            <a
                              key={document.id}
                              className="documentTag"
                              href={document.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FileIcon />

                              <span>
                                {document.category}
                                ｜{document.name}
                              </span>
                            </a>
                          ) : (
                            <span
                              key={document.id}
                              className="documentTag disabled"
                            >
                              <FileIcon />

                              <span>
                                {document.category}
                                ｜{document.name}
                              </span>
                            </span>
                          )
                      )}
                    </div>
                  </div>
                </div>
              );
            }
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
}: {
  day: TravelDay;
  onBack: () => void;
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
          返回 {formatDate(day.date)} 行程
        </button>
      </div>

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
            {formatDate(day.date)} ・ {day.title}
          </strong>

          <small>
            白天 {day.dayTemp} ／ 早晚{' '}
            {day.nightTemp}
          </small>
        </div>
      </section>

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

      <section className="layerSection">
        <p className="eyebrow">
          LAYERING SYSTEM
        </p>

        <h2>分層穿搭</h2>

        <div className="layerList">
          <LayerRow
            number="01"
            title="底層 Base Layer"
            text={guide.base}
          />

          <LayerRow
            number="02"
            title="中層 Mid Layer"
            text={guide.mid}
          />

          <LayerRow
            number="03"
            title="外層 Outer Layer"
            text={guide.outer}
          />

          <LayerRow
            number="04"
            title="下身 Bottom"
            text={guide.bottom}
          />

          <LayerRow
            number="05"
            title="鞋款 Shoes"
            text={guide.shoes}
          />
        </div>
      </section>

      <section className="bringSection">
        <p className="eyebrow">
          DON&apos;T FORGET
        </p>

        <h2>記得帶</h2>

        <div className="bringCard">
          <BagIcon />
          <p>{guide.bring}</p>
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

function LayerRow({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <span>{number}</span>

      <div>
        <b>{title}</b>
        <p>{text}</p>
      </div>
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

            <strong>{day.title}</strong>

            <small>{day.chapter}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

/* =========================================================
   DOCUMENTS
========================================================= */

function DocumentsPage({
  documents,
}: {
  documents: TravelDocument[];
}) {
  const categories = [
    '航班',
    '住宿',
    '租車',
    '景點',
    '保險',
    '其他',
  ];

  if (!documents.length) {
    return (
      <section className="contentPage">
        <p className="eyebrow">
          TRAVEL DOCUMENTS
        </p>

        <h2>重要檔案</h2>

        <div className="emptyCard">
          <FileIcon />

          <strong>目前沒有已發布的檔案</strong>

          <p>
            在 Google Sheet 的 Documents
            工作表新增文件並將狀態設為「發布」後，
            會自動出現在這裡。
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="contentPage">
      <p className="eyebrow">
        TRAVEL DOCUMENTS
      </p>

      <h2>重要檔案</h2>

      <div className="documentGroups">
        {categories.map((category) => {
          const group = documents.filter(
            (document) =>
              document.category === category
          );

          if (!group.length) return null;

          return (
            <section
              className="documentGroup"
              key={category}
            >
              <h3>{category}</h3>

              <div className="documentList">
                {group.map((document) => (
                  <article
                    className="documentCard"
                    key={document.id}
                  >
                    <div>
                      <span>
                        {document.date || category}
                      </span>

                      <strong>
                        {document.name}
                      </strong>

                      {document.description && (
                        <p>
                          {document.description}
                        </p>
                      )}
                    </div>

                    {document.url ? (
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        查看檔案
                        <ArrowIcon />
                      </a>
                    ) : (
                      <span className="fileUnavailable">
                        尚未上傳
                      </span>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
   PACKING
========================================================= */

function PackingPage({
  items,
  checkedItems,
  onToggle,
  onReset,
}: {
  items: PackingItem[];
  checkedItems: string[];
  onToggle: (id: string) => void;
  onReset: () => void;
}) {
  const categories = [
    ...new Set(
      items.map((item) => item.category)
    ),
  ];

  const completed = items.filter((item) =>
    checkedItems.includes(item.id)
  ).length;

  return (
    <section className="contentPage">
      <p className="eyebrow">
        PACKING CHECKLIST
      </p>

      <h2>行李清單</h2>

      <div className="packingProgress">
        <span>準備進度</span>

        <strong>
          {completed} / {items.length}
        </strong>
      </div>

      {!!items.length && (
        <button
          type="button"
          className="packingResetButton"
          onClick={onReset}
        >
          重設清單
        </button>
      )}

      {!items.length ? (
        <div className="emptyCard">
          <BagIcon />

          <strong>
            目前沒有已發布的行李項目
          </strong>

          <p>
            直接到 Google Sheet 的 Packing
            工作表新增即可。
          </p>
        </div>
      ) : (
        <div className="packingGroups">
          {categories.map((category) => (
            <section
              className="packingGroup"
              key={category}
            >
              <h3>{category}</h3>

              <div className="checklistPreview">
                {items
                  .filter(
                    (item) =>
                      item.category === category
                  )
                  .map((item) => (
                    <label
                      key={item.id}
                      className={
                        checkedItems.includes(
                          item.id
                        )
                          ? 'checked'
                          : ''
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems.includes(
                          item.id
                        )}
                        onChange={() =>
                          onToggle(item.id)
                        }
                      />

                      <span className="packingItemContent">
                        <strong>
                          {item.name}

                          {item.important && (
                            <small className="importantTag">
                              重要
                            </small>
                          )}
                        </strong>

                        {(item.quantity ||
                          item.description) && (
                          <small>
                            {item.quantity
                              ? `建議 ${item.quantity}`
                              : ''}

                            {item.quantity &&
                            item.description
                              ? ' ・ '
                              : ''}

                            {item.description ||
                              ''}
                          </small>
                        )}
                      </span>
                    </label>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
