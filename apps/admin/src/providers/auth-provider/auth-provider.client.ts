"use client";

import type { AuthProvider } from "@refinedev/core";
import {
  credentialAdminControllerLogin,
  credentialAdminControllerLogout,
  credentialAdminControllerCheckStatus,
} from "@/api/generated/endpoints/admin-auth-관리자-인증/admin-auth-관리자-인증";

export const authProviderClient: AuthProvider = {
  login: async ({ email, username, password }) => {
    try {
      const response = await credentialAdminControllerLogin({
        email: email || username || "",
        password: password || "",
      });

      if (response.success && response.data?.user) {
        return {
          success: true,
          redirectTo: "/dashboard",
        };
      }

      return {
        success: false,
        error: {
          name: "LoginError",
          message: "Invalid email or password",
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "Login failed";

      return {
        success: false,
        error: {
          name: "LoginError",
          message: errorMessage,
        },
      };
    }
  },
  logout: async () => {
    try {
      await credentialAdminControllerLogout();
      return {
        success: true,
        redirectTo: "/login",
      };
    } catch {
      // 로그아웃은 항상 성공으로 처리
      return {
        success: true,
        redirectTo: "/login",
      };
    }
  },
  check: async () => {
    try {
      const response = await credentialAdminControllerCheckStatus();

      if (response.success && response.data?.isAuthenticated) {
        return {
          authenticated: true,
        };
      }

      return {
        authenticated: false,
        logout: true,
        redirectTo: "/login",
      };
    } catch {
      return {
        authenticated: false,
        logout: true,
        redirectTo: "/login",
      };
    }
  },
  getPermissions: async () => {
    try {
      const response = await credentialAdminControllerCheckStatus();
      if (response.success && response.data?.user) {
        // 관리자는 항상 admin 권한을 가진다고 가정
        // 실제로는 백엔드에서 권한 정보를 제공해야 함
        return ["admin"];
      }
      return null;
    } catch {
      return null;
    }
  },
  getIdentity: async () => {
    try {
      const response = await credentialAdminControllerCheckStatus();
      if (response.success && response.data?.user) {
        return {
          uid: response.data.user.uid,
          email: response.data.user.email,
        };
      }
      return null;
    } catch {
      return null;
    }
  },
  onError: async (error) => {
    if (error?.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
};
