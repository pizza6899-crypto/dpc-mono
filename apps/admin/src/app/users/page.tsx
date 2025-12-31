"use client";

import React, { Suspense, useMemo } from "react";
import { Authenticated } from "@refinedev/core";
import { Layout } from "@/components/refine-ui/layout/layout";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { Pencil, Trash } from "lucide-react";
import type { BaseRecord } from "@refinedev/core";

type User = BaseRecord & {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
};

export default function UsersPage() {
  return (
    <Suspense>
      <Authenticated key="users-page">
        <Layout>
          <UsersList />
        </Layout>
      </Authenticated>
    </Suspense>
  );
}

function UsersList() {
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: "ID",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <div className="font-mono text-sm">{value}</div>;
        },
      },
      {
        id: "email",
        accessorKey: "email",
        header: "이메일",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <div>{value}</div>;
        },
      },
      {
        id: "name",
        accessorKey: "name",
        header: "이름",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <div>{value || "-"}</div>;
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "생성일",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return "-";
          return <div>{new Date(value).toLocaleDateString("ko-KR")}</div>;
        },
      },
      {
        id: "actions",
        header: "작업",
        accessorKey: "id",
        enableSorting: false,
        enableColumnFilter: false,
        cell: function render({ getValue }) {
          return (
            <div className="flex items-center gap-2">
              <EditButton recordItemId={getValue() as string}>
                <Pencil className="h-4 w-4" />
              </EditButton>
              <DeleteButton recordItemId={getValue() as string}>
                <Trash className="h-4 w-4" />
              </DeleteButton>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useTable({
    refineCoreProps: {
      resource: "admin/users",
    },
    columns,
  });

  return (
    <ListView>
      <ListViewHeader />
      <div className="flex flex-col gap-4">
        <DataTable table={table} />
      </div>
    </ListView>
  );
}

