"use client";

import React from "react";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider from "@refinedev/nextjs-router";

import { dataProvider } from "@providers/data-provider";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { Toaster } from "@/components/refine-ui/notification/toaster";
import { ThemeProvider } from "@/components/refine-ui/theme/theme-provider";
import "@/app/globals.css";

import { authProviderClient } from "@providers/auth-provider/auth-provider.client";

type RefineContextProps = {
  children: React.ReactNode;
};

export const RefineContext = ({ children }: RefineContextProps) => {
  const notificationProvider = useNotificationProvider();

  return (
    <RefineKbarProvider>
      <ThemeProvider>
        <Refine
          dataProvider={dataProvider}
          notificationProvider={notificationProvider}
          authProvider={authProviderClient}
          routerProvider={routerProvider}
          resources={[
            {
              name: "dashboard",
              list: "/dashboard",
              meta: {
                label: "대시보드",
                icon: null,
              },
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          {children}
          <Toaster />
          <RefineKbar />
        </Refine>
      </ThemeProvider>
    </RefineKbarProvider>
  );
};
