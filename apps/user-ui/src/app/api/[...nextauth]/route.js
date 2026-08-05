"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.GET = exports.authOptions = void 0;
const next_auth_1 = __importStar(require("next-auth"));
const google_1 = __importDefault(require("next-auth/providers/google"));
const headers_1 = require("next/headers");
const API_URL = process.env.NEXT_PUBLIC_API_URL;
exports.authOptions = {
    providers: [
        (0, google_1.default)({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                try {
                    const baseUrl = process.env.INTERNAL_API_URL || API_URL;
                    const res = await fetch(`${baseUrl}/api/google-auth`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                        }),
                    });
                    if (!res.ok) {
                        console.error('Failed to authenticate with backend:', await res.text());
                        return false;
                    }
                    const isProd = process.env.NODE_ENV === 'production';
                    const cookieStore = await (0, headers_1.cookies)();
                    const setCookieHeaders = res.headers.getSetCookie?.() || [];
                    for (const header of setCookieHeaders) {
                        const parsed = parseSetCookie(header);
                        if (parsed.name) {
                            cookieStore.set(parsed.name, parsed.value, {
                                httpOnly: true,
                                secure: isProd,
                                sameSite: isProd ? 'none' : 'lax',
                                domain: isProd ? '.mahawed.com' : undefined,
                                path: parsed.path || '/',
                                maxAge: parsed.maxAge ?? undefined,
                            });
                        }
                    }
                    return true;
                }
                catch (error) {
                    console.error('Google auth error:', error);
                    return false;
                }
            }
            return true;
        },
    },
    pages: {
        signIn: '/auth/login',
    },
};
function parseSetCookie(header) {
    const parts = header.split(';').map((p) => p.trim());
    const [nameValue, ...attrs] = parts;
    const eqIdx = nameValue.indexOf('=');
    const name = eqIdx >= 0 ? nameValue.slice(0, eqIdx) : '';
    const value = eqIdx >= 0 ? nameValue.slice(eqIdx + 1) : '';
    let path = '/';
    let maxAge;
    for (const attr of attrs) {
        const lower = attr.toLowerCase();
        if (lower.startsWith('path=')) {
            path = attr.slice(5);
        }
        else if (lower.startsWith('max-age=')) {
            const v = parseInt(attr.slice(8), 10);
            if (!isNaN(v))
                maxAge = v > 0 ? v * 1000 : 0;
        }
    }
    return { name, value, path, maxAge };
}
const handler = (0, next_auth_1.default)(exports.authOptions);
exports.GET = handler;
exports.POST = handler;
//# sourceMappingURL=route.js.map