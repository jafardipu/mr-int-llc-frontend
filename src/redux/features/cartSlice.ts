import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  id: string;
  productId: string;
  image: string;
  imageAlt: string;
  title: string;
  variant: string;
  price: number;
  quantity: number;
  selected: boolean;
  stockCount?: number;
}

export interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<{
        id?: string;
        productId: string;
        title: string;
        price: number;
        image: string;
        imageAlt?: string;
        variant?: string;
        quantity?: number;
        selected?: boolean;
        stockCount?: number;
      }>
    ) => {
      const payload = action.payload;
      const variant = payload.variant || "Standard";
      const id = payload.id || `${payload.productId}-${variant}`;
      const quantityToAdd =
        payload.quantity && payload.quantity > 0 ? payload.quantity : 1;

      const existingItem = state.items.find((item) => item.id === id);

      if (existingItem) {
        const newQty = existingItem.quantity + quantityToAdd;
        existingItem.quantity =
          payload.stockCount !== undefined && payload.stockCount > 0
            ? Math.min(newQty, payload.stockCount)
            : newQty;
        existingItem.selected = true;
      } else {
        state.items.push({
          id,
          productId: payload.productId,
          title: payload.title,
          price: payload.price,
          image: payload.image,
          imageAlt: payload.imageAlt || payload.title,
          variant,
          quantity:
            payload.stockCount !== undefined && payload.stockCount > 0
              ? Math.min(quantityToAdd, payload.stockCount)
              : quantityToAdd,
          selected: payload.selected ?? true,
          stockCount: payload.stockCount,
        });
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    changeQuantity: (
      state,
      action: PayloadAction<{ id: string; change: number }>
    ) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (!item) return;

      const nextQty = item.quantity + action.payload.change;
      if (nextQty <= 0) {
        state.items = state.items.filter((i) => i.id !== action.payload.id);
      } else {
        item.quantity =
          item.stockCount !== undefined && item.stockCount > 0
            ? Math.min(nextQty, item.stockCount)
            : nextQty;
      }
    },

    setQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (!item) return;

      const qty = Math.max(1, action.payload.quantity);
      item.quantity =
        item.stockCount !== undefined && item.stockCount > 0
          ? Math.min(qty, item.stockCount)
          : qty;
    },

    setItemSelected: (
      state,
      action: PayloadAction<{ id: string; selected: boolean }>
    ) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        item.selected = action.payload.selected;
      }
    },

    toggleSelectItem: (state, action: PayloadAction<string>) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) {
        item.selected = !item.selected;
      }
    },

    toggleSelectAll: (state, action: PayloadAction<boolean>) => {
      state.items.forEach((item) => {
        item.selected = action.payload;
      });
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  changeQuantity,
  setQuantity,
  setItemSelected,
  toggleSelectItem,
  toggleSelectAll,
  clearCart,
} = cartSlice.actions;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;

export const selectCartItemsCount = (state: { cart: CartState }) =>
  state.cart.items.length;

export const selectCartTotalQuantity = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);

export const selectCartTotalAmount = (state: { cart: CartState }) =>
  state.cart.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

export const selectSelectedItems = (state: { cart: CartState }) =>
  state.cart.items.filter((item) => item.selected);

export const selectSelectedCount = (state: { cart: CartState }) =>
  state.cart.items
    .filter((item) => item.selected)
    .reduce((count, item) => count + item.quantity, 0);

export const selectSelectedSubtotal = (state: { cart: CartState }) =>
  state.cart.items
    .filter((item) => item.selected)
    .reduce((total, item) => total + item.price * item.quantity, 0);

export default cartSlice.reducer;
