'use client';

import { useMemo, useState } from 'react';
import type { TravelDay } from '../types/travel';

type PageName =
  | 'today'
  | 'overview'
  | 'documents'
  | 'outfit'
  | 'packing';

type OverviewView = 'list' | 'detail';

/* =========================================================
   ICONS
========================================================= */

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3v4M16 3v4M3 10h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 14h2M14 14h2M8 18h2M14 18h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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
      <path
        d="M6 3h8l4 4v14H6V3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5M9 13h6M9 17h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OutfitIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 5 5 7l-2 4 3 2 1-2v10h10V11l1 2 3-2-2-4-3-2c-.6 1.5-2 2.5-4 2.5S8.6 6.5 8 5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="7"
        width="14"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 7V5a3 3 0 0 1 6 0v2M9 11v6M15 11v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="9"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M14 7l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 12H5M10 7l-5 5 5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   HELPERS
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

/*
  旅程日期：
  08/13–08/15 Vancouver
  08/16–08/18 Yellowknife
  08/19–08/27 Alberta
  08/27–08/28 Vancouver

  Vancouver = America/Vancouver
  Yellowknife / Alberta = America/Edmonton

  這個函式先取得兩個加拿大時區各自的「今天」，
  再依旅行日期決定使用哪一個。
*/

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

function getTripTodayDate() {
  const vancouverDate = getDateInTimeZone('America/Vancouver');
  const mountainDate = getDateInTimeZone('America/Edmonton');

  const vancouverNumber = dateToNumber(vancouverDate);
  const mountainNumber = dateToNumber(mountainDate);

  const tripStart = 20260813;
  const yellowknifeStart = 20260816;
  const albertaEnd = 20260826;
  const vancouverReturn = 20260827;
  const tripEnd = 20260828;

  /*
    旅行開始前：
    固定回傳 08/13。
  */
  if (
    vancouverNumber < tripStart &&
    mountainNumber < tripStart
  ) {
    return '2026/08/13';
  }

  /*
    旅行結束後：
    固定停在 08/28。
  */
  if (
    vancouverNumber > tripEnd &&
    mountainNumber > tripEnd
  ) {
    return '2026/08/28';
  }

  /*
    08/13–08/15 Vancouver
  */
  if (
    vancouverNumber >= tripStart &&
    vancouverNumber < yellowknifeStart
  ) {
    return vancouverDate;
  }

  /*
    08/16–08/26 Yellowknife / Alberta
    兩地皆採 America/Edmonton。
  */
  if (
    mountainNumber >= yellowknifeStart &&
    mountainNumber <= albertaEnd
  ) {
    return mountainDate;
  }

  /*
    08/27–08/28 回 Vancouver。
  */
  if (
    vancouverNumber >= vancouverReturn &&
    vancouverNumber <= tripEnd
  ) {
    return vancouverDate;
  }

  /*
    午夜附近兩個時區日期不同時的 fallback。
  */
  if (
    mountainNumber >= yellowknifeStart &&
    mountainNumber < vancouverReturn
  ) {
    return mountainDate;
  }

  return vancouverDate;
}

function levelName(level: number) {
  switch (level) {
    case 1:
      return '輕薄';
    case 2:
      return '薄外層';
    case 3:
      return '保暖＋防風';
    case 4:
      return '羽絨分層';
    case 5:
      return '高山保暖';
    default:
      return '依天氣調整';
  }
}

function Photo({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="placeholder">
        穿搭示意圖待上傳
      </div>
    );
  }

  return (
    <img
      className="photo"
      src={src}
      alt={alt}
      loading="lazy"
    />
  );
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
    () =>
      days.filter(
        (day) => day.published !== false
      ),
    [days]
  );

  const chapters = useMemo(
    () => [
      ...new Set(
        publishedDays.map((day) => day.chapter)
      ),
    ],
    [publishedDays]
  );

  /*
    page = 底部五個主頁籤
  */
  const [page, setPage] =
    useState<PageName>('today');

  /*
    overviewView =
    總覽列表 / 總覽內的某日詳情
  */
  const [overviewView, setOverviewView] =
    useState<OverviewView>('list');

  /*
    只屬於總覽。
    不會影響「今日」。
  */
  const [overviewDate, setOverviewDate] =
    useState('');

  /*
    只屬於穿搭頁。
    不會影響「今日」。
  */
  const [outfitDate, setOutfitDate] =
    useState('');

  const [
    overviewChapter,
    setOverviewChapter,
  ] = useState('全部');

  const [
    checkedItems,
    setCheckedItems,
  ] = useState<string[]>([]);

  /*
    真正的「今日」日期。

    8/13 前 → 8/13
    8/13–8/28 → 自動更新
    8/28 後 → 8/28
  */
  const todayDate = getTripTodayDate();

  const todayDay =
    publishedDays.find(
      (day) =>
        normalizeDate(day.date) ===
        normalizeDate(todayDate)
    ) || publishedDays[0];

  /*
    總覽目前正在看的某一天。
  */
  const overviewDay =
    publishedDays.find(
      (day) => day.date === overviewDate
    ) || publishedDays[0];

  /*
    穿搭目前正在看的某一天。
    第一次進穿搭，預設跟「今日」一致。
  */
  const outfitDay =
    publishedDays.find(
      (day) => day.date === outfitDate
    ) || todayDay;

  const overviewDays = useMemo(() => {
    if (overviewChapter === '全部') {
      return publishedDays;
    }

    return publishedDays.filter(
      (day) =>
        day.chapter === overviewChapter
    );
  }, [
    publishedDays,
    overviewChapter,
  ]);

  function goTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function switchPage(
    nextPage: PageName
  ) {
    setPage(nextPage);

    /*
      每次重新按「總覽」，
      回總覽首頁，而不是卡在之前看的詳情。
    */
    if (nextPage === 'overview') {
      setOverviewView('list');
    }

    goTop();
  }

  function openOverviewDay(
    date: string
  ) {
    setOverviewDate(date);
    setOverviewView('detail');

    /*
      注意：
      這裡沒有 setPage('today')。

      所以底部仍然是「總覽」active。
    */

    goTop();
  }

  function backToOverview() {
    setOverviewView('list');
    goTop();
  }

  function openTodayOutfit() {
    if (todayDay) {
      setOutfitDate(todayDay.date);
    }

    setPage('outfit');
    goTop();
  }

  function openOverviewOutfit(
    date: string
  ) {
    setOutfitDate(date);
    setPage('outfit');
    goTop();
  }

  function togglePacking(
    item: string
  ) {
    setCheckedItems((current) =>
      current.includes(item)
        ? current.filter(
            (x) => x !== item
          )
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
      id: 'outfit' as PageName,
      label: '穿搭',
      icon: <OutfitIcon />,
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
          <p className="eyebrow">
            CANADA 2026
          </p>

          <h2>
            目前沒有可顯示的行程
          </h2>

          <p>
            請確認 Google Sheets
            中至少有一天設為發布。
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
        todayDay && (
          <DayDetail
            day={todayDay}
            mode="today"
            onOpenOutfit={
              openTodayOutfit
            }
          />
        )}

      {/* OVERVIEW */}

      {page === 'overview' &&
        overviewView === 'list' && (
          <OverviewPage
            days={overviewDays}
            chapters={chapters}
            activeChapter={
              overviewChapter
            }
            onChapterChange={
              setOverviewChapter
            }
            onOpenDay={
              openOverviewDay
            }
          />
        )}

      {page === 'overview' &&
        overviewView === 'detail' &&
        overviewDay && (
          <div>
            <div
              style={{
                padding:
                  '24px clamp(24px, 5vw, 60px) 0',
              }}
            >
              <button
                className="backButton"
                onClick={
                  backToOverview
                }
              >
                <BackIcon />
                返回行程總覽
              </button>
            </div>

            <DayDetail
              day={overviewDay}
              mode="overview"
              onOpenOutfit={() =>
                openOverviewOutfit(
                  overviewDay.date
                )
              }
            />
          </div>
        )}

      {/* DOCUMENTS */}

      {page === 'documents' && (
        <DocumentsPage />
      )}

      {/* OUTFIT */}

      {page === 'outfit' &&
        outfitDay && (
          <OutfitPage
            day={outfitDay}
            days={publishedDays}
            onSelectDate={
              setOutfitDate
            }
          />
        )}

      {/* PACKING */}

      {page === 'packing' && (
        <PackingPage
          checkedItems={
            checkedItems
          }
          onToggle={
            togglePacking
          }
        />
      )}

      {/* BOTTOM NAV */}

      <nav
        className="bottomNav"
        aria-label="主要導覽"
      >
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={
              page === item.id
                ? 'active'
                : ''
            }
            onClick={(event) => {
              event.preventDefault();
              switchPage(item.id);
            }}
          >
            {item.icon}
            <span>
              {item.label}
            </span>
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
        <strong>
          CANADA 2026
        </strong>

        <span>
          旅行手冊
        </span>
      </div>

      <p>
        08.13 — 08.28
      </p>
    </header>
  );
}

/* =========================================================
   SHARED DAY DETAIL

   今日與總覽詳情共用同一份版型，
   但它們是不同導航情境。
========================================================= */

function DayDetail({
  day,
  mode,
  onOpenOutfit,
}: {
  day: TravelDay;
  mode: 'today' | 'overview';
  onOpenOutfit: () => void;
}) {
  return (
    <div className="todayPage">

      {/* HERO */}

      <section className="todayHero">
        <p className="dateLabel">
          {formatDate(day.date)}
          {' ・ '}
          {getWeekday(day.date)}
        </p>

        <h1>
          {day.title}
        </h1>

        <p className="chapterLabel">
          {day.chapter}
        </p>

        <div className="levelLine">
          <span>
            建議穿著
          </span>

          <strong>
            LEVEL {day.level}
            {'｜'}
            {levelName(day.level)}
          </strong>
        </div>

        <div className="weatherGrid">
          <div>
            <span>
              白天
            </span>

            <strong>
              {day.dayTemp}
            </strong>
          </div>

          <div>
            <span>
              早晚
            </span>

            <strong>
              {day.nightTemp}
            </strong>
          </div>
        </div>

        <p className="weatherText">
          {day.weather}
        </p>
      </section>

      {/* DESTINATION IMAGE */}

      {day.heroImage && (
        <figure className="destinationHero">
          <img
            src={day.heroImage}
            alt={`${day.title} 精選旅遊景色`}
          />

          <figcaption>
            <span>
              {mode === 'today'
                ? "TODAY'S DESTINATION"
                : 'DESTINATION'}
            </span>

            <strong>
              {day.title}
            </strong>
          </figcaption>
        </figure>
      )}

      {/* OUTFIT SUMMARY */}

      <section className="todayOutfit">
        <p className="eyebrow">
          DAILY WARDROBE
        </p>

        <h2>
          當日穿搭
        </h2>

        <div className="outfitRows">
          <div>
            <b>
              男生
            </b>

            <span>
              {day.maleOutfit}
            </span>
          </div>

          <div>
            <b>
              女生
            </b>

            <span>
              {day.femaleOutfit}
            </span>
          </div>

          <div>
            <b>
              鞋款
            </b>

            <span>
              {day.shoes}
            </span>
          </div>

          <div>
            <b>
              記得帶
            </b>

            <span>
              {day.outerLayer}
            </span>
          </div>
        </div>

        {day.notice && (
          <p className="notice">
            {day.notice}
          </p>
        )}

        <a
          href="#outfit"
          className="primaryButton"
          onClick={(event) => {
            event.preventDefault();
            onOpenOutfit();
          }}
        >
          <span>
            查看完整穿搭
          </span>

          <ArrowIcon />
        </a>
      </section>

      {/* ITINERARY */}

      <section className="routeSection">
        <p className="eyebrow">
          DAILY JOURNEY
        </p>

        <h2>
          當日行程
        </h2>

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
                  <b>
                    {item.place}
                  </b>

                  {item.description && (
                    <p>
                      {
                        item.description
                      }
                    </p>
                  )}

                  {item.mapUrl && (
                    <a
                      className="mapLink"
                      href={
                        item.mapUrl
                      }
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
   OVERVIEW LIST
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
  onChapterChange: (
    chapter: string
  ) => void;
  onOpenDay: (
    date: string
  ) => void;
}) {
  return (
    <section className="contentPage">
      <p className="eyebrow">
        TRIP OVERVIEW
      </p>

      <h2>
        行程總覽
      </h2>

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

        {chapters.map(
          (chapter) => (
            <button
              key={chapter}
              className={
                activeChapter ===
                chapter
                  ? 'active'
                  : ''
              }
              onClick={() =>
                onChapterChange(
                  chapter
                )
              }
            >
              {chapter}
            </button>
          )
        )}
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

      <h2>
        重要檔案
      </h2>

      <div className="emptyCard">
        <FileIcon />

        <strong>
          旅行文件
        </strong>

        <p>
          航班、住宿、租車、景點、
          保險等重要憑證與下載連結，
          之後會統一整理在這裡。
        </p>
      </div>
    </section>
  );
}

/* =========================================================
   OUTFIT
========================================================= */

function OutfitPage({
  day,
  days,
  onSelectDate,
}: {
  day: TravelDay;
  days: TravelDay[];
  onSelectDate: (
    date: string
  ) => void;
}) {
  return (
    <section className="contentPage">
      <p className="eyebrow">
        WARDROBE GUIDE
      </p>

      <h2>
        穿搭指南
      </h2>

      <div className="chapterTabs">
        {days.map((item) => (
          <button
            key={item.date}
            className={
              item.date === day.date
                ? 'active'
                : ''
            }
            onClick={() => {
              onSelectDate(
                item.date
              );

              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              });
            }}
          >
            {formatDate(
              item.date
            )}
          </button>
        ))}
      </div>

      <div className="outfitIntro">
        <span>
          {formatDate(day.date)}
          {' ・ '}
          {getWeekday(day.date)}
        </span>

        <h3>
          {day.title}
        </h3>

        <p>
          白天 {day.dayTemp}
          {' ／ '}
          早晚 {day.nightTemp}
          {' ／ '}
          LEVEL {day.level}
        </p>
      </div>

      <div className="lookgrid">
        <div>
          <Photo
            src={day.maleImage}
            alt={`${day.title} 男生穿搭`}
          />

          <h3>
            男生
          </h3>

          <p>
            {day.maleOutfit}
          </p>
        </div>

        <div>
          <Photo
            src={day.femaleImage}
            alt={`${day.title} 女生穿搭`}
          />

          <h3>
            女生
          </h3>

          <p>
            {day.femaleOutfit}
          </p>
        </div>
      </div>

      <div
        className="outfitRows"
        style={{
          marginTop: 36,
        }}
      >
        <div>
          <b>
            天氣
          </b>

          <span>
            {day.weather}
          </span>
        </div>

        <div>
          <b>
            鞋款
          </b>

          <span>
            {day.shoes}
          </span>
        </div>

        <div>
          <b>
            外層
          </b>

          <span>
            {day.outerLayer}
          </span>
        </div>
      </div>

      {day.notice && (
        <p className="notice">
          {day.notice}
        </p>
      )}
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
  onToggle: (
    item: string
  ) => void;
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

      <h2>
        行李清單
      </h2>

      <p
        style={{
          marginBottom: 28,
          color: '#687168',
          fontWeight: 600,
        }}
      >
        已完成 {completed} / {total}
      </p>

      <div className="checklistPreview">
        {packingItems.map(
          (item) => (
            <label key={item}>
              <input
                type="checkbox"
                checked={checkedItems.includes(
                  item
                )}
                onChange={() =>
                  onToggle(item)
                }
              />

              <span>
                {item}
              </span>
            </label>
          )
        )}
      </div>
    </section>
  );
}
