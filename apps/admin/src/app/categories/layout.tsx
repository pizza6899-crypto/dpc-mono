"use client";

import { Header } from "@components/header";
import { ThemedLayout } from "@refinedev/antd";
import { Authenticated } from "@refinedev/core";
import React from "react";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <Authenticated key="categories-layout" fallback={null}>
      <ThemedLayout Header={Header}>{children}</ThemedLayout>
    </Authenticated>
  );
}
