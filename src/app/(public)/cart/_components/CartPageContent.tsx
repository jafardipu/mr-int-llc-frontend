"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  changeQuantity,
  clearCart,
  removeFromCart,
  selectCartItems,
  selectSelectedCount,
  selectSelectedSubtotal,
  setItemSelected,
} from "@/redux/features/cartSlice";
import CartItemsPanel from "./CartItemsPanel";
import CartSummary from "./CartSummary";
import type { CartItem } from "@/data/cart.data";

export default function CartPageContent() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const selectedItemCount = useAppSelector(selectSelectedCount);
  const subtotal = useAppSelector(selectSelectedSubtotal);

  const handleQuantityChange = (id: string, change: number) => {
    dispatch(changeQuantity({ id, change }));
  };

  const handleRemove = (id: string) => {
    dispatch(removeFromCart(id));
  };

  const handleDeleteAll = () => {
    dispatch(clearCart());
  };

  const handleItemChange = (updatedItem: CartItem) => {
    dispatch(
      setItemSelected({ id: updatedItem.id, selected: updatedItem.selected })
    );
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:gap-12">
      <CartItemsPanel
        items={items}
        onDeleteAll={handleDeleteAll}
        onRemove={handleRemove}
        onQuantityChange={handleQuantityChange}
        onItemChange={handleItemChange}
      />
      <CartSummary selectedItemCount={selectedItemCount} subtotal={subtotal} />
    </div>
  );
}
