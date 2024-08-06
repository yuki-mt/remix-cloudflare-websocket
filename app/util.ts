import { createCookieSessionStorage } from '@remix-run/cloudflare';

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: ['foo'],
    secure: false,
    maxAge: 60 * 60 * 24 * 90, //有効期限：3ヶ月(90日間)
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;