import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Only the landing page is rendered ahead of time, at build time, so it arrives as finished HTML
 * for visitors and search engines. Everything else renders in the browser, as before. The build is
 * static files either way (`outputMode: "static"`): no server-side rendering at runtime.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
