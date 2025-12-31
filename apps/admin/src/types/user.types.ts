import type { BaseRecord } from "@refinedev/core";

export type User = BaseRecord & {
  id: string;
  uid?: string;
  email: string | null;
  role?: string;
  status?: string;
  country?: string | null;
  timezone?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

