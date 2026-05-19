import createMiddleware from 'next-intl/middleware';
import { defineRouting } from 'next-intl/routing';

export default createMiddleware(
  defineRouting({
    locales: ['en', 'es'],
    defaultLocale: 'en',
  })
);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
