"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadWishlistIndexAction } from "@/actions/wishlist.actions";

type WishlistContextValue = {
  ready: boolean;
  isLoggedIn: boolean;
  canUse: boolean;
  items: Record<string, string>;
  remember: (productId: string, wishlistItemId: string) => void;
  forget: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canUse, setCanUse] = useState(true);
  const [items, setItems] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    loadWishlistIndexAction().then((result) => {
      if (!active) return;
      setIsLoggedIn(result.isLoggedIn);
      setCanUse(result.canUse);
      setItems(result.items);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ready,
      isLoggedIn,
      canUse,
      items,
      remember: (productId, wishlistItemId) => {
        setItems((current) => ({ ...current, [productId]: wishlistItemId }));
      },
      forget: (productId) => {
        setItems((current) => {
          const next = { ...current };
          delete next[productId];
          return next;
        });
      },
    }),
    [ready, isLoggedIn, canUse, items],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
