# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Package manager is **pnpm** (`packageManager: pnpm@11.5.2`).

```bash
pnpm dev                  # next dev (Turbopack)
pnpm build                # production build — also the best full type/route check
pnpm start                # serve the production build
pnpm lint                 # eslint (flat config, next core-web-vitals + typescript)
pnpm lint src/path/file.tsx   # lint a single file
pnpm exec tsc             # type-check only (tsconfig has noEmit)
```

There is no test framework configured.

## Next.js 16 specifics used here

This is Next.js 16.4 / React 19.3. Bundled docs live in `node_modules/next/dist/docs/` — read them before using any Next API (see AGENTS.md). Things in this repo that differ from older Next:

- **`src/proxy.ts`** replaces `middleware.ts` (exports `proxy` + `config.matcher`).
- **`cacheComponents: true`** in `next.config.ts`. Anything that reads `cookies()`, `params`, or `searchParams` must render inside a `<Suspense>` boundary. The convention is a sync page that wraps an async inner component in `<Suspense>` (e.g. `src/app/(protected)/user/orders/[order-id]/pay/page.tsx`, `src/app/(protected)/user/layout.tsx`). Relevant docs: `01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`, `01-app/02-guides/authentication-with-cache-components.md`.
- `params` / `searchParams` are Promises; global `LayoutProps<"/">` / `PageProps` types are available.
- `partialPrefetching: true` and `experimental.agentFeedback: true` are on.
- `/` redirects to `/home` (in `next.config.ts`).
- Remote images are allowed only from the S3 bucket host and `placehold.co` (`images.remotePatterns`) — add new hosts there.
- Tailwind v4 runs through a Turbopack rule scoped to `src/app/globals.css` only; there is no `tailwind.config`.

## Environment

- `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_BASE_URL` — backend REST base URL (includes `/api/v1`). The client axios instance falls back to `http://localhost:5000/api/v1`.
- `BASE_URL` — optional server-only override, preferred by server-side fetches (`src/config/index.ts`).
- No Stripe key is needed: payments use Stripe Checkout (a Stripe-hosted page). The **backend's** `CLIENT_URL` must equal this app's origin, because Stripe returns to `CLIENT_URL/checkout/success` and `CLIENT_URL/checkout/cancel`. Those two routes must keep those exact paths.

## Architecture

A Next.js frontend for an **external REST backend** (no route handlers in this repo). It is a storefront with retail and wholesale pricing, plus a "3PL prep service" request flow.

### Route groups (`src/app`)

- `(public)`: storefront (home, products, categories, shop-by-brand, cart, checkout at `cart/shipping-address`, the Stripe return pages `checkout/success` and `checkout/cancel`, `3pl-prep-service`) and CMS pages (about, FAQ, policies, terms).
- `(auth)`: login, sign-up, verify-otp, forgot-password, reset-password.
- `(protected)/user/*`: the account area (dashboard, orders + pay, favorites, profile, change-password, pl-services).
- Route-private code is colocated in `_components/` and `_data/` folders.
- Root layout provider order: `ReactQueryProvider` → `ReduxProvider` → `WishlistProvider`, plus the sonner `Toaster`. Each route group's layout adds `Navbar` and `Footer`.

### Auth

- Access and refresh tokens are **httpOnly cookies** (`accessToken`, `refreshToken`; see `src/lib/auth-cookies.ts`). They are set and cleared only by the server actions in `src/actions/auth.actions.ts`.
- Auth forms use `useActionState` with those actions, which return `AuthActionState`.
- The OTP flow (signup and password reset) keeps short-lived `otp-session-token`, `signup-email` and `auth-flow` (`"signup" | "reset"`) cookies between steps.
- `src/proxy.ts` sends unauthenticated `/user/*` requests to `/login?callbackUrl=…` and sends logged-in users away from the auth pages to `/user/dashboard`. It only checks that the cookie exists, not that the token is valid. `refreshAccessToken` exists but nothing calls it yet.
- Because of that, sending someone to `/login` while a stale `accessToken` cookie exists bounces them straight back. On a 401, a server component renders `src/app/(protected)/user/_components/SessionExpired.tsx`, which calls `logoutAction` to clear the cookies and then redirects to login.
- The roles are `retail`, `wholesale`, `admin` and `supper_admin` (the backend spells it that way). Wishlist and checkout are only for retail and wholesale users. Product requests send the user's token, so the backend returns role-specific `displayPrice` / `displayMinQty`.

### Data access: three layers

Backend envelope: `{ success, message, data }`; paginated lists are `data: { data: T[], meta: { page, limit, total } }`. Responses are treated as `unknown` and validated with hand-written type guards. Zod is not used for this.

1. **Server reads: `src/services/*.service.ts`** (`import "server-only"`).
   - Use `apiGet()` from `src/services/api-service.ts`. It wraps `fetch` with a default `revalidate: 300` and optional tags. Authenticated calls pass `cache: "no-store"` and read the token from `cookies()`.
   - Parse the response with `parseApiPage` / `parseApiItem` / `collectPages` from `src/services/api-response.ts`.
   - Failures throw `ApiRequestError(message, status)`.
   - `getMyProfile` is wrapped in React `cache()` so each request fetches the profile once.
2. **Server mutations: `src/actions/`**.
   - `*.service.ts` (server-only) calls `authRequest()` from `src/actions/auth-request.ts`, which always uses `no-store` and throws `AuthApiError`.
   - `*.actions.ts` (`"use server"`) wraps those calls and **returns** `{ status: "success", message, data }` or `{ status: "error", message, statusCode? }` instead of throwing.
   - Client components check `statusCode === 401` and redirect to login.
   - Several file names exist in both folders (cart, address, orders, wishlist, users): `services/` holds the reads and `actions/` holds the writes.
3. **Client fetches: `src/lib/apiClient.ts`** (axios). Only the prep service uses it (`src/services/prepService.api.ts` + `src/hooks/usePrepService.ts` with TanStack Query). The token cookie is httpOnly, so the request interceptor gets the token from the `getAccessTokenAction` server action.

`src/lib/catalog-api.ts` maps the API `Product` into the UI `CatalogProduct` / `TProducts` shape (`src/types/products.ts`) that `ProductCard` uses.

The RTK Query `baseApi` / `authApi` in `src/redux/api/` is legacy and its hooks are not used. Use the services/actions pattern for new data access.

### Client state, cart and checkout

- Redux store (`src/redux/store.ts`):
  - `cart` slice is persisted to localStorage by redux-persist (key `mr-cart`, `items` only).
  - `auth` slice is effectively only used to dispatch `logout()`.
- The cart stays **client-only until checkout**. `CheckoutFlow` (`src/app/(public)/cart/shipping-address/_components/`) runs these steps:
  1. Syncs the selected local items to the server cart (`syncCheckoutCartAction`).
  2. Loads `GET /orders/checkout-summary` and the addresses.
  3. Applies a promo code by re-requesting the summary with `?promoCode=`. A 400 keeps the previous summary.
  4. On click, calls `placeOrderAction` (`POST /orders/checkout` with only `addressId`, `notes` and `promoCode`). This creates a `pending` order and empties the server cart; the checked-out lines are then removed from the local cart.
  5. Calls `createPaymentAction(orderId)` and does `window.location.assign(checkoutUrl)` to Stripe. If that fails, it goes to the order page instead.
- **Never compute or send prices.** Show the summary and order numbers from the server. The cart page subtotal is only an estimate; shipping, tax and promo codes are priced at checkout.
- `/checkout/success` (server component) calls the public `GET /payments/confirm-payment?sessionId=`. It shows success when `status === "paid"`, and "being confirmed" otherwise (a backend webhook finishes it). `/checkout/cancel` explains that the order is saved but unpaid.
- Pending orders show `PayNowButton` (reuses the order's Stripe session) and `CancelOrderButton` (`PATCH /orders/:id/cancel`, after a confirmation dialog). `orderNeedsPayment()` is true only for `pending` orders.
- Never call `POST /orders/checkout` or `POST /payments/create` from an effect (StrictMode runs effects twice). Only call them from user actions.
- Status spelling: an order's status is `cancelled`, but a payment's status is `canceled`. A cancelled order that had been paid shows its payment as `refunded`.
- `WishlistProvider` (`src/components/wishlist/`) loads a `productId → wishlistItemId` index once on mount through a server action. It shows a login modal to anonymous users.

### Placeholder data still in use

`src/data/*` and some `_data/` files are static mocks. They currently back `RelatedProducts` and the filter constants in `ProductFilterSidebar`. (The user dashboard uses `GET /orders/my-dashboard`.) Check before assuming a screen uses the API.

### UI conventions

- shadcn/ui with the **`base-nova` style, built on `@base-ui/react` (not Radix)**. Components are in `src/components/ui`. Add new ones with `pnpm dlx shadcn add <name>`. Icons come from Lucide; `cn()` is in `src/lib/utils.ts`.
- Brand tokens (`primary-color`, `secondary-color`, `primary-gray`) and the `.page-padding` utility are in `src/app/globals.css`. Many components also use hardcoded hex colors.
- Forms use react-hook-form (zod only in contact-us). Toasts use `sonner`.
- CMS HTML from the backend must be rendered through `CmsContent`, which sanitizes it with `src/lib/sanitize-html.ts`.
- Path alias: `@/*` → `src/*`.
