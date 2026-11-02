"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Course } from "@/lib/coursesApi";
import type { Internship } from "@/lib/internshipsApi";

export type CartItem =
  | { kind: "course"; course: Course }
  | { kind: "internship"; internship: Internship };

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  storageError: string | null;
  count: number;
  hasCourse: (id: string) => boolean;
  hasInternship: (id: string) => boolean;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  addInternship: (internship: Internship) => void;
  removeCourse: (id: string) => void;
  removeInternship: (id: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "way2skills-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is CartItem => {
    if (!isRecord(entry)) return false;
    if (entry.kind === "course" && isRecord(entry.course)) {
      return (
        typeof entry.course.id === "string" &&
        typeof entry.course.slug === "string" &&
        typeof entry.course.title === "string"
      );
    }
    if (entry.kind === "internship" && isRecord(entry.internship)) {
      return (
        typeof entry.internship.id === "string" &&
        typeof entry.internship.slug === "string" &&
        typeof entry.internship.title === "string"
      );
    }
    return false;
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(readCart(JSON.parse(saved) as unknown));
    } catch {
      setStorageError("Saved cart data could not be read in this browser.");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      setStorageError("Cart changes could not be saved in this browser.");
    }
  }, [hydrated, items]);

  const addCourse = useCallback((course: Course) => {
    setItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.kind === "course" && item.course.id === course.id
      );
      if (existingIndex >= 0) {
        // Update existing item in place to keep the latest details without creating duplicates
        const updated = [...current];
        updated[existingIndex] = { kind: "course", course };
        return updated;
      }
      return [...current, { kind: "course", course }];
    });
  }, []);

  const updateCourse = useCallback((course: Course) => {
    setItems((current) =>
      current.map((item) =>
        item.kind === "course" && item.course.id === course.id
          ? { kind: "course", course }
          : item
      )
    );
  }, []);

  const addInternship = useCallback((internship: Internship) => {
    setItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.kind === "internship" && item.internship.id === internship.id
      );
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = { kind: "internship", internship };
        return updated;
      }
      return [...current, { kind: "internship", internship }];
    });
  }, []);

  const removeCourse = useCallback((id: string) => {
    setItems((current) =>
      current.filter(
        (item) => !(item.kind === "course" && item.course.id === id)
      )
    );
  }, []);

  const removeInternship = useCallback((id: string) => {
    setItems((current) =>
      current.filter(
        (item) =>
          !(item.kind === "internship" && item.internship.id === id)
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      hydrated,
      storageError,
      count: items.length,
      hasCourse: (id) =>
        items.some(
          (item) => item.kind === "course" && item.course.id === id
        ),
      hasInternship: (id) =>
        items.some(
          (item) =>
            item.kind === "internship" && item.internship.id === id
        ),
      addCourse,
      updateCourse,
      addInternship,
      removeCourse,
      removeInternship,
      clearCart,
    }),
    [
      addCourse,
      updateCourse,
      addInternship,
      clearCart,
      hydrated,
      items,
      removeCourse,
      removeInternship,
      storageError,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider.");
  return context;
}
