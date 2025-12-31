"use client";

import { Suspense } from "react";
import { Authenticated } from "@refinedev/core";
import { Layout } from "@/components/refine-ui/layout/layout";
import { ShowView, ShowViewHeader } from "@/components/refine-ui/views/show-view";
import { UserShow } from "@/components/refine-ui/show/user-show";

export default function ShowUserPage() {
  return (
    <Suspense>
      <Authenticated key="show-user-page">
        <Layout>
          <ShowView>
            <ShowViewHeader />
            <UserShow />
          </ShowView>
        </Layout>
      </Authenticated>
    </Suspense>
  );
}

