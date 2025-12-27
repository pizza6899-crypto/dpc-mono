import type { Response } from 'express';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

export class CookieUtil {
  /**
   * 리프레시 토큰 쿠키 설정
   */
  static setRefreshToken(
    res: Response,
    token: string,
    isProduction: boolean = false,
  ): void {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      path: '/',
    });
  }

  /**
   * 리프레시 토큰 쿠키만 제거
   */
  static clearRefreshToken(res: Response): void {
    res.clearCookie('refresh_token', { path: '/' });
  }

  /**
   * 커스텀 쿠키 설정
   */
  static setCookie(
    res: Response,
    name: string,
    value: string,
    options: CookieOptions = {},
  ): void {
    const defaultOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      ...options,
    };

    res.cookie(name, value, defaultOptions);
  }

  /**
   * 커스텀 쿠키 제거
   */
  static clearCookie(res: Response, name: string, path: string = '/'): void {
    res.clearCookie(name, { path });
  }
}
