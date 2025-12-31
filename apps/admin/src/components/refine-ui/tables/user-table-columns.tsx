"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { Pencil, Trash } from "lucide-react";
import { CopyableCell } from "./copyable-cell";
import type { User } from "@/types/user.types";

export function useUserTableColumns(): ColumnDef<User>[] {
  const t = useTranslations("table.user");

  return useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: t("id"),
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <CopyableCell
              value={value}
              className="font-mono text-sm"
            />
          );
        },
      },
      {
        id: "uid",
        accessorKey: "uid",
        header: t("uid"),
        size: 150,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <CopyableCell
              value={value}
              className="font-mono text-sm"
            />
          );
        },
      },
      {
        id: "email",
        accessorKey: "email",
        header: t("email"),
        size: 200,
        cell: ({ getValue }) => {
          const value = getValue() as string | null;
          return <CopyableCell value={value} />;
        },
      },
      {
        id: "role",
        accessorKey: "role",
        header: t("role"),
        size: 100,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <CopyableCell value={value} />;
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: t("status"),
        size: 100,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <CopyableCell value={value} />;
        },
      },
      {
        id: "country",
        accessorKey: "country",
        header: t("country"),
        size: 100,
        cell: ({ getValue }) => {
          const value = getValue() as string | null;
          return <CopyableCell value={value} />;
        },
      },
      {
        id: "timezone",
        accessorKey: "timezone",
        header: t("timezone"),
        size: 150,
        cell: ({ getValue }) => {
          const value = getValue() as string | null;
          return <CopyableCell value={value} />;
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: t("createdAt"),
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return "-";
          const formattedDate = new Date(value).toLocaleDateString("ko-KR");
          return (
            <CopyableCell
              value={value}
              displayValue={formattedDate}
            />
          );
        },
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        header: t("updatedAt"),
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return "-";
          const formattedDate = new Date(value).toLocaleDateString("ko-KR");
          return (
            <CopyableCell
              value={value}
              displayValue={formattedDate}
            />
          );
        },
      },
      {
        id: "actions",
        header: t("actions"),
        accessorKey: "id",
        size: 100,
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
    [t]
  );
}

