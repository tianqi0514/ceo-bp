import { KeyRound, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { CreateObjectTypeRequest, ObjectFieldType } from "./knowledgeApi";

interface DraftField {
  id: number;
  name: string;
  displayName: string;
  type: ObjectFieldType;
}

interface ObjectTypeDialogProps {
  networkName: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: CreateObjectTypeRequest) => void;
}

const initialFields: DraftField[] = [
  { id: 1, name: "", displayName: "", type: "string" },
  { id: 2, name: "", displayName: "", type: "string" },
];

const fieldTypeLabels: Record<ObjectFieldType, string> = {
  string: "文本",
  integer: "整数",
  decimal: "小数",
  datetime: "日期时间",
  boolean: "是/否",
};

export function ObjectTypeDialog({
  networkName,
  busy,
  error,
  onClose,
  onSubmit,
}: ObjectTypeDialogProps) {
  const [name, setName] = useState("");
  const [fields, setFields] = useState<DraftField[]>(initialFields);
  const [primaryFieldId, setPrimaryFieldId] = useState(1);
  const [displayFieldId, setDisplayFieldId] = useState(2);
  const [validationError, setValidationError] = useState<string | null>(null);

  const updateField = (id: number, patch: Partial<DraftField>) => {
    setFields((current) =>
      current.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    );
  };

  const addField = () => {
    setFields((current) => [
      ...current,
      {
        id: Math.max(...current.map((field) => field.id)) + 1,
        name: "",
        displayName: "",
        type: "string",
      },
    ]);
  };

  const removeField = (id: number) => {
    setFields((current) => {
      const remaining = current.filter((field) => field.id !== id);
      if (primaryFieldId === id) setPrimaryFieldId(remaining[0].id);
      if (displayFieldId === id) setDisplayFieldId(remaining[0].id);
      return remaining;
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const objectName = name.trim();
    const cleaned = fields.map((field) => ({
      ...field,
      name: field.name.trim(),
      displayName: field.displayName.trim(),
    }));
    if (!objectName) {
      setValidationError("请填写对象类型名称。");
      return;
    }
    if (cleaned.some((field) => !field.name || !field.displayName)) {
      setValidationError("请完整填写每个字段的代码和业务名称。");
      return;
    }
    if (cleaned.some((field) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(field.name))) {
      setValidationError(
        "字段代码须以字母或下划线开头，且只包含字母、数字和下划线。",
      );
      return;
    }
    if (new Set(cleaned.map((field) => field.name)).size !== cleaned.length) {
      setValidationError("字段代码不能重复。");
      return;
    }

    const primary = cleaned.find((field) => field.id === primaryFieldId);
    const display = cleaned.find((field) => field.id === displayFieldId);
    if (!primary || !display) {
      setValidationError("请选择主键字段和显示字段。");
      return;
    }
    setValidationError(null);
    onSubmit({
      name: objectName,
      primary_key: primary.name,
      display_key: display.name,
      fields: cleaned.map((field) => ({
        name: field.name,
        display_name: field.displayName,
        type: field.type,
      })),
    });
  };

  return (
    <div className="modal-backdrop object-modal-backdrop" role="presentation">
      <section
        aria-labelledby="create-object-heading"
        aria-modal="true"
        className="modal object-modal"
        role="dialog"
      >
        <div className="modal-header">
          <div>
            <p>{networkName}</p>
            <h2 id="create-object-heading">新增经营对象类型</h2>
          </div>
          <button
            aria-label="关闭对象类型窗口"
            className="icon-button"
            disabled={busy}
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit}>
          <label className="field">
            <span>
              对象类型名称 <b>必填</b>
            </span>
            <input
              aria-label="对象类型名称"
              maxLength={40}
              placeholder="例如：客户、门店、合同"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <div className="field-table-heading">
            <div>
              <strong>字段定义</strong>
              <p>代码用于数据映射，业务名称用于分析界面。</p>
            </div>
            <button
              className="button secondary"
              type="button"
              onClick={addField}
            >
              <Plus size={15} /> 添加字段
            </button>
          </div>
          <div className="object-field-table">
            <div className="object-field-header" aria-hidden="true">
              <span>字段代码</span>
              <span>业务名称</span>
              <span>类型</span>
              <span>主键</span>
              <span>显示</span>
              <span />
            </div>
            {fields.map((field, index) => (
              <div className="object-field-row" key={field.id}>
                <input
                  aria-label={`字段${index + 1}代码`}
                  maxLength={64}
                  placeholder={index === 0 ? "customer_id" : "customer_name"}
                  value={field.name}
                  onChange={(event) =>
                    updateField(field.id, { name: event.target.value })
                  }
                />
                <input
                  aria-label={`字段${index + 1}业务名称`}
                  maxLength={120}
                  placeholder={index === 0 ? "客户编号" : "客户名称"}
                  value={field.displayName}
                  onChange={(event) =>
                    updateField(field.id, { displayName: event.target.value })
                  }
                />
                <select
                  aria-label={`字段${index + 1}类型`}
                  value={field.type}
                  onChange={(event) =>
                    updateField(field.id, {
                      type: event.target.value as ObjectFieldType,
                    })
                  }
                >
                  {Object.entries(fieldTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <label className="key-choice" title="设为主键">
                  <span className="sr-only">字段{index + 1}设为主键</span>
                  <input
                    aria-label={`字段${index + 1}设为主键`}
                    checked={primaryFieldId === field.id}
                    name="primary-field"
                    type="radio"
                    onChange={() => setPrimaryFieldId(field.id)}
                  />
                  <KeyRound size={14} />
                </label>
                <label className="key-choice" title="设为显示字段">
                  <span className="sr-only">字段{index + 1}设为显示字段</span>
                  <input
                    aria-label={`字段${index + 1}设为显示字段`}
                    checked={displayFieldId === field.id}
                    name="display-field"
                    type="radio"
                    onChange={() => setDisplayFieldId(field.id)}
                  />
                  显示
                </label>
                <button
                  aria-label={`删除字段${index + 1}`}
                  className="icon-button compact"
                  disabled={fields.length === 1}
                  type="button"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          {validationError || error ? (
            <p className="form-error" role="alert">
              {validationError || error}
            </p>
          ) : null}
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              type="button"
              onClick={onClose}
            >
              取消
            </button>
            <button className="button primary" disabled={busy} type="submit">
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Plus size={16} />
              )}
              {busy ? "正在创建" : "创建对象类型"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
