export interface CartItem {
  id: string;
  productId?: string;
  image: string;
  imageAlt: string;
  title: string;
  variant: string;
  price: number;
  quantity: number;
  selected: boolean;
  stockCount?: number;
}

export const initialCartItems: CartItem[] = [
  {
    id: "mono-florist-1",
    productId: "mono-florist-1",
    image: "/image/product/camera.jpg",
    imageAlt: "KIXY Mono Florist product",
    title: "KIXY Mono Florist",
    variant: "Sage/Lemon",
    price: 48.5,
    quantity: 1,
    selected: true,
  },
  {
    id: "mono-florist-2",
    productId: "mono-florist-2",
    image: "/image/product/camera.jpg",
    imageAlt: "KIXY Mono Florist product",
    title: "KIXY Mono Florist",
    variant: "Sage/Lemon",
    price: 48.5,
    quantity: 1,
    selected: true,
  },
  {
    id: "mono-florist-3",
    productId: "mono-florist-3",
    image: "/image/product/camera.jpg",
    imageAlt: "KIXY Mono Florist product",
    title: "KIXY Mono Florist",
    variant: "Sage/Lemon",
    price: 48.5,
    quantity: 1,
    selected: false,
  },
  {
    id: "mono-florist-4",
    productId: "mono-florist-4",
    image: "/image/product/camera.jpg",
    imageAlt: "KIXY Mono Florist product",
    title: "KIXY Mono Florist",
    variant: "Sage/Lemon",
    price: 48.5,
    quantity: 1,
    selected: false,
  },
];
