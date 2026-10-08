"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addToCart,
  clearCart,
  getCartItems,
  removeFromCart,
  updateCartItem,
  type CartItem,
} from "@/lib/db/cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const cartItems = await getCartItems();

      setItems(cartItems);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load your cart.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (resourceId: string, quantity = 1) => {
      try {
        setBusy(true);
        setError("");

        await addToCart(resourceId, quantity);

        await refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to add this resource to your cart.";

        setError(message);

        throw new Error(message);
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const changeQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      try {
        setBusy(true);
        setError("");

        await updateCartItem(cartItemId, quantity);

        await refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to update your cart.";

        setError(message);

        throw new Error(message);
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const removeItem = useCallback(
    async (cartItemId: string) => {
      try {
        setBusy(true);
        setError("");

        await removeFromCart(cartItemId);

        await refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to remove the item.";

        setError(message);

        throw new Error(message);
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const emptyCart = useCallback(async () => {
    try {
      setBusy(true);
      setError("");

      await clearCart();

      setItems([]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to clear your cart.";

      setError(message);

      throw new Error(message);
    } finally {
      setBusy(false);
    }
  }, []);

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          Number(item.resource.price) * item.quantity,
        0,
      ),
    [items],
  );

  return {
    items,
    loading,
    busy,
    error,
    itemCount,
    subtotal,
    refresh,
    addItem,
    changeQuantity,
    removeItem,
    emptyCart,
  };
}