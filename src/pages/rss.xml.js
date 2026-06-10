import rss from '@astrojs/rss';
import events from '../../data/events.json';

export function GET(context) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return rss({
    title: '삼권 threepowers · 6·3 사태 기록',
    description:
      '6·3 지방선거 투표용지 부족 사태에 대한 공식 기록 타임라인. 결론을 내리지 않습니다.',
    site: context.site,
    trailingSlash: false,
    items: [...events]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((e) => ({
        title: e.title,
        description: e.body_oneline,
        pubDate: new Date(`${e.date}T00:00:00+09:00`),
        link: `${base}/timeline/#${e.id}`,
      })),
  });
}
