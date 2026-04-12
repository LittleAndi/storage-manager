import React, { useState } from "react";

interface EditableTitleProps {
  value: string;
  canEdit: boolean;
  onSave: (next: string) => Promise<void> | void;
  className?: string;
}

const EditableTitle: React.FC<EditableTitleProps> = ({ value, canEdit, onSave, className }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (draft.trim() && draft !== value) {
      setBusy(true);
      await onSave(draft.trim());
      setBusy(false);
    } else {
      setDraft(value); // revert trimming
    }
    setEditing(false);
  }

  if (!canEdit) return <h1 className={className}>{value}</h1>;

  return (
    <div className={className}>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
            aria-label={`Edit title: ${value}`}
            className="border rounded px-2 py-1 text-xl font-semibold"
            onKeyDown={e => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
          />
          <button type="button" disabled={busy} onClick={handleSave} className="text-sm underline">Save</button>
          <button type="button" className="text-sm text-muted-foreground" onClick={() => { setDraft(value); setEditing(false); }}>Cancel</button>
        </div>
      ) : (
        <h1
          className="text-2xl font-bold cursor-pointer group inline-flex items-center"
          onClick={() => setEditing(true)}
          title="Click to edit title"
        >
          {value}
          <span className="ml-2 text-xs opacity-0 group-hover:opacity-70">Edit</span>
        </h1>
      )}
    </div>
  );
};

export default EditableTitle;
