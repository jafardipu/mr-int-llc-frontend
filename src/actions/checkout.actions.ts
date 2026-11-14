"use server";

import { AuthApiError } from "@/actions/auth-request";
import {
  createAddress,
  deleteAddress,
  updateAddress,
  type AddressInput,
} from "@/actions/address.service";
import { syncCartItems } from "@/actions/cart.service";
import { placeOrder, type PlaceOrderInput } from "@/actions/orders.service";
import { validatePromoCode } from "@/actions/promo-codes.service";
import { getMyAddresses, type Address } from "@/services/address.service";
import { getMyCart, type Cart } from "@/services/cart.service";
import { ApiRequestError } from "@/services/api-service";
import type { PromoValidation } from "@/actions/promo-codes.service";
import type { PlacedOrder } from "@/actions/orders.service";

type ActionResult<T> =
  | { status: "success"; message: string; data: T }
  | { status: "error"; message: string; statusCode?: number };

function fail(error: unknown, fallback: string): ActionResult<never> {
  if (error instanceof AuthApiError || error instanceof ApiRequestError) {
    return {
      status: "error",
      message: error.message,
      statusCode: error.status,
    };
  }
  return { status: "error", message: fallback };
}

export async function loadCheckoutCartAction(): Promise<ActionResult<Cart>> {
  try {
    const cart = await getMyCart();
    return { status: "success", message: "Cart fetched successfully", data: cart };
  } catch (error) {
    return fail(error, "Unable to load cart.");
  }
}

export async function syncCheckoutCartAction(
  items: Array<{ productId: string; quantity: number }>,
): Promise<ActionResult<Cart>> {
  try {
    const { cart } = await syncCartItems(items);
    return { status: "success", message: "Cart synced successfully", data: cart };
  } catch (error) {
    return fail(error, "Unable to sync cart.");
  }
}

export async function loadMyAddressesAction(): Promise<ActionResult<Address[]>> {
  try {
    const result = await getMyAddresses({ page: 1, limit: 50 });
    return {
      status: "success",
      message: "Addresses loaded successfully",
      data: result.data,
    };
  } catch (error) {
    return fail(error, "Unable to load addresses.");
  }
}

export async function createAddressAction(
  input: AddressInput,
): Promise<ActionResult<Address>> {
  try {
    const result = await createAddress(input);
    if (!result.address) {
      return { status: "error", message: "Address was created but not returned." };
    }
    return {
      status: "success",
      message: result.message,
      data: result.address,
    };
  } catch (error) {
    return fail(error, "Unable to create address.");
  }
}

export async function updateAddressAction(
  id: string,
  input: AddressInput,
): Promise<ActionResult<Address>> {
  try {
    const result = await updateAddress(id, input);
    if (!result.address) {
      return { status: "error", message: "Address was updated but not returned." };
    }
    return {
      status: "success",
      message: result.message,
      data: result.address,
    };
  } catch (error) {
    return fail(error, "Unable to update address.");
  }
}

export async function deleteAddressAction(
  id: string,
): Promise<ActionResult<null>> {
  try {
    const result = await deleteAddress(id);
    return { status: "success", message: result.message, data: null };
  } catch (error) {
    return fail(error, "Unable to delete address.");
  }
}

export async function validatePromoCodeAction(input: {
  code: string;
  subtotal?: number;
}): Promise<ActionResult<PromoValidation>> {
  try {
    const result = await validatePromoCode(input);
    return {
      status: "success",
      message: result.message,
      data: result.promo,
    };
  } catch (error) {
    return fail(error, "Unable to validate promo code.");
  }
}

export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<ActionResult<PlacedOrder>> {
  try {
    const result = await placeOrder(input);
    return {
      status: "success",
      message: result.message,
      data: result.order,
    };
  } catch (error) {
    return fail(error, "Unable to place order.");
  }
}
