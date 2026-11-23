import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { Order } from "@/services/orders.service";

/*
 * The order invoice as a PDF document. It only contains the order itself
 * (no navbar, sidebar or footer) and shows the server's numbers as-is.
 * Loaded on demand by DownloadInvoiceButton, so @react-pdf/renderer is not
 * part of the page bundle.
 */

const COMPANY_NAME = "MR International LLC";

const color = {
  text: "#1f2937",
  body: "#374151",
  muted: "#6b7280",
  faint: "#9ca3af",
  border: "#e5e7eb",
  rowBorder: "#f0f2f4",
  surface: "#f9fafb",
  brand: "#995618",
  brandSoft: "#faf5ee",
  red: "#ef4444",
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type Tone = { label: string; background: string; color: string };

// Same labels and colors as OrderStatusBadge / PaymentStatusBadge.
// Order statuses use "cancelled" (two Ls); payment statuses use "canceled".
const orderTones: Record<string, Tone> = {
  pending: { label: "Awaiting payment", background: "#f1f5f9", color: "#64748b" },
  processing: { label: "Processing", background: "#fff4e5", color: "#e58200" },
  completed: { label: "Completed", background: "#e5f7ed", color: "#16a34a" },
  cancelled: { label: "Cancelled", background: "#fee2e2", color: "#dc2626" },
};

const paymentTones: Record<string, Tone> = {
  paid: { label: "Paid", background: "#e5f7ed", color: "#16a34a" },
  pending: { label: "Unpaid", background: "#fff4e5", color: "#e58200" },
  refunded: { label: "Refunded", background: "#e0f2fe", color: "#0369a1" },
  canceled: { label: "Canceled", background: "#f1f5f9", color: "#64748b" },
  failed: { label: "Failed", background: "#fee2e2", color: "#dc2626" },
};

const neutralTone = { background: "#f1f5f9", color: "#64748b" };
const notPaidTone: Tone = { label: "Not paid", background: "#fff4e5", color: "#e58200" };

function orderTone(status: string): Tone {
  return Object.hasOwn(orderTones, status)
    ? orderTones[status]
    : { label: status || "Unknown", ...neutralTone };
}

function paymentTone(status: string | null | undefined): Tone {
  if (!status) return notPaidTone;
  return Object.hasOwn(paymentTones, status)
    ? paymentTones[status]
    : { label: status, ...neutralTone };
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

// No `lineHeight` anywhere: in react-pdf 4.9 a unitless lineHeight inflates
// line spacing (and, set on the page, overlaps larger text and pushes content
// onto extra pages). The fonts' default line spacing reads fine at 9pt.
const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 64,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: color.body,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: color.brand,
  },
  logo: { width: 76, height: 54, objectFit: "contain" },
  companyName: {
    marginTop: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: color.text,
  },
  companyTagline: { fontSize: 8, color: color.muted },
  headerRight: { alignItems: "flex-end" },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 24,
    letterSpacing: 2,
    color: color.brand,
  },
  orderNumber: {
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: color.text,
  },

  summary: {
    flexDirection: "row",
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 6,
    backgroundColor: color.surface,
  },
  summaryCell: { flex: 1 },
  label: {
    fontSize: 7.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: color.faint,
  },
  summaryValue: {
    marginTop: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: color.text,
  },
  pill: {
    alignSelf: "flex-start",
    marginTop: 3,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 8,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },

  notice: {
    marginTop: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    fontFamily: "Helvetica-Bold",
  },

  parties: { flexDirection: "row", gap: 12, marginTop: 18 },
  card: {
    flex: 1,
    gap: 2.5,
    padding: 12,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 6,
  },
  cardTitle: {
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: color.text,
  },
  strong: { fontFamily: "Helvetica-Bold", color: color.text },
  mutedText: { color: color.muted },
  emptyText: { color: color.faint },
  kv: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  kvValue: { flexShrink: 1, textAlign: "right", color: color.text },
  tokenRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 1 },
  token: { fontSize: 8, color: color.text },

  table: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 6,
  },
  tableTitle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: color.text,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  tableHead: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: color.surface,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: color.muted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.rowBorder,
  },
  rowLast: { borderBottomWidth: 0 },
  colIndex: { width: 22 },
  colProduct: { flex: 1, paddingRight: 10 },
  colQty: { width: 50, textAlign: "center" },
  colUnit: { width: 80, textAlign: "right" },
  colTotal: { width: 84, textAlign: "right" },
  itemName: { fontFamily: "Helvetica-Bold", color: color.body },
  itemSku: { marginTop: 1, fontSize: 7.5, color: color.faint },

  bottom: { flexDirection: "row", gap: 16, marginTop: 16 },
  notes: { flex: 1 },
  notesBody: { marginTop: 4, color: color.muted },
  totals: { width: 220, marginLeft: "auto" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    color: color.muted,
  },
  totalValue: { color: color.body },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: color.brandSoft,
  },
  grandTotalLabel: { fontFamily: "Helvetica-Bold", fontSize: 10, color: color.text },
  grandTotalValue: { fontFamily: "Helvetica-Bold", fontSize: 13, color: color.brand },

  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: color.border,
    fontSize: 7.5,
    color: color.faint,
  },
});

function Pill({ tone }: { tone: Tone }) {
  return (
    <Text style={[s.pill, { backgroundColor: tone.background, color: tone.color }]}>
      {tone.label}
    </Text>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.kv}>
      <Text style={s.mutedText}>{label}</Text>
      <Text style={s.kvValue}>{value}</Text>
    </View>
  );
}

/** Long IDs (e.g. Stripe references) wrap between chunks, never with a hyphen. */
function BreakableToken({ value }: { value: string }) {
  const chunks = value.match(/.{1,10}/g) ?? [value];
  return (
    <View style={s.tokenRow}>
      {chunks.map((chunk, index) => (
        <Text key={index} style={s.token}>
          {chunk}
        </Text>
      ))}
    </View>
  );
}

function InvoiceDocument({
  order,
  logoUrl,
}: {
  order: Order;
  logoUrl: string | null;
}) {
  const { address, payment, user } = order;
  const status = orderTone(order.status);
  const paymentStatus = paymentTone(payment?.status);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const cityLine = address
    ? [address.city, address.state, address.postalCode].filter(Boolean).join(", ")
    : "";
  const generatedAt = formatDateTime(new Date().toISOString());

  return (
    <Document
      title={`Invoice ${order.orderNumber}`}
      author={COMPANY_NAME}
      subject={`Invoice for order ${order.orderNumber}`}
      creator={COMPANY_NAME}
      producer={COMPANY_NAME}
    >
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML <img> */}
            {logoUrl && <Image src={logoUrl} style={s.logo} />}
            <Text style={s.companyName}>{COMPANY_NAME}</Text>
            <Text style={s.companyTagline}>Wholesale and Retail</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.title}>INVOICE</Text>
            <Text style={s.orderNumber}>{order.orderNumber}</Text>
          </View>
        </View>

        <View style={s.summary}>
          <View style={s.summaryCell}>
            <Text style={s.label}>Order Date</Text>
            <Text style={s.summaryValue}>{formatDateTime(order.createdAt)}</Text>
          </View>
          <View style={s.summaryCell}>
            <Text style={s.label}>Order Status</Text>
            <Pill tone={status} />
          </View>
          <View style={s.summaryCell}>
            <Text style={s.label}>Payment</Text>
            <Pill tone={paymentStatus} />
          </View>
          <View style={s.summaryCell}>
            <Text style={s.label}>Total Amount</Text>
            <Text style={s.summaryValue}>{currency.format(order.total)}</Text>
          </View>
        </View>

        {order.status === "cancelled" && (
          <Text
            style={[
              s.notice,
              payment?.status === "refunded"
                ? { backgroundColor: "#e0f2fe", color: "#0369a1" }
                : { backgroundColor: "#fee2e2", color: "#dc2626" },
            ]}
          >
            {payment?.status === "refunded"
              ? "This order was cancelled and your payment has been refunded."
              : "This order was cancelled."}
          </Text>
        )}

        <View style={s.parties}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Billed To</Text>
            {user ? (
              <>
                <Text style={s.strong}>{user.name}</Text>
                <Text style={s.mutedText}>{user.email}</Text>
                {user.phoneNumber && (
                  <Text style={s.mutedText}>{user.phoneNumber}</Text>
                )}
              </>
            ) : (
              <Text style={s.emptyText}>No customer details on this order.</Text>
            )}
            {order.customerType && (
              <Text style={[s.mutedText, { marginTop: 4 }]}>
                {capitalize(order.customerType)} customer
              </Text>
            )}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Shipping Address</Text>
            {address ? (
              <>
                {address.addressLine1 && (
                  <Text style={s.strong}>{address.addressLine1}</Text>
                )}
                {address.addressLine2 && (
                  <Text style={s.mutedText}>{address.addressLine2}</Text>
                )}
                {cityLine && <Text style={s.mutedText}>{cityLine}</Text>}
                {address.country && (
                  <Text style={s.mutedText}>{address.country}</Text>
                )}
              </>
            ) : (
              <Text style={s.emptyText}>No shipping address on this order.</Text>
            )}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Payment</Text>
            {payment ? (
              <>
                <KeyValue label="Status" value={paymentStatus.label} />
                <KeyValue label="Amount" value={currency.format(payment.amount)} />
                {payment.paymentMethod && (
                  <KeyValue label="Method" value={capitalize(payment.paymentMethod)} />
                )}
                {payment.paidAt && (
                  <KeyValue label="Paid at" value={formatDateTime(payment.paidAt)} />
                )}
                {payment.transactionId && (
                  <View style={{ marginTop: 2 }}>
                    <Text style={s.mutedText}>Transaction</Text>
                    <BreakableToken value={payment.transactionId} />
                  </View>
                )}
              </>
            ) : (
              <Text style={s.emptyText}>No payment record yet.</Text>
            )}
          </View>
        </View>

        <View style={s.table}>
          <Text style={s.tableTitle}>Order Items ({itemCount})</Text>
          <View style={s.tableHead} fixed>
            <Text style={[s.th, s.colIndex]}>#</Text>
            <Text style={[s.th, s.colProduct]}>Product</Text>
            <Text style={[s.th, s.colQty]}>Qty</Text>
            <Text style={[s.th, s.colUnit]}>Unit Price</Text>
            <Text style={[s.th, s.colTotal]}>Total</Text>
          </View>
          {order.items.map((item, index) => (
            <View
              key={item.id}
              wrap={false}
              style={[s.row, index === order.items.length - 1 ? s.rowLast : {}]}
            >
              <Text style={[s.colIndex, s.mutedText]}>{index + 1}</Text>
              <View style={s.colProduct}>
                <Text style={s.itemName}>{item.name}</Text>
                {item.sku && <Text style={s.itemSku}>SKU: {item.sku}</Text>}
              </View>
              <Text style={s.colQty}>{item.quantity}</Text>
              <Text style={[s.colUnit, s.mutedText]}>
                {currency.format(item.unitPrice)}
              </Text>
              <Text style={[s.colTotal, s.strong]}>{currency.format(item.total)}</Text>
            </View>
          ))}
          {order.items.length === 0 && (
            <Text style={[s.row, s.rowLast, s.emptyText]}>
              No items on this order.
            </Text>
          )}
        </View>

        <View style={s.bottom} wrap={false}>
          {order.notes ? (
            <View style={s.notes}>
              <Text style={s.cardTitle}>Notes</Text>
              <Text style={s.notesBody}>{order.notes}</Text>
            </View>
          ) : null}
          <View style={s.totals}>
            <View style={s.totalRow}>
              <Text>Subtotal</Text>
              <Text style={s.totalValue}>{currency.format(order.subtotal)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text>Shipping</Text>
              <Text style={s.totalValue}>{currency.format(order.shippingFee)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text>Tax</Text>
              <Text style={s.totalValue}>{currency.format(order.tax)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</Text>
              <Text style={{ color: color.red }}>
                -{currency.format(order.discount)}
              </Text>
            </View>
            <View style={s.grandTotal}>
              <Text style={s.grandTotalLabel}>Total Amount</Text>
              <Text style={s.grandTotalValue}>{currency.format(order.total)}</Text>
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>
            Thank you for shopping with {COMPANY_NAME}. · Generated {generatedAt}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

/** Builds the invoice PDF for an order in the browser. */
export async function createInvoicePdf(
  order: Order,
  options: { logoUrl?: string | null } = {},
): Promise<Blob> {
  return pdf(
    <InvoiceDocument order={order} logoUrl={options.logoUrl ?? null} />,
  ).toBlob();
}
