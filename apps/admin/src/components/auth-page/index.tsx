"use client";
import { AuthPage as AuthPageBase } from "@refinedev/antd";
import type { AuthPageProps } from "@refinedev/core";

export const AuthPage = (props: AuthPageProps) => {
  // type이 login일 때만 forgotPasswordLink와 registerLink 사용 가능
  const loginProps =
    props.type === "login"
      ? {
          forgotPasswordLink: false,
          registerLink: false,
        }
      : {};

  return (
    <AuthPageBase
      {...props}
      formProps={{
        initialValues: { email: "admin@dpc.com", password: "demadmin123!" },
      }}
      {...loginProps}
    />
  );
};
