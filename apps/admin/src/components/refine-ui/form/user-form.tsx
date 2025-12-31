"use client";

import React, { useMemo } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { useResourceParams } from "@refinedev/core";
import { Pencil, Trash } from "lucide-react";
import type { BaseRecord } from "@refinedev/core";

const userSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  name: z.string().optional(),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다").optional().or(z.literal("")),
  role: z.string().optional(),
  status: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

type User = BaseRecord & {
  id: string;
  uid?: string;
  email: string | null;
  name?: string;
  role?: string;
  status?: string;
  country?: string | null;
  language?: string;
  timezone?: string | null;
  kycLevel?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function UserForm() {
  const t = useTranslations("common");
  const { id } = useResourceParams();
  const isEditMode = !!id;
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as any,
    refineCoreProps: {
      resource: "admin/users",
    },
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: "",
      status: "",
      country: "",
      language: "",
      timezone: "",
    },
  });

  const {
    refineCore: { onFinish, formLoading },
    handleSubmit,
    control,
  } = form;

  // Edit mode일 때 데이터를 가져오기 위해 useOne 사용
  const defaultValues = {
    email: "",
    name: "",
    password: "",
    role: "",
    status: "",
    country: "",
    language: "",
    timezone: "",
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: "ID",
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <div className="font-mono text-xs truncate">{value}</div>;
        },
      },
      {
        id: "uid",
        accessorKey: "uid",
        header: "UID",
        size: 120,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <div className="font-mono text-xs truncate">{value || "-"}</div>;
        },
      },
      {
        id: "email",
        accessorKey: "email",
        header: "이메일",
        size: 180,
        cell: ({ getValue }) => {
          const value = getValue() as string | null;
          return <div className="text-xs truncate">{value || "-"}</div>;
        },
      },
      {
        id: "name",
        accessorKey: "name",
        header: "이름",
        size: 100,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <div className="text-xs">{value || "-"}</div>;
        },
      },
      {
        id: "role",
        accessorKey: "role",
        header: "역할",
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <div className="text-xs">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {value || "-"}
              </span>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: "상태",
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const statusColors: Record<string, string> = {
            ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
            SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          };
          return (
            <div className="text-xs">
              <span className={`px-1.5 py-0.5 rounded ${statusColors[value] || "bg-gray-100 text-gray-800"}`}>
                {value || "-"}
              </span>
            </div>
          );
        },
      },
      {
        id: "country",
        accessorKey: "country",
        header: "국가",
        size: 70,
        cell: ({ getValue }) => {
          const value = getValue() as string | null;
          return <div className="text-xs">{value || "-"}</div>;
        },
      },
      {
        id: "language",
        accessorKey: "language",
        header: "언어",
        size: 70,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <div className="text-xs">{value || "-"}</div>;
        },
      },
      {
        id: "kycLevel",
        accessorKey: "kycLevel",
        header: "KYC",
        size: 70,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <div className="text-xs">
              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {value || "-"}
              </span>
            </div>
          );
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "생성일",
        size: 100,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return <div className="text-xs">-</div>;
          return (
            <div className="text-xs">
              {new Date(value).toLocaleDateString("ko-KR", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
              })}
            </div>
          );
        },
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        header: "수정일",
        size: 100,
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return <div className="text-xs">-</div>;
          return (
            <div className="text-xs">
              {new Date(value).toLocaleDateString("ko-KR", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "작업",
        accessorKey: "id",
        size: 80,
        enableSorting: false,
        enableColumnFilter: false,
        cell: function render({ getValue }) {
          return (
            <div className="flex items-center gap-1">
              <EditButton recordItemId={getValue() as string} size="sm">
                <Pencil className="h-3 w-3" />
              </EditButton>
              <DeleteButton recordItemId={getValue() as string} size="sm">
                <Trash className="h-3 w-3" />
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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{isEditMode ? "사용자 수정" : "사용자 생성"}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={handleSubmit(onFinish)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                defaultValue={defaultValues.email}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        {...field}
                        disabled={isEditMode}
                      />
                    </FormControl>
                    <FormDescription>
                      {isEditMode
                        ? "이메일은 수정할 수 없습니다"
                        : "사용자의 이메일 주소를 입력해주세요"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                defaultValue={defaultValues.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} />
                    </FormControl>
                    <FormDescription>사용자의 이름을 입력해주세요</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isEditMode && (
                <FormField
                  control={form.control}
                  name="password"
                  defaultValue=""
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="비밀번호를 입력해주세요"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        최소 6자 이상의 비밀번호를 입력해주세요
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  defaultValue={defaultValues.role}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>역할</FormLabel>
                      <FormControl>
                        <Input placeholder="USER" {...field} />
                      </FormControl>
                      <FormDescription>사용자 역할을 입력해주세요</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  defaultValue={defaultValues.status}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상태</FormLabel>
                      <FormControl>
                        <Input placeholder="ACTIVE" {...field} />
                      </FormControl>
                      <FormDescription>사용자 상태를 입력해주세요</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  defaultValue={defaultValues.country}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>국가</FormLabel>
                      <FormControl>
                        <Input placeholder="KR" {...field} />
                      </FormControl>
                      <FormDescription>국가 코드</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  defaultValue={defaultValues.language}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>언어</FormLabel>
                      <FormControl>
                        <Input placeholder="ko" {...field} />
                      </FormControl>
                      <FormDescription>언어 코드</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  defaultValue={defaultValues.timezone}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>타임존</FormLabel>
                      <FormControl>
                        <Input placeholder="Asia/Seoul" {...field} />
                      </FormControl>
                      <FormDescription>타임존</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "처리 중..." : t("save")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">사용자 목록</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <DataTable table={table} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

