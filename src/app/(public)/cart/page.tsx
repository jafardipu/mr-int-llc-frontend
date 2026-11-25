import { Suspense } from "react";
import Container from "@/components/container/Container";
import { getStorePrices } from "@/services/contents.service";
import CartPageContent from "./_components/CartPageContent";

export const metadata = {
  title: "Cart",
  description: "Review your selected products and order summary.",
};

export default function CartPage() {
  return (
    <Container className="page-padding">
      <Suspense fallback={<CartPageContent prices={null} />}>
        <CartWithPrices />
      </Suspense>
    </Container>
  );
}

async function CartWithPrices() {
  // Refreshed about every minute; the admin can change these at any time.
  const prices = await getStorePrices().catch(() => null);
  return (
    <CartPageContent
      prices={
        prices
          ? { shippingFee: prices.shippingFee, taxRate: prices.taxRate }
          : null
      }
    />
  );
}
