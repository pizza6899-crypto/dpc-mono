"use client";

import React, { Suspense } from "react";
import { Authenticated } from "@refinedev/core";
import { Layout } from "@/components/refine-ui/layout/layout";
import { UserList } from "@/components/refine-ui/tables/user-list";

export default function UsersPage() {
  return (
    <Suspense>
      <Authenticated key="users-page">
        <Layout>
          <UserList />
        </Layout>
      </Authenticated>
    </Suspense>
  );
}

