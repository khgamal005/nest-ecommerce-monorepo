"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
const server_1 = require("next/server");
// Storefront middleware: locale detection, cart cookie checks, etc.
function middleware(request) {
    return server_1.NextResponse.next();
}
exports.config = {
    matcher: ['/((?!_next|api|favicon.ico).*)'],
};
//# sourceMappingURL=middleware.js.map