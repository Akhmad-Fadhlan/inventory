import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/assets/:path*',
    '/borrowings/:path*',
    '/maintenance/:path*',
    '/inspections/:path*',
    '/transfers/:path*',
    '/reports/:path*',
  ],
};
