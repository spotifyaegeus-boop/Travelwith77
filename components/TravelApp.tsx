'use client';

import { useMemo, useState } from 'react';
import type { TravelDay } from '../types/travel';

type IconName = 'today' | 'overview' | 'files' | 'outfit' | 'packing';

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 23,
    height: 23,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (name === 'today') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
        <path d="M8 14h3M8 17h5" />
      </svg>
    );
  }

  if (name === 'overview') {
    return (
      <svg {...common}>
        <path d="M4 5h16M4 12h16M4 19h16" />
        <circle cx="7" cy="5" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="17" cy="19" r="1" />
      </svg>
    );
  }

  if (name === 'files') {
    return (
      <svg {...common}>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" />
      </svg>
    );
  }

  if (name === 'outfit') {
    return (
      <svg {...common}>
        <path d="M9 4 5 6 2.5 10l3 2L7 10.5V21h10V10.5l1.5 1.5 3-2L19 6l-4-2" />
        <path d="M9 4c.5 1.5 1.5 2.2 3 2.2S14.5 5.5 15 4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="5" y="7" width="14" height="13" rx="2" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2M9 11v5M15 11v5" />
    </svg>
  );
}

function Photo({ src, alt }: { src: string; alt: string }) {
  return src ? (
    <img className="photo" src={src} alt={alt} loading="lazy" />
  ) : (
    <div className="placeholder">穿搭照片待補</div>
  );
}

function formatDate(date: string) {
  return date
    .replace('2026/', '')
    .replace('/', ' 月 ') + ' 日';
}

export default function TravelApp({ days }: { days: TravelDay[] }) {
  const chapters = [...new Set(days.map((d) => d.chapter))];

  const [chapter, setChapter] = useState(chapters[0] || '');
  const [selected, setSelected] = useState('');

  const visible = useMemo(
    () => days.filter((d) => d.chapter === chapter),
    [days, chapter]
  );

  const day =
    visible.find((d) => d.date === selected) ||
    visible[0] ||
    days[0];

  return (
    <main>
      <header className="siteHeader">
        <div>
          <strong>CANADA 2026</strong>
          <span>旅行手冊</span>
        </div>
        <p>08.13 — 08.28</p>
      </header>

      <section id="today" className="todayPage">
        {day && (
          <>
            <div className="todayHero">
              <p className="dateLabel">{formatDate(day.date)}</p>

              <h1>{day.title}</h1>

              <p className="chapterLabel">{day.chapter}</p>

              <div className="levelLine">
                <span>今日穿著</span>
                <strong>LEVEL {day.level}</strong>
                <span>
                  {day.level <= 1
                    ? '輕薄'
                    : day.level === 2
                    ? '薄外層'
                    : day.level === 3
                    ? '保暖'
                    : day.level === 4
                    ? '禦寒'
                    : '高山禦寒'}
                </span>
              </div>

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

              <p className="weatherText">{day.weather}</p>
            </div>

            {day.heroImage && (
              <figure className="destinationHero">
                <img
                  src={day.heroImage}
                  alt={`${day.title} 精選旅遊景色`}
                />
                <figcaption>
                  <span>今日精選風景</span>
                  <strong>{day.title}</strong>
                </figcaption>
              </figure>
            )}

            <Day day={day} />
          </>
        )}
      </section>

      <section id="overview" className="contentPage">
        <p className="eyebrow">TRIP OVERVIEW</p>
        <h2>行程總覽</h2>

        <div className="chapterTabs">
          {chapters.map((c) => (
            <button
              key={c}
              className={c === chapter ? 'active' : ''}
              onClick={() => {
                setChapter(c);
                setSelected('');
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="dayList">
          {visible.map((d) => (
            <button
              key={d.date}
              onClick={() => {
                setSelected(d.date);
                document
                  .getElementById('today')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>{formatDate(d.date)}</span>
              <strong>{d.title}</strong>
              <small>{d.dayTemp}</small>
            </button>
          ))}
        </div>
      </section>

      <section id="files" className="contentPage">
        <p className="eyebrow">TRAVEL DOCUMENTS</p>
        <h2>重要檔案</h2>

        <div className="emptyCard">
          <Icon name="files" />
          <strong>旅行文件</strong>
          <p>住宿、航班、租車、景點票券與保險文件將整理在這裡。</p>
        </div>
      </section>

      <section id="outfit" className="contentPage">
        <p className="eyebrow">DAILY WARDROBE</p>
        <h2>每日穿搭</h2>

        {day && (
          <div className="outfitPage">
            <div className="outfitIntro">
              <span>{formatDate(day.date)}</span>
              <h3>{day.title}</h3>
              <p>
                白天 {day.dayTemp} ／ 早晚 {day.nightTemp}
              </p>
            </div>

            <div className="lookgrid">
              <div>
                <Photo
                  src={day.maleImage}
                  alt={`${day.chapter} 男性穿搭`}
                />
                <h3>男生</h3>
                <p>{day.maleOutfit}</p>
              </div>

              <div>
                <Photo
                  src={day.femaleImage}
                  alt={`${day.chapter} 女性穿搭`}
                />
                <h3>女生</h3>
                <p>{day.femaleOutfit}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section id="packing" className="contentPage packingPage">
        <p className="eyebrow">PACKING CHECKLIST</p>
        <h2>行李清單</h2>

        <div className="checklistPreview">
          {[
            '護照',
            '加拿大 eTA',
            '機票與住宿憑證',
            '旅遊保險',
            '常用藥品',
            '充電器與行動電源',
            '保暖外套',
            '防水外層',
          ].map((item) => (
            <label key={item}>
              <input type="checkbox" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </section>

      <nav className="bottomNav" aria-label="主要導覽">
        <a href="#today" className="active">
          <Icon name="today" />
          <span>今日</span>
        </a>

        <a href="#overview">
          <Icon name="overview" />
          <span>總覽</span>
        </a>

        <a href="#files">
          <Icon name="files" />
          <span>檔案</span>
        </a>

        <a href="#outfit">
          <Icon name="outfit" />
          <span>穿搭</span>
        </a>

        <a href="#packing">
          <Icon name="packing" />
          <span>行李</span>
        </a>
      </nav>
    </main>
  );
}

function Day({ day }: { day: TravelDay }) {
  return (
    <article className="day">
      <section className="todayOutfit">
        <p className="eyebrow">TODAY'S OUTFIT</p>
        <h2>今日穿搭</h2>

        <div className="outfitRows">
          <div>
            <b>男生</b>
            <span>{day.maleOutfit}</span>
          </div>

          <div>
            <b>女生</b>
            <span>{day.femaleOutfit}</span>
          </div>

          <div>
            <b>鞋款</b>
            <span>{day.shoes}</span>
          </div>

          <div>
            <b>記得帶</b>
            <span>{day.outerLayer}</span>
          </div>
        </div>

        {day.notice && <p className="notice">{day.notice}</p>}

        <a className="primaryButton" href="#outfit">
          查看完整穿搭
          <span>→</span>
        </a>
      </section>

      <section className="routeSection">
        <p className="eyebrow">TODAY'S JOURNEY</p>
        <h2>今日行程</h2>

        <div className="timeline">
          {day.itinerary.map((x, i) => (
            <div className="stop" key={`${x.time}-${x.place}-${i}`}>
              <time>{x.time}</time>

              <div>
                <b>{x.place}</b>
                <p>{x.description}</p>

                {x.mapUrl && (
                  <a
                    className="mapLink"
                    href={x.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Maps
                    <span>↗</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
