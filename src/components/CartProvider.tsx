"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MAX_ITEM_QUANTITY } from "@/lib/constants";

export interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  isVeg: boolean;
  emoji: string | null;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  ready: boolean;
  quantityOf: (menuItemId: string) => number;
  add: (item: Omit<CartLine, "quantity">) => void;
  decrement: (menuItemId: string) => void;
  setLines: (lines: CartLine[]) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "iims-canteen-cart-v1";

function load(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.menuItemId === "string" && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLinesState] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLinesState(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Private mode or storage full: the cart still works for this visit.
    }
  }, [lines, ready]);

  const add = useCallback((item: Omit<CartLine, "quantity">) => {
    setLinesState((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.menuItemId);
      if (!existing) return [...prev, { ...item, quantity: 1 }];
      return prev.map((l) =>
        l.menuItemId === item.menuItemId ? { ...l, quantity: Math.min(MAX_ITEM_QUANTITY, l.quantity + 1) } : l,
      );
    });
  }, []);

  const decrement = useCallback((menuItemId: string) => {
    setLinesState((prev) =>
      prev
        .map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      total: lines.reduce((s, l) => s + l.quantity * l.price, 0),
      quantityOf: (id) => lines.find((l) => l.menuItemId === id)?.quantity ?? 0,
      add,
      decrement,
      setLines: setLinesState,
      clear: () => setLinesState([]),
    }),
    [lines, ready, add, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
