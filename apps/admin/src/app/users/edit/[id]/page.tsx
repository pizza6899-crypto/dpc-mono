"use client";

import { Suspense } from "react";
import { Authenticated } from "@refinedev/core";
import { Layout } from "@/components/refine-ui/layout/layout";
import { EditView, EditViewHeader } from "@/components/refine-ui/views/edit-view";
import { UserForm } from "@/components/refine-ui/form/user-form";

export default function EditUserPage() {
  return (
    <Suspense>
      <Authenticated key="edit-user-page">
        <Layout>
          <EditView>
            <EditViewHeader />
            <UserForm />
          </EditView>
        </Layout>
      </Authenticated>
    </Suspense>
  );
}


