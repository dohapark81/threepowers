// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages 프로젝트 페이지 기준. 커스텀 도메인 연결 시(D7)
// site를 도메인으로 바꾸고 base를 제거한다.
export default defineConfig({
  site: 'https://dohapark81.github.io',
  base: '/threepowers',
});
