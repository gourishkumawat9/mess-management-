"use client";

import { useState } from "react";
import { Pencil, RefreshCw } from "lucide-react";
import { ItemForm, type ItemDetails } from "./ItemForm";
import { StockUpdateDialog } from "./StockUpdateDialog";

export function ItemActions({ item }: { item: ItemDetails & { quantity: number } }) {
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  return (
    <div className="flex gap-2">
      <button onClick={() => setEditing(true)} className="btn-secondary">
        <Pencil className="h-4 w-4" /> Edit details
      </button>
      <button onClick={() => setUpdating(true)} className="btn-primary">
        <RefreshCw className="h-4 w-4" /> Update stock
      </button>
      {editing && <ItemForm open item={item} onClose={() => setEditing(false)} />}
      <StockUpdateDialog item={updating ? item : null} onClose={() => setUpdating(false)} />
    </div>
  );
}
