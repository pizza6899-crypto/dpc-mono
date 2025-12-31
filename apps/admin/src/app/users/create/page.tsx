"use client";

import { Suspense } from "react";
import { Authenticated } from "@refinedev/core";
import { Layout } from "@/components/refine-ui/layout/layout";
import { CreateView, CreateViewHeader } from "@/components/refine-ui/views/create-view";
import { UserForm } from "@/components/refine-ui/form/user-form";

export default function CreateUserPage() {
  return (
    <Suspense>
      <Authenticated key="create-user-page">
        <Layout>
          <CreateView>
            <CreateViewHeader />
            <UserForm />
          </CreateView>
        </Layout>
      </Authenticated>
    </Suspense>
  );
}


