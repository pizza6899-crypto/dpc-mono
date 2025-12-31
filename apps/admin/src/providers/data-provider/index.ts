"use client";

import dataProviderSimpleRest from "@refinedev/simple-rest";
import { DataProvider } from "@refinedev/core";
import { AXIOS_INSTANCE } from "@/api/axios-instance";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

if (!API_URL) {
  console.warn(
    "NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. Data Provider가 제대로 작동하지 않을 수 있습니다."
  );
}

// 기본 simple-rest data provider 생성
const simpleRestDataProvider = dataProviderSimpleRest(API_URL, AXIOS_INSTANCE);

// API 응답 형식을 Refine이 기대하는 형식으로 변환하는 커스텀 Data Provider
export const dataProvider: DataProvider = {
  ...simpleRestDataProvider,
  getList: async ({ resource, pagination, filters, sorters, meta, ...rest }) => {
    const response = await simpleRestDataProvider.getList({
      resource,
      pagination,
      filters,
      sorters,
      meta,
      ...rest,
    });

    // API 응답이 이중으로 래핑된 경우 처리
    // axios response: { data: { success: true, data: [...], pagination: {...} } }
    // Refine 기대: { data: [...], total: number }
    let apiResponse = response as any;
    
    // response.data가 객체이고 success 속성이 있으면 실제 API 응답이 response.data에 있음
    if (response && typeof response === "object" && "data" in response) {
      const innerData = (response as any).data;
      if (innerData && typeof innerData === "object" && "success" in innerData) {
        apiResponse = innerData;
      }
    }
    
    // pagination 객체가 있는 경우 (PaginatedResponseDto)
    if (apiResponse && typeof apiResponse === "object" && apiResponse.pagination && typeof apiResponse.pagination === "object") {
      return {
        data: apiResponse.data || [],
        total: apiResponse.pagination.total || 0,
      };
    }
    
    // 직접 total이 있는 경우
    if (apiResponse && typeof apiResponse === "object" && typeof apiResponse.total === "number") {
      return {
        data: apiResponse.data || [],
        total: apiResponse.total,
      };
    }

    return response;
  },
};
