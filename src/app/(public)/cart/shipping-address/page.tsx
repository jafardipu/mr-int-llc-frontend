import Container from "@/components/container/Container";
import CheckoutFlow from "./_components/CheckoutFlow";

export const metadata = {
  title: "Checkout",
  description: "Choose a shipping address and place your order.",
};

export default function ShippingAddressPage() {
  return (
    <Container className="page-padding">
      <main className="mx-auto w-full">
        <CheckoutFlow />
      </main>
    </Container>
  );
}
