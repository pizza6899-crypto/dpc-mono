"use client";

import type { AuthProvider } from "@refinedev/core";
import Cookies from "js-cookie";
import {
  credentialAdminControllerLogin,
  credentialAdminControllerLogout,
  credentialAdminControllerCheckStatus,
} from "@api/generated/admin-auth-관리자-인증/admin-auth-관리자-인증";

export const authProviderClient: AuthProvider = {
  login: async ({ email, username, password, remember }) => {
    try {
      // email 또는 username 중 하나를 사용 (email 우선)
      const loginEmail = email || username;
      
      if (!loginEmail || !password) {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: "Email and password are required",
          },
        };
      }

      const response = await credentialAdminControllerLogin({
        email: loginEmail,
        password,
      });

      // 로그인 성공 시 서버가 쿠키에 세션을 저장하므로
      // 사용자 정보만 클라이언트 쿠키에 저장 (getIdentity에서 사용)
      if (response.data?.user) {
        Cookies.set("auth", JSON.stringify(response.data.user), {
          expires: remember ? 30 : 1, // remember가 true면 30일, 아니면 1일
          path: "/",
        });
      }

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message:
            error?.response?.data?.message ||
            error?.message ||
            "Invalid email or password",
        },
      };
    }
  },
  logout: async () => {
    try {
      // 서버 세션 종료
      await credentialAdminControllerLogout();
    } catch (error) {
      // 에러가 발생해도 로그아웃은 진행
      console.error("Logout error:", error);
    } finally {
      // 클라이언트 쿠키 제거
      Cookies.remove("auth", { path: "/" });
    }

    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    try {
      const response = await credentialAdminControllerCheckStatus();

      console.log(response);
      if (response.data?.isAuthenticated && response.data.user) {
        console.log("check success");
        // 인증 성공 - 사용자 정보를 클라이언트 쿠키에 저장 (getIdentity에서 사용)
        Cookies.set("auth", JSON.stringify(response.data.user), {
          expires: 30,
          path: "/",
        });

        return {
          authenticated: true,
        };
      }

      // 인증 실패 - 직접 리다이렉트
      console.log("check failed");
      Cookies.remove("auth", { path: "/" });
      
      // 클라이언트 사이드에서 직접 리다이렉트
      // 단, 이미 로그인/회원가입/비밀번호 찾기 페이지에 있으면 리다이렉트하지 않음
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const publicPaths = ["/login", "/register", "/forgot-password"];
        
        if (!publicPaths.includes(currentPath)) {
          window.location.href = "/login";
        }
      }
      
      return {
        authenticated: false,
        logout: true,
        redirectTo: "/login",
      };
    } catch (error) {
      // API 에러 시 인증 실패로 처리
      console.log("check error:", error);
      Cookies.remove("auth", { path: "/" });
      
      // 클라이언트 사이드에서 직접 리다이렉트
      // 단, 이미 로그인/회원가입/비밀번호 찾기 페이지에 있으면 리다이렉트하지 않음
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const publicPaths = ["/login", "/register", "/forgot-password"];
        
        if (!publicPaths.includes(currentPath)) {
          window.location.href = "/login";
        }
      }
      
      return {
        authenticated: false,
        logout: true,
        redirectTo: "/login",
      };
    }
  },
  getPermissions: async () => {
    // 현재 API 응답에 roles 정보가 없으므로 null 반환
    // 필요시 API 응답에 roles가 추가되면 여기서 반환
    const auth = Cookies.get("auth");
    if (auth) {
      try {
        const parsedUser = JSON.parse(auth);
        // API 응답에 roles가 추가되면 아래 주석 해제
        // return parsedUser.roles;
      } catch {
        // JSON 파싱 실패
      }
    }
    return null;
  },
  getIdentity: async () => {
    const auth = Cookies.get("auth");
    if (auth) {
      try {
        return JSON.parse(auth);
      } catch {
        return null;
      }
    }
    return null;
  },
  onError: async (error) => {
    if (error?.response?.status === 401) {
      // 401 에러 시 자동 로그아웃
      Cookies.remove("auth", { path: "/" });
      return {
        logout: true,
        redirectTo: "/login",
      };
    }

    return { error };
  },
};
