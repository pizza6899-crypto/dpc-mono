"use client";

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { useSearchParams } from "next/navigation";

export default function CategoryEdit() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { formProps, saveButtonProps } = useForm({
    id: id ?? undefined,
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={"Title"}
          name={["title"]}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
}
