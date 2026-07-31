'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TravelDay } from '../types/travel';

type Page = 'today' | 'overview' | 'documents' | 'outfits' | 'packing';

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

const packingItems = [
  { id: 'passport', category: '證件', name: '護照', important: true },
  { id: 'eta', category: '證件', name: '加拿大電子旅行授權', important: true },
  { id: 'idp', category: '證件', name: '國際駕駛許可', important: true },
  { id: 'insurance', category: '證件', name: '旅遊保險資料', important: true },

  { id: 'tshirt', category: '衣物', name: '短袖上衣 4–6 件' },
  { id: 'longsleeve', category: '衣物', name: '長袖上衣 2–3 件' },
  { id: 'fleece', category: '衣物', name: '刷毛上衣 1–2 件' },
  { id: 'down', category: '衣物', name: '輕至中量羽絨 1 件', important: true },
  { id: 'shell', category: '衣物', name: '防風防水外套 1 件', important: true },
  { id: 'pants', category: '衣物', name: '城市／戶外長褲' },

  { id: 'sneakers', category: '鞋款', name: '生活休閒鞋' },
  { id: 'trail', category: '鞋款', name: '越野／健行鞋', important: true },

  { id: 'sunglasses', category: '配件', name: '太陽眼鏡' },
  { id: 'beanie', category: '配件', name: '毛帽' },
  { id: 'gloves', category: '配件', name: '薄手套' },
  { id: 'socks', category: '配件', name: '保暖襪' },

  { id: 'powerbank', category: '電子', name: '行動電源', important: true },
  { id: 'offline-map', category: '電子', name: '離線地圖下載', important: true },
];

const documents = [
  {
    category: '航班',
    name: '航班與電子機票',
    description: '國際線與加拿大國內線票券',
  },
  {
    category: '住宿',
    name: '住宿確認文件',
    description: '溫哥華、黃刀鎮、卡加利與坎莫爾住宿',
  },
  {
    category: '租車',
    name: '租車預約文件',
    description: '卡加利機場取還車資訊與保險',
  },
  {
    category: '景點',
    name: '景點與活動票券',
    description: '極光、接駁車、班夫纜車與冰原活動',
  },
  {
    category: '保險',
    name: '旅遊保險',
    description: '保單與緊急聯絡資訊',
  },
];

function normalizeDate(date: string) {
  const parts = date.match(/\d+/g);
  if (!parts || parts.length < 3) return date;

  return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
}

function displayDate(date: string) {
  const parts = date.match(/\d+/g);
  if (!parts || parts.length < 3) return date;
  return `${Number(parts[1])} 月 ${Number(parts[2])} 日`;
}

function shortDate(date: string) {
  const parts = date.match(/\d+/g);
  if (!parts || parts.length < 3) return date;
  return `${Number(parts[1])}/${Number(parts[2])}`;
}

function weekday(date: string) {
  const normalized = normalizeDate(date);
  const d = new Date(`${normalized}T12:00:00`);

  return new Intl.DateTimeFormat('zh-TW', {
    weekday: 'long',
  }).format(d);
}

function getCanadaToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Edmonton',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}

function Photo({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return src ? (
    <img className="photo" src={src} alt={alt} loading="lazy" />
  ) : (
    <div className="photoPlaceholder">
      <span>LOOKBOOK</span>
      <strong>真人穿搭攝影待上傳</strong>
    </div>
  );
}

export default function TravelApp({
  days,
}: {
  days: TravelDay[];
}) {
  const publishedDays = useMemo(
    () => days.filter((day) => day.published !== false),
    [days]
  );

  const [page, setPage] = useState<Page>('today');
  const [selectedDate, setSelectedDate] = useState(
    publishedDays[0]?.date || ''
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const today = getCanadaToday();
    const match = publishedDays.find(
      (day) => normalizeDate(day.date) === today
    );

    if (match) setSelectedDate(match.date);

    try {
      const saved = localStorage.getItem('canada-2026-packing');
      if (saved) setChecked(JSON.parse(saved));
    } catch {}
  }, [publishedDays]);

  const selectedDay =
    publishedDays.find((day) => day.date === selectedDate) ||
    publishedDays[0];

  const chapters = useMemo(
    () => [...new Set(publishedDays.map((day) => day.chapter))],
    [publishedDays]
  );

  function openDay(date: string) {
    setSelectedDate(date);
    setPage('today');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openOutfit(date: string) {
    setSelectedDate(date);
    setPage('outfits');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function togglePacking(id: string) {
    setChecked((current) => {
      const next = {
        ...current,
        [id]: !current[id],
      };

      try {
        localStorage.setItem(
          'canada-2026-packing',
          JSON.stringify(next)
        );
      } catch {}

      return next;
    });
  }

  if (!selectedDay) {
    return <main className="appShell">目前沒有可顯示的行程資料。</main>;
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <button
          className="brand"
          onClick={() => setPage('today')}
          aria-label="回到今日"
        >
          <strong>CANADA 2026</strong>
          <span>旅行手冊</span>
        </button>

        <div className="tripDates">08.13 — 08.28</div>
      </header>

      {page === 'today' && (
        <TodayPage
          day={selectedDay}
          onOutfit={() => openOutfit(selectedDay.date)}
        />
      )}

      {page === 'overview' && (
        <OverviewPage
          days={publishedDays}
          chapters={chapters}
          onOpenDay={openDay}
        />
      )}

      {page === 'documents' && <DocumentsPage />}

      {page === 'outfits' && (
        <OutfitsPage
          days={publishedDays}
          day={selectedDay}
          onSelect={setSelectedDate}
        />
      )}

      {page === 'packing' && (
        <PackingPage
          checked={checked}
          onToggle={togglePacking}
        />
      )}

      <nav className="bottomNav" aria-label="主要導覽">
        <NavButton
          active={page === 'today'}
          label="今日"
          icon="今"
          onClick={() => setPage('today')}
        />

        <NavButton
          active={page === 'overview'}
          label="總覽"
          icon="覽"
          onClick={() => setPage('overview')}
        />

        <NavButton
          active={page === 'documents'}
          label="檔案"
          icon="檔"
          onClick={() => setPage('documents')}
        />

        <NavButton
          active={page === 'outfits'}
          label="穿搭"
          icon="穿"
          onClick={() => setPage('outfits')}
        />

        <NavButton
          active={page === 'packing'}
          label="行李"
          icon="行"
          onClick={() => setPage('packing')}
        />
      </nav>
    </main>
  );
}

function NavButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      className={active ? 'navButton active' : 'navButton'}
      onClick={onClick}
    >
      <span>{icon}</span>
      <strong>{label}</strong>
    </button>
  );
}

function TodayPage({
  day,
  onOutfit,
}: {
  day: TravelDay;
  onOutfit: () => void;
}) {
  return (
    <div className="page">
      <section className="dayHero">
        <p className="eyebrow">
          {displayDate(day.date)} · {weekday(day.date)}
        </p>

        <h1>{day.title}</h1>
        <p className="chapterName">{day.chapter}</p>

        <div className="weatherSummary">
          <div>
            <span>白天氣溫</span>
            <strong>{day.dayTemp}</strong>
          </div>

          <div>
            <span>早晚／環境</span>
            <strong>{day.nightTemp}</strong>
          </div>
        </div>

        <div className="levelSummary">
          <div>
            <span>今日厚度</span>
            <strong>{stars(day.level)}</strong>
          </div>
          <p>{day.weather}</p>
        </div>
      </section>

      <section className="contentSection">
        <div className="sectionHeading">
          <p className="eyebrow">今日穿搭</p>
          <h2>今天怎麼穿？</h2>
        </div>

        <div className="quickOutfit">
          <div>
            <span>男生</span>
            <p>{day.maleOutfit}</p>
          </div>

          <div>
            <span>女生</span>
            <p>{day.femaleOutfit}</p>
          </div>
        </div>

        <div className="carryCard">
          <span>今天一定要帶</span>
          <strong>{day.outerLayer}</strong>
          <p>鞋款：{day.shoes}</p>
        </div>

        <button className="primaryButton" onClick={onOutfit}>
          查看完整穿搭指南
          <span>→</span>
        </button>

        {day.notice && (
          <div className="importantNotice">
            <span>今日提醒</span>
            <p>{day.notice}</p>
          </div>
        )}
      </section>

      <section className="contentSection itinerarySection">
        <div className="sectionHeading">
          <p className="eyebrow">TODAY</p>
          <h2>今日行程</h2>
        </div>

        {day.itinerary.length ? (
          <div className="timeline">
            {day.itinerary.map((item, index) => (
              <article className="stop" key={`${item.place}-${index}`}>
                <time>{item.time || '—'}</time>

                <div className="stopContent">
                  <div className="stopMeta">
                    <span>{item.type}</span>
                    {item.priority && <span>{item.priority}</span>}
                  </div>

                  <h3>{item.place}</h3>
                  <p>{item.description}</p>

                  {item.mapUrl && (
                    <a
                      className="mapButton"
                      href={item.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      在 Google 地圖開啟
                      <span>↗</span>
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyCard">
            今日詳細行程尚未加入。
          </div>
        )}
      </section>
    </div>
  );
}

function OverviewPage({
  days,
  chapters,
  onOpenDay,
}: {
  days: TravelDay[];
  chapters: string[];
  onOpenDay: (date: string) => void;
}) {
  return (
    <div className="page">
      <section className="pageIntro">
        <p className="eyebrow">17 DAYS</p>
        <h1>旅行總覽</h1>
        <p>
          從溫哥華到黃刀鎮，再進入加拿大洛磯山脈。
          點選日期即可查看當天完整行程。
        </p>
      </section>

      {chapters.map((chapter) => {
        const chapterDays = days.filter(
          (day) => day.chapter === chapter
        );

        return (
          <section className="chapterSection" key={chapter}>
            <div className="chapterHeader">
              <span>
                {shortDate(chapterDays[0].date)} —{' '}
                {shortDate(chapterDays[chapterDays.length - 1].date)}
              </span>
              <h2>{chapter}</h2>
            </div>

            <div className="dayList">
              {chapterDays.map((day) => (
                <button
                  className="dayCard"
                  key={day.date}
                  onClick={() => onOpenDay(day.date)}
                >
                  <div className="dayDate">
                    <strong>{shortDate(day.date)}</strong>
                    <span>{weekday(day.date)}</span>
                  </div>

                  <div className="dayCardContent">
                    <h3>{day.title}</h3>
                    <p>
                      {day.dayTemp} · {stars(day.level)}
                    </p>
                  </div>

                  <span className="arrow">→</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function DocumentsPage() {
  const [category, setCategory] = useState('全部');

  const categories = [
    '全部',
    '航班',
    '住宿',
    '租車',
    '景點',
    '保險',
  ];

  const visible =
    category === '全部'
      ? documents
      : documents.filter((doc) => doc.category === category);

  return (
    <div className="page">
      <section className="pageIntro">
        <p className="eyebrow">TRAVEL WALLET</p>
        <h1>重要檔案</h1>
        <p>
          旅行途中需要快速找到的機票、住宿、租車、
          景點與保險文件都集中在這裡。
        </p>
      </section>

      <section className="contentSection">
        <div className="filterTabs">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? 'active' : ''}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="documentList">
          {visible.map((doc) => (
            <article className="documentCard" key={doc.name}>
              <span className="documentCategory">
                {doc.category}
              </span>

              <h3>{doc.name}</h3>
              <p>{doc.description}</p>

              <div className="documentPending">
                等待加入文件連結
              </div>
            </article>
          ))}
        </div>

        <p className="dataHint">
          下一階段會把這裡改成由 Google Sheets 管理，
          加入文件網址後即可直接開啟。
        </p>
      </section>
    </div>
  );
}

function OutfitsPage({
  days,
  day,
  onSelect,
}: {
  days: TravelDay[];
  day: TravelDay;
  onSelect: (date: string) => void;
}) {
  return (
    <div className="page">
      <section className="pageIntro outfitIntro">
        <p className="eyebrow">DAILY WARDROBE</p>
        <h1>每日穿搭</h1>

        <div className="dateScroller">
          {days.map((item) => (
            <button
              key={item.date}
              className={
                item.date === day.date ? 'active' : ''
              }
              onClick={() => onSelect(item.date)}
            >
              <strong>{shortDate(item.date)}</strong>
              <span>{weekday(item.date).replace('星期', '週')}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="outfitHero">
        <div>
          <p className="eyebrow">
            {displayDate(day.date)} · {day.chapter}
          </p>
          <h2>{day.title}</h2>
        </div>

        <div className="outfitTemperature">
          <span>白天</span>
          <strong>{day.dayTemp}</strong>
          <small>早晚 {day.nightTemp}</small>
        </div>
      </section>

      <section className="contentSection">
        <div className="levelBanner">
          <div>
            <span>穿搭厚度</span>
            <strong>LEVEL {day.level}</strong>
          </div>

          <b>{stars(day.level)}</b>
          <p>{day.weather}</p>
        </div>

        <div className="lookGrid">
          <article className="lookCard">
            <Photo
              src={day.maleImage}
              alt={`${day.chapter}男性每日穿搭`}
            />

            <div>
              <span>男生穿搭</span>
              <h3>今日造型</h3>
              <p>{day.maleOutfit}</p>
            </div>
          </article>

          <article className="lookCard">
            <Photo
              src={day.femaleImage}
              alt={`${day.chapter}女性每日穿搭`}
            />

            <div>
              <span>女生穿搭</span>
              <h3>今日造型</h3>
              <p>{day.femaleOutfit}</p>
            </div>
          </article>
        </div>

        <div className="outfitDetails">
          <div>
            <span>鞋款</span>
            <strong>{day.shoes}</strong>
          </div>

          <div>
            <span>要帶的外層</span>
            <strong>{day.outerLayer}</strong>
          </div>
        </div>

        {day.notice && (
          <div className="importantNotice">
            <span>穿搭提醒</span>
            <p>{day.notice}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function PackingPage({
  checked,
  onToggle,
}: {
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const categories = [
    ...new Set(packingItems.map((item) => item.category)),
  ];

  const completed = packingItems.filter(
    (item) => checked[item.id]
  ).length;

  const progress = Math.round(
    (completed / packingItems.length) * 100
  );

  return (
    <div className="page">
      <section className="pageIntro">
        <p className="eyebrow">PACKING LIST</p>
        <h1>行李清單</h1>
        <p>
          重要項目先確認。勾選狀態會保存在這台手機或電腦。
        </p>

        <div className="packingProgress">
          <div>
            <strong>
              {completed} / {packingItems.length}
            </strong>
            <span>已準備</span>
          </div>

          <b>{progress}%</b>

          <div className="progressTrack">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section className="contentSection packingSections">
        {categories.map((category) => (
          <div className="packingGroup" key={category}>
            <h2>{category}</h2>

            {packingItems
              .filter((item) => item.category === category)
              .map((item) => (
                <label
                  className={
                    checked[item.id]
                      ? 'checkItem checked'
                      : 'checkItem'
                  }
                  key={item.id}
                >
                  <input
                    type="checkbox"
                    checked={!!checked[item.id]}
                    onChange={() => onToggle(item.id)}
                  />

                  <span className="customCheck">
                    {checked[item.id] ? '✓' : ''}
                  </span>

                  <strong>{item.name}</strong>

                  {item.important && (
                    <small>重要</small>
                  )}
                </label>
              ))}
          </div>
        ))}
      </section>
    </div>
  );
}
