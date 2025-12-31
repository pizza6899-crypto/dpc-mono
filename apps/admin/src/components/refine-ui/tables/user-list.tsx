"use client";

import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { useTable } from "@refinedev/react-table";
import { useUserTableColumns } from "./user-table-columns";
import { UserListFilters } from "./user-list-filters";

export function UserList() {
  const columns = useUserTableColumns();

  const table = useTable({
    refineCoreProps: {
      resource: "admin/users",
      filters: {
        initial: [],
      },
    },
    columns,
  });

  return (
    <ListView>
      <ListViewHeader />
      <div className="flex flex-col gap-4">
        <UserListFilters table={table} />
        <DataTable table={table} />
      </div>
    </ListView>
  );
}

