import { NextResponse } from "next/server";

// In-memory orders storage for the server session
let activeOrders: any[] = [
  {
    id: "po-lum-init-104",
    po_number: "PO-LUM-2026-104",
    date: "2026-11-20",
    godown: "KANPUR NAGAR",
    item_code: "MPO010014",
    item_name: "PCC POLE 8.5 MTR 180 KG",
    unit: "PCS",
    qty: 82,
    lead_time_days: 150,
    expected_delivery_date: "2027-04-19",
    urgency: "HIGH",
    status: "IN_TRANSIT",
  },
  {
    id: "po-lum-init-108",
    po_number: "PO-LUM-2026-108",
    date: "2026-11-21",
    godown: "KANPUR DEHAT",
    item_code: "MNB010174",
    item_name: "G.I. NUTS & BOLTS (M16X65 MM) WITH WASHER",
    unit: "MT",
    qty: 1.5,
    lead_time_days: 90,
    expected_delivery_date: "2027-02-19",
    urgency: "CRITICAL",
    status: "IN_TRANSIT",
  },
  {
    id: "po-lum-init-112",
    po_number: "PO-LUM-2026-112",
    date: "2026-11-21",
    godown: "KANPUR ETAWAH",
    item_code: "MCO010007",
    item_name: "WEDGE CONNECTORS / PG CLAMPS",
    unit: "NOS",
    qty: 500,
    lead_time_days: 60,
    expected_delivery_date: "2027-01-20",
    urgency: "NORMAL",
    status: "IN_TRANSIT",
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    orders: activeOrders,
    count: activeOrders.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const now = new Date();

    // Check if this is a BOM Kit Batch Order
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const kitGodown = (body.godown || "KANPUR DEHAT").toUpperCase();
      const kitPoNumber = body.po_number || `PO-KIT-2026-${Math.floor(100 + Math.random() * 900)}`;

      const createdOrders = body.items.map((it: any, idx: number) => {
        const ltDays = Number(it.lead_time_days) || 30;
        const deliveryDate = new Date(now.getTime() + ltDays * 24 * 60 * 60 * 1000);

        return {
          id: `po-kit-${Date.now()}-${idx}`,
          po_number: kitPoNumber,
          date: now.toISOString().split("T")[0],
          godown: (it.godown || kitGodown).toUpperCase(),
          item_code: it.item_code,
          item_name: it.item_name || it.item_code,
          unit: it.unit || "UNITS",
          qty: Number(it.qty),
          lead_time_days: ltDays,
          expected_delivery_date: deliveryDate.toISOString().split("T")[0],
          urgency: it.urgency || "HIGH (Synchronized BOM Kit)",
          status: "IN_TRANSIT",
        };
      });

      // Add all to activeOrders
      createdOrders.forEach((o: any) => activeOrders.unshift(o));

      return NextResponse.json(
        {
          success: true,
          po_number: kitPoNumber,
          message: `Synchronized BOM Kit Purchase Order ${kitPoNumber} created with ${createdOrders.length} line items.`,
          orders: createdOrders,
        },
        { status: 201 }
      );
    }

    // Single item order fallback
    const { godown, item_code, item_name, unit, qty, lead_time_days, urgency } = body;

    if (!godown || !item_code || !qty || qty <= 0) {
      return NextResponse.json(
        { success: false, error: "Missing required order parameters (godown, item_code, qty > 0)" },
        { status: 400 }
      );
    }

    const ltDays = Number(lead_time_days) || 30;
    const deliveryDate = new Date(now.getTime() + ltDays * 24 * 60 * 60 * 1000);
    const poNumber = body.po_number || `PO-LUM-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder = {
      id: `po-${Date.now()}`,
      po_number: poNumber,
      date: now.toISOString().split("T")[0],
      godown: godown.toUpperCase(),
      item_code,
      item_name: item_name || item_code,
      unit: unit || "UNITS",
      qty: Number(qty),
      lead_time_days: ltDays,
      expected_delivery_date: deliveryDate.toISOString().split("T")[0],
      urgency: urgency || "HIGH",
      status: "IN_TRANSIT",
    };

    activeOrders.unshift(newOrder);

    return NextResponse.json(
      {
        success: true,
        po_number: poNumber,
        message: `Purchase Order ${poNumber} generated successfully.`,
        order: newOrder,
        orders: [newOrder],
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process site order." },
      { status: 500 }
    );
  }
}
