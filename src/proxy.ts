import { NextResponse, type NextRequest } from 'next/server';

// Mutating browser requests must originate from the current CRM host.
export function proxy(request: NextRequest) {
  if (!['POST','PATCH','PUT','DELETE'].includes(request.method.toUpperCase())) return NextResponse.next();
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({error: 'Invalid request origin'}, {status: 403});
  }
  if (origin) {
    try {
      if (new URL(origin).origin !== request.nextUrl.origin) {
        return NextResponse.json({error: 'Invalid request origin'}, {status: 403});
      }
    } catch {
      return NextResponse.json({error: 'Invalid origin header'}, {status: 403});
    }
  }
  return NextResponse.next();
}
export const config = {matcher: ['/api/:path*']};
