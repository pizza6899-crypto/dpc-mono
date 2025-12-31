"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export function DashboardContent() {
  // TODO: 실제 데이터로 교체 필요
  const stats = [
    {
      title: "총 사용자",
      value: "12,345",
      change: "+12.5%",
      trend: "up",
      icon: Users,
    },
    {
      title: "총 매출",
      value: "₩1,234,567,890",
      change: "+8.2%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "활성 사용자",
      value: "8,901",
      change: "+5.3%",
      trend: "up",
      icon: Activity,
    },
    {
      title: "성장률",
      value: "23.4%",
      change: "+2.1%",
      trend: "up",
      icon: TrendingUp,
    },
  ];

  return (
    <div className={cn("flex", "flex-col", "gap-6")}>
      <div>
        <h1 className={cn("text-3xl", "font-bold", "mb-2")}>대시보드</h1>
        <p className={cn("text-muted-foreground")}>
          시스템 현황 및 주요 지표를 확인하세요.
        </p>
      </div>

      <div
        className={cn(
          "grid",
          "gap-4",
          "grid-cols-1",
          "md:grid-cols-2",
          "lg:grid-cols-4"
        )}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isUp = stat.trend === "up";
          const TrendIcon = isUp ? ArrowUpRight : ArrowDownRight;

          return (
            <Card key={stat.title}>
              <CardHeader className={cn("flex", "flex-row", "items-center", "justify-between", "space-y-0", "pb-2")}>
                <CardTitle className={cn("text-sm", "font-medium")}>
                  {stat.title}
                </CardTitle>
                <Icon className={cn("h-4", "w-4", "text-muted-foreground")} />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl", "font-bold")}>{stat.value}</div>
                <div className={cn("flex", "items-center", "text-xs", "mt-1")}>
                  <TrendIcon
                    className={cn(
                      "h-3",
                      "w-3",
                      "mr-1",
                      isUp ? "text-green-500" : "text-red-500"
                    )}
                  />
                  <span
                    className={cn(
                      isUp ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {stat.change}
                  </span>
                  <span className={cn("text-muted-foreground", "ml-1")}>
                    지난 달 대비
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className={cn("grid", "gap-4", "grid-cols-1", "lg:grid-cols-2")}>
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("space-y-4")}>
              <div className={cn("flex", "items-center", "justify-between")}>
                <div>
                  <p className={cn("text-sm", "font-medium")}>
                    새로운 사용자 가입
                  </p>
                  <p className={cn("text-xs", "text-muted-foreground")}>
                    2분 전
                  </p>
                </div>
              </div>
              <div className={cn("flex", "items-center", "justify-between")}>
                <div>
                  <p className={cn("text-sm", "font-medium")}>
                    입금 완료
                  </p>
                  <p className={cn("text-xs", "text-muted-foreground")}>
                    15분 전
                  </p>
                </div>
              </div>
              <div className={cn("flex", "items-center", "justify-between")}>
                <div>
                  <p className={cn("text-sm", "font-medium")}>
                    출금 요청
                  </p>
                  <p className={cn("text-xs", "text-muted-foreground")}>
                    1시간 전
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>빠른 액션</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("space-y-2")}>
              <p className={cn("text-sm", "text-muted-foreground")}>
                자주 사용하는 기능에 빠르게 접근하세요.
              </p>
              <div className={cn("grid", "grid-cols-2", "gap-2", "mt-4")}>
                <button
                  className={cn(
                    "p-3",
                    "border",
                    "rounded-lg",
                    "hover:bg-accent",
                    "text-left",
                    "transition-colors"
                  )}
                >
                  <p className={cn("text-sm", "font-medium")}>사용자 관리</p>
                </button>
                <button
                  className={cn(
                    "p-3",
                    "border",
                    "rounded-lg",
                    "hover:bg-accent",
                    "text-left",
                    "transition-colors"
                  )}
                >
                  <p className={cn("text-sm", "font-medium")}>입출금 관리</p>
                </button>
                <button
                  className={cn(
                    "p-3",
                    "border",
                    "rounded-lg",
                    "hover:bg-accent",
                    "text-left",
                    "transition-colors"
                  )}
                >
                  <p className={cn("text-sm", "font-medium")}>게임 관리</p>
                </button>
                <button
                  className={cn(
                    "p-3",
                    "border",
                    "rounded-lg",
                    "hover:bg-accent",
                    "text-left",
                    "transition-colors"
                  )}
                >
                  <p className={cn("text-sm", "font-medium")}>리포트</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

