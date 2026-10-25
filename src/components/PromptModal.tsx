"use client";

import { useState } from "react";
import { Modal } from "./Modal";

export function PromptModal({
  title,
  label,
  placeholder,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
}: {
  title: string;
  label: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");

  return (
    <Modal title={title} onClose={onClose}>
      <label className="form-label">
        {label}
        <textarea
          className="form-input form-textarea"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          autoFocus
        />
      </label>
      <div className="modal-foot">
        <button className="button button-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          className="button button-primary"
          disabled={!value.trim()}
          onClick={() => {
            onConfirm(value.trim());
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
