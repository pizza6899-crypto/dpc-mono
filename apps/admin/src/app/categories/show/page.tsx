"use client";

import { Show, TextField } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import { useSearchParams } from "next/navigation";

const { Title } = Typography;

export default function CategoryShow() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { result: record, query } = useShow({
    id: id ?? undefined,
  });
  const { isLoading } = query;

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>{"ID"}</Title>
      <TextField value={record?.id} />
      <Title level={5}>{"Title"}</Title>
      <TextField value={record?.title} />
    </Show>
  );
}
