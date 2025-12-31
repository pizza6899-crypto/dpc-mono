"use client";

import { Suspense } from "react";
import { Authenticated } from "@refinedev/core";
import { Layout } from "@/components/refine-ui/layout/layout";
import { DashboardContent } from "@/components/refine-ui/views/dashboard-content";

export default function DashboardPage() {
  return (
    <Suspense>
      <Authenticated key="dashboard-page">
        <Layout>
          <DashboardContent />
        </Layout>
      </Authenticated>
    </Suspense>
  );
}

