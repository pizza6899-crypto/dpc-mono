"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { X, Check, ChevronsUpDown } from "lucide-react";
import type { UseTableReturnType } from "@refinedev/react-table";
import type { BaseRecord, HttpError } from "@refinedev/core";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type UserListFiltersProps<TData extends BaseRecord> = {
  table: UseTableReturnType<TData, HttpError>;
};

export function UserListFilters<TData extends BaseRecord>({
  table,
}: UserListFiltersProps<TData>) {
  const t = useTranslations("table.user");
  const tCommon = useTranslations("common");
  
  const [emailFilter, setEmailFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [roleOpen, setRoleOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const { refineCore, reactTable } = table;
  const { setFilters, tableQuery } = refineCore;

  // 테이블 데이터에서 고유한 값 추출
  const uniqueValues = useMemo(() => {
    const data = tableQuery.data?.data || [];
    const roles = new Set<string>();
    const statuses = new Set<string>();
    const countries = new Set<string>();

    data.forEach((row: any) => {
      if (row.role) roles.add(row.role);
      if (row.status) statuses.add(row.status);
      if (row.country) countries.add(row.country);
    });

    return {
      roles: Array.from(roles).sort(),
      statuses: Array.from(statuses).sort(),
      countries: Array.from(countries).sort(),
    };
  }, [tableQuery.data?.data]);

  const emailColumn = reactTable.getColumn("email");
  const roleColumn = reactTable.getColumn("role");
  const statusColumn = reactTable.getColumn("status");
  const countryColumn = reactTable.getColumn("country");

  // 필터 값 동기화
  useEffect(() => {
    const emailValue = emailColumn?.getFilterValue() as string;
    const roleValue = roleColumn?.getFilterValue() as string | string[];
    const statusValue = statusColumn?.getFilterValue() as string | string[];
    const countryValue = countryColumn?.getFilterValue() as string;
    
    if (emailValue !== undefined) setEmailFilter(emailValue || "");
    if (roleValue !== undefined) {
      setRoleFilter(Array.isArray(roleValue) ? roleValue : roleValue ? [roleValue] : []);
    }
    if (statusValue !== undefined) {
      setStatusFilter(Array.isArray(statusValue) ? statusValue : statusValue ? [statusValue] : []);
    }
    if (countryValue !== undefined) {
      setCountryFilter(Array.isArray(countryValue) ? countryValue : countryValue ? [countryValue] : []);
    }
  }, [
    emailColumn?.getFilterValue(),
    roleColumn?.getFilterValue(),
    statusColumn?.getFilterValue(),
    countryColumn?.getFilterValue(),
  ]);

  const applyFilters = () => {
    // 각 컬럼에 필터 값 설정
    emailColumn?.setFilterValue(emailFilter.trim() || undefined);
    roleColumn?.setFilterValue(roleFilter.length > 0 ? roleFilter : undefined);
    statusColumn?.setFilterValue(statusFilter.length > 0 ? statusFilter : undefined);
    countryColumn?.setFilterValue(countryFilter.length > 0 ? countryFilter : undefined);

    // refine 필터 설정
    const filters: any[] = [];

    if (emailFilter.trim()) {
      filters.push({
        field: "email",
        operator: "contains",
        value: emailFilter.trim(),
      });
    }
    if (roleFilter.length > 0) {
      if (roleFilter.length === 1) {
        filters.push({
          field: "role",
          operator: "eq",
          value: roleFilter[0],
        });
      } else {
        filters.push({
          field: "role",
          operator: "in",
          value: roleFilter,
        });
      }
    }
    if (statusFilter.length > 0) {
      if (statusFilter.length === 1) {
        filters.push({
          field: "status",
          operator: "eq",
          value: statusFilter[0],
        });
      } else {
        filters.push({
          field: "status",
          operator: "in",
          value: statusFilter,
        });
      }
    }
    if (countryFilter.length > 0) {
      if (countryFilter.length === 1) {
        filters.push({
          field: "country",
          operator: "eq",
          value: countryFilter[0],
        });
      } else {
        filters.push({
          field: "country",
          operator: "in",
          value: countryFilter,
        });
      }
    }

    setFilters(filters);
  };

  const handleReset = () => {
    setEmailFilter("");
    setRoleFilter([]);
    setStatusFilter([]);
    setCountryFilter([]);
    emailColumn?.setFilterValue(undefined);
    roleColumn?.setFilterValue(undefined);
    statusColumn?.setFilterValue(undefined);
    countryColumn?.setFilterValue(undefined);
    setFilters([]);
  };

  const handleRoleToggle = (role: string) => {
    setRoleFilter((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleStatusToggle = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleCountryToggle = (country: string) => {
    setCountryFilter((prev) =>
      prev.includes(country)
        ? prev.filter((c) => c !== country)
        : [...prev, country]
    );
  };

  const removeFilter = (type: "email" | "role" | "status" | "country", value?: string) => {
    const filters: any[] = [];
    let newEmailFilter = emailFilter;
    let newRoleFilter = [...roleFilter];
    let newStatusFilter = [...statusFilter];
    let newCountryFilter = [...countryFilter];

    if (type === "email") {
      newEmailFilter = "";
      emailColumn?.setFilterValue(undefined);
      setEmailFilter("");
    } else if (type === "role" && value) {
      newRoleFilter = roleFilter.filter((r) => r !== value);
      setRoleFilter(newRoleFilter);
      if (newRoleFilter.length > 0) {
        roleColumn?.setFilterValue(newRoleFilter);
      } else {
        roleColumn?.setFilterValue(undefined);
      }
    } else if (type === "status" && value) {
      newStatusFilter = statusFilter.filter((s) => s !== value);
      setStatusFilter(newStatusFilter);
      if (newStatusFilter.length > 0) {
        statusColumn?.setFilterValue(newStatusFilter);
      } else {
        statusColumn?.setFilterValue(undefined);
      }
    } else if (type === "country" && value) {
      newCountryFilter = countryFilter.filter((c) => c !== value);
      setCountryFilter(newCountryFilter);
      if (newCountryFilter.length > 0) {
        countryColumn?.setFilterValue(newCountryFilter);
      } else {
        countryColumn?.setFilterValue(undefined);
      }
    }

    // 필터 즉시 적용
    if (newEmailFilter.trim()) {
      filters.push({
        field: "email",
        operator: "contains",
        value: newEmailFilter.trim(),
      });
    }
    if (newRoleFilter.length > 0) {
      if (newRoleFilter.length === 1) {
        filters.push({
          field: "role",
          operator: "eq",
          value: newRoleFilter[0],
        });
      } else {
        filters.push({
          field: "role",
          operator: "in",
          value: newRoleFilter,
        });
      }
    }
    if (newStatusFilter.length > 0) {
      if (newStatusFilter.length === 1) {
        filters.push({
          field: "status",
          operator: "eq",
          value: newStatusFilter[0],
        });
      } else {
        filters.push({
          field: "status",
          operator: "in",
          value: newStatusFilter,
        });
      }
    }
    if (newCountryFilter.length > 0) {
      if (newCountryFilter.length === 1) {
        filters.push({
          field: "country",
          operator: "eq",
          value: newCountryFilter[0],
        });
      } else {
        filters.push({
          field: "country",
          operator: "in",
          value: newCountryFilter,
        });
      }
    }

    setFilters(filters);
  };

  const activeFilters: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];

  if (emailColumn?.getIsFiltered()) {
    const value = emailColumn.getFilterValue() as string;
    activeFilters.push({
      key: "email",
      label: t("email"),
      value: value || "",
      onRemove: () => removeFilter("email"),
    });
  }

  if (roleColumn?.getIsFiltered()) {
    const value = roleColumn.getFilterValue() as string | string[];
    const values = Array.isArray(value) ? value : value ? [value] : [];
    values.forEach((val) => {
      activeFilters.push({
        key: `role-${val}`,
        label: t("role"),
        value: val,
        onRemove: () => removeFilter("role", val),
      });
    });
  }

  if (statusColumn?.getIsFiltered()) {
    const value = statusColumn.getFilterValue() as string | string[];
    const values = Array.isArray(value) ? value : value ? [value] : [];
    values.forEach((val) => {
      activeFilters.push({
        key: `status-${val}`,
        label: t("status"),
        value: val,
        onRemove: () => removeFilter("status", val),
      });
    });
  }

  if (countryColumn?.getIsFiltered()) {
    const value = countryColumn.getFilterValue() as string | string[];
    const values = Array.isArray(value) ? value : value ? [value] : [];
    values.forEach((val) => {
      activeFilters.push({
        key: `country-${val}`,
        label: t("country"),
        value: val,
        onRemove: () => removeFilter("country", val),
      });
    });
  }

  const hasActiveFilters =
    emailFilter.trim() !== "" ||
    roleFilter.length > 0 ||
    statusFilter.length > 0 ||
    countryFilter.length > 0;

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-card">
      {/* 상단: 필터 입력 영역 */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 이메일: 왼쪽 끝 */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">{t("email")}:</label>
          <Input
            type="text"
            placeholder={t("email")}
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applyFilters();
              }
            }}
            className="w-[200px] h-9"
          />
        </div>

        {/* 역할: Popover */}
        <Popover open={roleOpen} onOpenChange={setRoleOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 justify-between min-w-[120px]",
                roleFilter.length > 0 && "border-primary"
              )}
            >
              <span className="truncate">
                {roleFilter.length > 0
                  ? `${t("role")} (${roleFilter.length})`
                  : t("role")}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder={tCommon("search")} />
              <CommandList>
                <CommandEmpty>{tCommon("search")}</CommandEmpty>
                <CommandGroup>
                  {uniqueValues.roles.map((role) => (
                    <CommandItem
                      key={role}
                      value={role}
                      onSelect={() => {
                        handleRoleToggle(role);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          roleFilter.includes(role)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {role}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* 상태: Popover */}
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 justify-between min-w-[120px]",
                statusFilter.length > 0 && "border-primary"
              )}
            >
              <span className="truncate">
                {statusFilter.length > 0
                  ? `${t("status")} (${statusFilter.length})`
                  : t("status")}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder={tCommon("search")} />
              <CommandList>
                <CommandEmpty>{tCommon("search")}</CommandEmpty>
                <CommandGroup>
                  {uniqueValues.statuses.map((status) => (
                    <CommandItem
                      key={status}
                      value={status}
                      onSelect={() => {
                        handleStatusToggle(status);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          statusFilter.includes(status)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {status}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* 국가: Popover */}
        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 justify-between min-w-[120px]",
                countryFilter.length > 0 && "border-primary"
              )}
            >
              <span className="truncate">
                {countryFilter.length > 0
                  ? `${t("country")} (${countryFilter.length})`
                  : t("country")}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder={tCommon("search")} />
              <CommandList>
                <CommandEmpty>{tCommon("search")}</CommandEmpty>
                <CommandGroup>
                  {uniqueValues.countries.map((country) => (
                    <CommandItem
                      key={country}
                      value={country}
                      onSelect={() => {
                        handleCountryToggle(country);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          countryFilter.includes(country)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {country}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* 우측 끝: 조회 및 초기화 버튼 */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            onClick={applyFilters}
            className="h-9"
          >
            {tCommon("search")}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="h-9"
          >
            {tCommon("reset")}
          </Button>
        </div>
      </div>

      {/* 하단: 적용된 필터 Badge들 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {tCommon("filter")}:
          </span>
          {emailFilter && (
            <Badge
              variant="secondary"
              className="px-2 py-1 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => removeFilter("email")}
            >
              {t("email")}: {emailFilter}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {roleFilter.map((role) => (
            <Badge
              key={role}
              variant="secondary"
              className="px-2 py-1 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => removeFilter("role", role)}
            >
              {t("role")}: {role}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {statusFilter.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="px-2 py-1 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => removeFilter("status", status)}
            >
              {t("status")}: {status}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {countryFilter.map((country) => (
            <Badge
              key={country}
              variant="secondary"
              className="px-2 py-1 text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => removeFilter("country", country)}
            >
              {t("country")}: {country}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

