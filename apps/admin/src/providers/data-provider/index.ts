"use client";

import dataProviderSimpleRest from "@refinedev/simple-rest";
import { AXIOS_INSTANCE } from "@/api/axios-instance";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

if (!API_URL) {
  console.warn(
    "NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. Data Provider가 제대로 작동하지 않을 수 있습니다."
  );
}

export const dataProvider = dataProviderSimpleRest(API_URL, AXIOS_INSTANCE);
