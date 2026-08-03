import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ObjectTypeDialog } from "./ObjectTypeDialog";

function renderDialog(options: { busy?: boolean; error?: string | null } = {}) {
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  const rendered = render(
    <ObjectTypeDialog
      busy={options.busy ?? false}
      error={options.error ?? null}
      networkName="集团经营分析网络"
      onClose={onClose}
      onSubmit={onSubmit}
    />,
  );
  return {
    dialog: screen.getByRole("dialog", { name: "新增经营对象类型" }),
    onClose,
    onSubmit,
    unmount: rendered.unmount,
  };
}

describe("ObjectTypeDialog", () => {
  it("validates names, field completeness, syntax and uniqueness before submit", () => {
    const { dialog, onSubmit } = renderDialog();
    const submit = within(dialog).getByRole("button", {
      name: "创建对象类型",
    });

    fireEvent.click(submit);
    expect(screen.getByText("请填写对象类型名称。")).toBeVisible();

    fireEvent.change(within(dialog).getByLabelText("对象类型名称"), {
      target: { value: "客户" },
    });
    fireEvent.click(submit);
    expect(
      screen.getByText("请完整填写每个字段的代码和业务名称。"),
    ).toBeVisible();

    fireEvent.change(within(dialog).getByLabelText("字段1代码"), {
      target: { value: "1invalid" },
    });
    fireEvent.change(within(dialog).getByLabelText("字段1业务名称"), {
      target: { value: "客户编号" },
    });
    fireEvent.change(within(dialog).getByLabelText("字段2代码"), {
      target: { value: "customer_name" },
    });
    fireEvent.change(within(dialog).getByLabelText("字段2业务名称"), {
      target: { value: "客户名称" },
    });
    fireEvent.click(submit);
    expect(screen.getByText(/字段代码须以字母或下划线开头/)).toBeVisible();

    fireEvent.change(within(dialog).getByLabelText("字段1代码"), {
      target: { value: "customer_name" },
    });
    fireEvent.click(submit);
    expect(screen.getByText("字段代码不能重复。")).toBeVisible();

    fireEvent.change(within(dialog).getByLabelText("字段1代码"), {
      target: { value: "customer_id" },
    });
    fireEvent.change(within(dialog).getByLabelText("字段2类型"), {
      target: { value: "decimal" },
    });
    fireEvent.click(within(dialog).getByLabelText("字段2设为主键"));
    fireEvent.click(within(dialog).getByLabelText("字段1设为显示字段"));
    fireEvent.click(submit);

    expect(onSubmit).toHaveBeenCalledWith({
      name: "客户",
      primary_key: "customer_name",
      display_key: "customer_id",
      fields: [
        { name: "customer_id", display_name: "客户编号", type: "string" },
        { name: "customer_name", display_name: "客户名称", type: "decimal" },
      ],
    });
  });

  it("adds and removes fields while preserving valid key selections", () => {
    const { dialog } = renderDialog();

    fireEvent.click(within(dialog).getByRole("button", { name: "添加字段" }));
    expect(within(dialog).getByLabelText("字段3代码")).toBeVisible();
    fireEvent.click(within(dialog).getByLabelText("字段3设为主键"));
    fireEvent.click(within(dialog).getByLabelText("字段3设为显示字段"));
    fireEvent.click(within(dialog).getByRole("button", { name: "删除字段3" }));

    expect(within(dialog).getByLabelText("字段1设为主键")).toBeChecked();
    expect(within(dialog).getByLabelText("字段1设为显示字段")).toBeChecked();
    fireEvent.click(within(dialog).getByRole("button", { name: "删除字段2" }));
    expect(
      within(dialog).getByRole("button", { name: "删除字段1" }),
    ).toBeDisabled();
  });

  it("exposes server errors, busy state and both close actions", () => {
    const { dialog, onClose, unmount } = renderDialog({
      busy: true,
      error: "对象类型名称已存在。",
    });

    expect(screen.getByText("对象类型名称已存在。")).toBeVisible();
    expect(
      within(dialog).getByRole("button", { name: "正在创建" }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: "关闭对象类型窗口" }),
    ).toBeDisabled();

    unmount();
    const rerendered = renderDialog();
    fireEvent.click(
      within(rerendered.dialog).getByRole("button", {
        name: "关闭对象类型窗口",
      }),
    );
    fireEvent.click(
      within(rerendered.dialog).getByRole("button", { name: "取消" }),
    );
    expect(rerendered.onClose).toHaveBeenCalledTimes(2);
    expect(onClose).not.toHaveBeenCalled();
  });
});
