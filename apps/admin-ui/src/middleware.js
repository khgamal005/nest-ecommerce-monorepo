"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
const server_1 = require("next/server");
// Restricts the whole app to admin/staff roles only.
// Reads the JWT (cookie or header), checks role claim, redirects to /login if not authorized.
function middleware(request) {
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
    const token = request.cookies.get('admin_token')?.value;
    if (!token && !isAuthRoute) {
        return server_1.NextResponse.redirect(new URL('/login', request.url));
    }
    // TODO: decode JWT, verify role is 'admin' | 'staff', else redirect/deny.
    return server_1.NextResponse.next();
}
exports.config = {
    matcher: ['/((?!_next|api|favicon.ico).*)'],
};
//# sourceMappingURL=middleware.js.map