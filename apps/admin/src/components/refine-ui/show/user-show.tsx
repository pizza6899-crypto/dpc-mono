"use client";

import React from "react";
import { useOne, useResourceParams } from "@refinedev/core";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyableCell } from "@/components/refine-ui/tables/copyable-cell";
import type { User } from "@/types/user.types";

export function UserShow() {
  const t = useTranslations("table.user");
  const { id } = useResourceParams();
  
  const { data, isLoading } = useOne<User>({
    resource: "admin/users",
    id: id as string,
  });

  const user = data?.data;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader> 
          <CardContent className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">사용자 정보를 찾을 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("id")}
              </label>
              <div className="font-mono text-sm">
                <CopyableCell value={user.id} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("uid")}
              </label>
              <div className="font-mono text-sm">
                <CopyableCell value={user.uid} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("email")}
              </label>
              <div>
                <CopyableCell value={user.email} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("role")}
              </label>
              <div>
                <CopyableCell value={user.role} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("status")}
              </label>
              <div>
                <CopyableCell value={user.status} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("country")}
              </label>
              <div>
                <CopyableCell value={user.country} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("timezone")}
              </label>
              <div>
                <CopyableCell value={user.timezone} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>타임스탬프</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("createdAt")}
              </label>
              <div>
                <CopyableCell
                  value={user.createdAt}
                  displayValue={formatDate(user.createdAt)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("updatedAt")}
              </label>
              <div>
                <CopyableCell
                  value={user.updatedAt}
                  displayValue={formatDate(user.updatedAt)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

