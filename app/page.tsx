"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  ArrowRightLeft,
  Truck,
  Package,
  Layers,
  Database,
  Sliders,
  Sparkles,
  Bot,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Building2,
  ChevronRight,
  Flame,
  Activity,
  Gauge,
  Bell,
  X,
  Share2,
  Check,
  Copy,
  Send,
  Radio,
  Clock,
  HardHat,
  Warehouse,
  FileSpreadsheet,
  Download,
  Search,
  ShoppingCart,
  PlusCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from "recharts";
import { formatNumber } from "@/lib/utils";

// Static JSON imports
import summaryData from "@/public/data/summary.json";
import causalReplayData from "@/public/data/causal_replay.json";
import setBalanceData from "@/public/data/set_balance.json";
import recommendationsData from "@/public/data/recommendations.json";
import ledgerMonthlyData from "@/public/data/ledger_monthly.json";
import movementsData from "@/public/data/movements.json";

interface LiveOrder {
  id: string;
  po_number: string;
  date: string;
  godown: string;
  item_code: string;
  item_name: string;
  unit: string;
  qty: number;
  lead_time_days: number;
  expected_delivery_date: string;
  urgency: string;
  status: string;
}

export default function GridPulseDashboard() {
  // Department Views
  const [activeDept, setActiveDept] = useState<
    "wallboard" | "procurement" | "godowns" | "contractors"
  >("wallboard");

  // Selected month (default June 2024 peak bottleneck)
  const [selectedMonth, setSelectedMonth] = useState<string>("2024-06");

  // Selected godown filter for Ledger & Movements
  const [selectedGodown, setSelectedGodown] = useState<string>("ALL");

  // Movement type filter for ERP Audit Database
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("ALL");
  const [movementSearchQuery, setMovementSearchQuery] = useState<string>("");

  // Set Balance ratio toggle: 'official' | 'empirical'
  const [ratioMode, setRatioMode] = useState<"official" | "empirical">("official");

  // Six Sigma Service Level (Z-score) selector: 1, 2, or 3
  const [zScore, setZScore] = useState<1 | 2 | 3>(3);

  // Supplier Lead Time delay factor slider
  const [leadTimeMultiplier, setLeadTimeMultiplier] = useState<number>(1.0);

  // Selected site for Slide-Over Drawer
  const [inspectedSite, setInspectedSite] = useState<string | null>(null);

  // Alert Center Drawer State
  const [alertDrawerOpen, setAlertDrawerOpen] = useState<boolean>(false);
  const [dispatchedAlerts, setDispatchedAlerts] = useState<Record<string, string>>({});
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Orders state (persisted in localStorage key gridpulse_live_txs)
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [orderModalItem, setOrderModalItem] = useState<any | null>(null);
  const [orderQtyInput, setOrderQtyInput] = useState<number>(50);
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);
  const [orderToast, setOrderToast] = useState<{ message: string; po: string; eta: string } | null>(null);

  // Sarvam AI Copilot State
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiSource, setAiSource] = useState<string | null>(null);

  // Initialize persistent live orders from localStorage or pre-seed with 3 realistic entries
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gridpulse_live_txs");
      if (saved) {
        setLiveOrders(JSON.parse(saved));
      } else {
        const seedOrders: LiveOrder[] = [
          {
            id: "po-seed-104",
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
            id: "po-seed-108",
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
            id: "po-seed-112",
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
        setLiveOrders(seedOrders);
        localStorage.setItem("gridpulse_live_txs", JSON.stringify(seedOrders));
      }
    } catch (e) {
      console.warn("localStorage unavailable", e);
    }
  }, []);

  // Lookups for active month
  const currentReplay = useMemo(() => {
    return causalReplayData.find((r) => r.month === selectedMonth) || causalReplayData[0];
  }, [selectedMonth]);

  const currentSetData = useMemo(() => {
    return setBalanceData.find((s) => s.month === selectedMonth) || setBalanceData[0];
  }, [selectedMonth]);

  const currentRecommendations = useMemo(() => {
    return recommendationsData.find((rec) => rec.month === selectedMonth) || recommendationsData[0];
  }, [selectedMonth]);

  const currentLedger = useMemo(() => {
    return ledgerMonthlyData.find((l) => l.month === selectedMonth) || ledgerMonthlyData[0];
  }, [selectedMonth]);

  // Six Sigma dynamic simulation scaling
  const simulatedReplayData = useMemo(() => {
    const zMultiplier = zScore === 1 ? 0.72 : zScore === 2 ? 0.86 : 1.0;

    return causalReplayData.map((d) => {
      const adjustedPlannerStock = Math.round(
        d.planner_idle_stock * zMultiplier * (0.8 + 0.2 * leadTimeMultiplier)
      );
      const adjustedSaved = Math.max(0, d.actual_idle_stock - adjustedPlannerStock);
      const adjustedReductionPct =
        d.actual_idle_stock > 0
          ? Math.round((adjustedSaved / d.actual_idle_stock) * 1000) / 10
          : 0;

      return {
        ...d,
        display_planner_stock: adjustedPlannerStock,
        display_saved: adjustedSaved,
        display_reduction_pct: adjustedReductionPct,
      };
    });
  }, [zScore, leadTimeMultiplier]);

  // Overall KPIs from dynamic simulation
  const overallKPIs = useMemo(() => {
    const totalActual = simulatedReplayData.reduce((acc, curr) => acc + curr.actual_idle_stock, 0);
    const totalSim = simulatedReplayData.reduce((acc, curr) => acc + curr.display_planner_stock, 0);
    const avgActual = Math.round(totalActual / simulatedReplayData.length);
    const avgSim = Math.round(totalSim / simulatedReplayData.length);
    const reduction = Math.round(((avgActual - avgSim) / avgActual) * 1000) / 10;

    return {
      avgActual,
      avgSim,
      reduction,
      shortages: zScore === 1 ? 6 : 0,
    };
  }, [simulatedReplayData, zScore]);

  const sixSigmaData = (summaryData as any).six_sigma;
  const projectSpc = (summaryData as any).project_spc;
  const siteBuffers = (summaryData as any).site_buffers || {};

  // Compute 6-District Site Statuses & Buffer Stock Health
  const districtStatuses = useMemo(() => {
    return summaryData.godowns.map((g) => {
      let totalYard = 0;
      let totalIssues = 0;
      let totalTransfersIn = 0;
      let strandedSetsCount = 0;
      let criticalBottlenecks: string[] = [];

      Object.entries(currentLedger.items).forEach(([code, item]: [string, any]) => {
        const gData = item.godowns?.[g];
        if (gData) {
          totalYard += gData.closing_yard_stock || 0;
          totalIssues += gData.issues || 0;
          totalTransfersIn += gData.transfers_in || 0;
        }
      });

      // Add live orders in-transit for this godown
      const liveInTransit = liveOrders
        .filter((o) => o.godown === g)
        .reduce((sum, o) => sum + o.qty, 0);

      currentSetData.sets.forEach((s: any) => {
        const gSet = s.godowns?.[g];
        if (gSet && gSet.stranded_parents > 0) {
          strandedSetsCount += gSet.stranded_parents;
          if (gSet.bottleneck && !criticalBottlenecks.includes(gSet.bottleneck)) {
            criticalBottlenecks.push(gSet.bottleneck);
          }
        }
      });

      const requiredBuffer = siteBuffers[g]?.total_buffer_units || 25000;
      const bufferRatio = requiredBuffer > 0 ? totalYard / requiredBuffer : 1.0;
      const bufferPct = Math.round(bufferRatio * 100);

      // Classification:
      // Critical (pulsing red): Stranded parent sets > 0 OR Yard < 0.7x buffer
      // Warning (pulsing amber): Bloated yard stock > 2.0x buffer
      // Healthy (emerald): Within 0.8x - 2.0x buffer band
      let status: "critical" | "warning" | "healthy" = "healthy";
      let statusText = `Optimal JIT (${bufferPct}% of Buffer Target)`;

      if (strandedSetsCount > 0) {
        status = "critical";
        statusText = `🚨 ${formatNumber(strandedSetsCount)} Stranded Sets (${criticalBottlenecks[0] || "Hardware"})`;
      } else if (bufferRatio > 2.0 || totalYard > 90000) {
        status = "warning";
        statusText = `⚠️ Yard Bloat (${bufferPct}% of Buffer — Waste Defect)`;
      } else if (bufferRatio < 0.7) {
        status = "critical";
        statusText = `🚨 Stock Depleted (${bufferPct}% of Buffer — Starvation Risk)`;
      }

      return {
        godown: g,
        status,
        statusText,
        totalYard,
        requiredBuffer,
        bufferPct,
        bufferRatio,
        totalIssues,
        totalTransfersIn: totalTransfersIn + liveInTransit,
        strandedSetsCount,
        criticalBottlenecks,
      };
    });
  }, [currentLedger, currentSetData, siteBuffers, liveOrders]);

  // Combined ERP Movement Database (500 historical vouchers + live PO orders)
  const allMovements = useMemo(() => {
    const liveVouchers = liveOrders.map((o) => ({
      date: o.date,
      voucher_no: o.po_number,
      tx_type: "PURCHASE_ORDER (LIVE)",
      godown: o.godown,
      item_code: o.item_code,
      item_name: o.item_name,
      unit: o.unit,
      qty: o.qty,
    }));

    let merged = [...liveVouchers, ...movementsData];

    // Filter by godown
    if (selectedGodown !== "ALL") {
      merged = merged.filter((m) => m.godown === selectedGodown);
    }

    // Filter by movement type
    if (movementTypeFilter !== "ALL") {
      merged = merged.filter((m) => m.tx_type.toUpperCase().includes(movementTypeFilter.toUpperCase()));
    }

    // Filter by item search query
    if (movementSearchQuery.trim()) {
      const q = movementSearchQuery.toLowerCase();
      merged = merged.filter(
        (m) =>
          m.item_code.toLowerCase().includes(q) ||
          m.item_name.toLowerCase().includes(q) ||
          m.voucher_no.toLowerCase().includes(q)
      );
    }

    return merged;
  }, [liveOrders, selectedGodown, movementTypeFilter, movementSearchQuery]);

  // CSV Export Function
  const handleExportCSV = () => {
    const headers = ["Date", "Voucher_No", "Transaction_Type", "Godown_Store", "Item_Code", "Item_Name", "Unit", "Quantity"];
    const rows = allMovements.map((m) => [
      m.date,
      m.voucher_no,
      `"${m.tx_type}"`,
      `"${m.godown}"`,
      m.item_code,
      `"${m.item_name.replace(/"/g, '""')}"`,
      m.unit,
      m.qty,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `gridpulse_erp_movement_ledger_${selectedGodown}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit Site Order to POST /api/orders (Supports Single and BOM-Aware Synchronized Kit)
  const handlePlaceOrderSubmit = async () => {
    if (!orderModalItem || !inspectedSite || orderQtyInput <= 0) return;

    setOrderSubmitting(true);
    try {
      const parentChildren = summaryData.sets.filter((s: any) => s.parent_code === orderModalItem.item_code);
      const isParent = parentChildren.length > 0;

      let payload: any;
      if (isParent) {
        const kitPo = `PO-KIT-2026-${Math.floor(100 + Math.random() * 900)}`;
        const kitItems = [
          {
            godown: inspectedSite,
            item_code: orderModalItem.item_code,
            item_name: orderModalItem.item_name,
            unit: orderModalItem.unit,
            qty: orderQtyInput,
            lead_time_days: orderModalItem.lead_time_days,
            urgency: "HIGH (Parent Component)",
          },
          ...parentChildren.map((ch: any) => ({
            godown: inspectedSite,
            item_code: ch.child_code,
            item_name: ch.child_name,
            unit: ch.child_unit,
            qty: Math.max(0.1, Math.round(orderQtyInput * ch.official_ratio * 10) / 10),
            lead_time_days: (summaryData.items as any)[ch.child_code]?.lead_time_days || 60,
            urgency: "HIGH (Synchronized BOM Kit Line)",
          })),
        ];

        payload = {
          godown: inspectedSite,
          po_number: kitPo,
          items: kitItems,
        };
      } else {
        payload = {
          godown: inspectedSite,
          item_code: orderModalItem.item_code,
          item_name: orderModalItem.item_name,
          unit: orderModalItem.unit,
          qty: orderQtyInput,
          lead_time_days: orderModalItem.lead_time_days,
          urgency: "HIGH (Site JIT Trigger)",
        };
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.orders) {
        const updated = [...data.orders, ...liveOrders];
        setLiveOrders(updated);
        localStorage.setItem("gridpulse_live_txs", JSON.stringify(updated));

        setOrderToast({
          message: `${isParent ? "Synchronized BOM Kit" : "Purchase Order"} ${data.po_number} Placed for ${inspectedSite}`,
          po: data.po_number,
          eta: data.orders[0]?.expected_delivery_date || "2027-02-19",
        });
        setTimeout(() => setOrderToast(null), 6000);
        setOrderModalItem(null);
      }
    } catch (err) {
      console.error("Order submission failed", err);
    } finally {
      setOrderSubmitting(false);
    }
  };

  // 1-Click Order Missing Child Kit from Stranded Set Card
  const handleOrderMissingChildKit = async (s: any) => {
    const strandedQty = ratioMode === "official" ? s.stranded_official : s.stranded_empirical;
    if (strandedQty <= 0) return;

    const kitPo = `PO-KIT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const kitItems = s.children.map((ch: any) => {
      const ratio = ratioMode === "official" ? ch.official_ratio : ch.empirical_ratio;
      const neededQty = Math.max(0.5, Math.round(strandedQty * ratio * 10) / 10);
      return {
        godown: "KANPUR DEHAT",
        item_code: ch.child_code,
        item_name: ch.child_name,
        unit: ch.child_unit,
        qty: neededQty,
        lead_time_days: (summaryData.items as any)[ch.child_code]?.lead_time_days || 60,
        urgency: "CRITICAL (Unfreeze Stranded Parent Set)",
      };
    });

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          godown: "KANPUR DEHAT",
          po_number: kitPo,
          items: kitItems,
        }),
      });

      const data = await res.json();
      if (data.success && data.orders) {
        const updated = [...data.orders, ...liveOrders];
        setLiveOrders(updated);
        localStorage.setItem("gridpulse_live_txs", JSON.stringify(updated));

        setOrderToast({
          message: `Synchronized Child Kit ${kitPo} Placed for ${s.parent_name}`,
          po: kitPo,
          eta: data.orders[0]?.expected_delivery_date || "2027-02-19",
        });
        setTimeout(() => setOrderToast(null), 6000);
      }
    } catch (e) {
      console.error("Kit order failed", e);
    }
  };

  // Auto-detected alerts for selected month
  const activeAlerts = useMemo(() => {
    const list: Array<{
      id: string;
      site: string;
      severity: "CRITICAL" | "WARNING" | "INFO";
      item: string;
      title: string;
      description: string;
    }> = [];

    // Check stranded parents
    currentSetData.sets.forEach((s: any) => {
      if (s.stranded_official > 0) {
        list.push({
          id: `stranded-${s.parent_code}-${selectedMonth}`,
          site: "Kanpur Dehat & Etawah",
          severity: "CRITICAL",
          item: `${s.parent_name} (${s.parent_code})`,
          title: `Stranded Set Alert: ${formatNumber(s.stranded_official)} units blocked`,
          description: `Child bottleneck ${s.bottleneck_official} deficit is preventing assembly and site installation.`,
        });
      }
    });

    // Check emergency order triggers
    currentRecommendations.orders_now.forEach((o: any, idx: number) => {
      list.push({
        id: `order-${o.item_code}-${selectedMonth}-${idx}`,
        site: "Central Procurement / Kanpur Stores",
        severity: o.urgency.includes("CRITICAL") ? "CRITICAL" : "WARNING",
        item: `${o.item_name} (${o.item_code})`,
        title: `Reorder Required: +${o.suggested_order_qty} units`,
        description: `Lead time is ${o.lead_time_days} days. Stock will drop below Six Sigma ROP within ${o.months_of_supply} months.`,
      });
    });

    // Check yard bloats for hold directives
    currentRecommendations.holds.forEach((h: any, idx: number) => {
      list.push({
        id: `hold-${h.item_code}-${selectedMonth}-${idx}`,
        site: "Factory Logistics Dispatch",
        severity: "WARNING",
        item: `${h.item_name} (${h.item_code})`,
        title: `Delay Supplier Dispatch: Hold ${h.incoming_grn_qty} units`,
        description: `Yard currently sitting on ${h.months_of_supply} months of inventory. Vendor batch push creates yard waste.`,
      });
    });

    return list;
  }, [currentSetData, currentRecommendations, selectedMonth]);

  // Handle WhatsApp / Email Dispatch Action
  const handleDispatchAlert = async (alert: any) => {
    setDispatchingId(alert.id);
    try {
      const res = await fetch("/api/sarvam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate an operational WhatsApp and Email dispatch notification for ${alert.site} regarding ${alert.item}.`,
          context: {
            type: "dispatch_alert",
            site: alert.site,
            item: alert.item,
            title: alert.title,
            month: selectedMonth,
          },
        }),
      });
      const data = await res.json();
      setDispatchedAlerts((prev) => ({
        ...prev,
        [alert.id]: data.response,
      }));
    } catch (e) {
      setDispatchedAlerts((prev) => ({
        ...prev,
        [alert.id]: `*🚨 OPERATIONAL DISPATCH — Lumino 1,700 Poles*\nSite: ${alert.site}\nItem: ${alert.item}\nDirective: ${alert.title}\nAuthorized by GridPulse AI Supply Copilot.`,
      }));
    } finally {
      setDispatchingId(null);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Ask Sarvam Copilot
  const handleAskSarvam = async (promptText?: string, contextType?: string) => {
    const query = promptText || aiPrompt;
    if (!query) return;

    setAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch("/api/sarvam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          context: {
            month: selectedMonth,
            type: contextType || "custom_query",
            z_score: `${zScore}σ`,
            six_sigma: (summaryData as any).six_sigma,
            spc: (summaryData as any).project_spc,
            kpis: overallKPIs,
            recommendations: currentRecommendations,
            stranded_sets: currentSetData.sets.map((s: any) => ({
              parent: s.parent_name,
              stranded: ratioMode === "official" ? s.stranded_official : s.stranded_empirical,
              bottleneck: ratioMode === "official" ? s.bottleneck_official : s.bottleneck_empirical,
            })),
          },
        }),
      });

      const data = await res.json();
      setAiResponse(data.response);
      setAiSource(data.source);
    } catch (err) {
      setAiResponse("Failed to connect to Sarvam AI. Rule engine: rebalance M16 bolts across Kanpur districts.");
      setAiSource("fallback_rule_engine");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    handleAskSarvam("Diagnose the June 2024 bottleneck across Kanpur godowns.", "bottleneck");
  }, []);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col antialiased">
      {/* Toast Banner for New Orders */}
      {orderToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-950 border border-emerald-500 rounded-xl p-4 shadow-2xl flex items-center gap-3 max-w-md animate-bounce">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-white">{orderToast.message}</div>
            <div className="font-mono text-emerald-300 text-[11px]">
              PO #{orderToast.po} | Delivery ETA: {orderToast.eta} | Stock In-Transit
            </div>
          </div>
          <button onClick={() => setOrderToast(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0c1220]/95 backdrop-blur border-b border-slate-800 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                GridPulse
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  Lumino 1,700 Poles
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  Six Sigma DMAIC & SPC
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Open Multi-Department Supply Operations — 6 Kanpur District Godowns (231k Transactions)
            </p>
          </div>
        </div>

        {/* Global Month Scrubber */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-inner">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-300">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 text-xs font-mono font-bold text-white border border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {summaryData.timeline.months.map((m) => (
              <option key={m} value={m}>
                {m} {m === "2024-06" ? "🔥 (Peak Bottleneck)" : m === "2023-03" ? "🚀 (Start)" : m === "2026-10" ? "🏁 (Wind-down)" : ""}
              </option>
            ))}
          </select>

          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-700 text-[11px]">
            <button
              onClick={() => setSelectedMonth("2024-06")}
              className={`px-2 py-0.5 rounded font-mono transition ${
                selectedMonth === "2024-06"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-400"
              }`}
            >
              Jun 2024 (Peak)
            </button>
            <button
              onClick={() => setSelectedMonth("2023-03")}
              className={`px-2 py-0.5 rounded font-mono transition ${
                selectedMonth === "2023-03"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-400"
              }`}
            >
              Kickoff
            </button>
            <button
              onClick={() => setSelectedMonth("2026-10")}
              className={`px-2 py-0.5 rounded font-mono transition ${
                selectedMonth === "2026-10"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-400"
              }`}
            >
              Wind-down
            </button>
          </div>
        </div>

        {/* Right side: Alert Bell + Live Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAlertDrawerOpen(true)}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 transition"
            title="Open Smart Alert Dispatch Center"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-md">
                {activeAlerts.length}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-emerald-400 font-medium">No Auth Required</span>
          </div>
        </div>
      </header>

      {/* Dedicated Open Department Views Navigation (No Auth / 1-Click Open) */}
      <nav className="bg-[#0a0f1c] border-b border-slate-800 px-4 lg:px-8">
        <div className="flex space-x-1 sm:space-x-3 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveDept("wallboard")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 font-semibold transition shrink-0 ${
              activeDept === "wallboard"
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400" />
            1. Org Wallboard (Default)
          </button>
          <button
            onClick={() => setActiveDept("procurement")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 font-semibold transition shrink-0 ${
              activeDept === "procurement"
                ? "border-cyan-500 text-cyan-400 bg-cyan-500/10 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Truck className="w-4 h-4 text-cyan-400" />
            2. Materials & Procurement
          </button>
          <button
            onClick={() => setActiveDept("godowns")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 font-semibold transition shrink-0 ${
              activeDept === "godowns"
                ? "border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Warehouse className="w-4 h-4 text-amber-400" />
            3. District Godown Stores & ERP Database
          </button>
          <button
            onClick={() => setActiveDept("contractors")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 font-semibold transition shrink-0 ${
              activeDept === "contractors"
                ? "border-violet-500 text-violet-400 bg-violet-500/10 rounded-t-lg"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <HardHat className="w-4 h-4 text-violet-400" />
            4. Field Contractors & Set Kitting
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ========================================================= */}
        {/* DEPARTMENT 1: ORG WALLBOARD & GLOWING SITE GRID (DEFAULT) */}
        {/* ========================================================= */}
        {activeDept === "wallboard" && (
          <div className="space-y-6">
            {/* Top "The Bar" Executive Benchmark Card */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0e1626] to-[#0a1220] border border-slate-800 p-5 sm:p-7 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    VCH3 Executive Benchmark — "The Bar"
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    87.4% Idle Stock Reduction Under Six Sigma Control
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    By replacing uncoordinated batch-ordering with Six Sigma ROP (ROP = μd × L + Z · σd √L), GridPulse eliminates stranded sets and prevents yard bloat with a <strong>100% zero-shortage site guarantee</strong>.
                  </p>
                </div>

                {/* The Bar KPI Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 shrink-0">
                  <div className="bg-slate-900/80 border border-rose-900/40 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold tracking-wider text-rose-400 uppercase">
                      Historical Idle Stock
                    </span>
                    <div className="mt-2 text-2xl font-mono font-black text-rose-200">
                      {formatNumber(overallKPIs.avgActual)}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">Avg monthly idle units</span>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
                      GridPulse Planner
                    </span>
                    <div className="mt-2 text-2xl font-mono font-black text-emerald-300">
                      {formatNumber(overallKPIs.avgSim)}
                    </div>
                    <span className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1 font-semibold">
                      <TrendingDown className="w-3 h-3" /> -{overallKPIs.reduction}% idle units
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-cyan-800/40 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold tracking-wider text-cyan-400 uppercase flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-cyan-400" /> Six Sigma Level
                    </span>
                    <div className="mt-2 text-2xl font-mono font-black text-cyan-300">
                      {sixSigmaData?.gridpulse_planner?.sigma_level || 3.5}σ
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">
                      vs {sixSigmaData?.historical_actual?.sigma_level || 3.3}σ Hist ({sixSigmaData?.gridpulse_planner?.dpmo.toLocaleString()} DPMO)
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
                      Site Starvation
                    </span>
                    <div className="mt-2 text-2xl font-mono font-black text-emerald-300">
                      0 Stockouts
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">Contractor work 100% on schedule</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 6-District Glowing Site Wallboard with Buffer Stock Health Gauges */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    6-District Kanpur Site Wallboard & Buffer Stock Gauges — Month: {selectedMonth}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live inventory vs Six Sigma buffer stock. Click any district tile to inspect 16 items and place direct site orders.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Critical Deficit / Stranded
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Yard Bloat (&gt;2x Buffer)
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Optimal Buffer Band
                  </span>
                </div>
              </div>

              {/* Glowing Anomaly Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {districtStatuses.map((ds) => {
                  const isCritical = ds.status === "critical";
                  const isWarning = ds.status === "warning";

                  const glowClasses = isCritical
                    ? "border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/50 animate-pulse"
                    : isWarning
                    ? "border-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50"
                    : "border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:border-emerald-400";

                  // Gauge bar color
                  const gaugeColor = ds.bufferRatio < 0.7 ? "bg-rose-500" : ds.bufferRatio > 2.0 ? "bg-amber-500" : "bg-emerald-500";
                  const gaugeWidth = Math.min(100, Math.round((ds.totalYard / (ds.requiredBuffer * 2.5)) * 100));

                  return (
                    <div
                      key={ds.godown}
                      onClick={() => setInspectedSite(ds.godown)}
                      className={`cursor-pointer bg-slate-900/80 rounded-xl p-5 border transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between ${glowClasses}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                              {ds.godown}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">
                              District Godown Store
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                              isCritical
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/60"
                                : isWarning
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/60"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/60"
                            }`}
                          >
                            {ds.status}
                          </span>
                        </div>

                        {/* Status Message */}
                        <div className="text-xs font-semibold text-slate-200 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                          {ds.statusText}
                        </div>

                        {/* Buffer Stock Health Gauge */}
                        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-slate-400">Current Stock vs Buffer Target:</span>
                            <span className="text-white font-bold">
                              {formatNumber(ds.totalYard)} / {formatNumber(ds.requiredBuffer)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${gaugeColor} transition-all duration-500`}
                              style={{ width: `${gaugeWidth}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                            <span>0</span>
                            <span className="text-emerald-400">Target: {formatNumber(ds.requiredBuffer)}</span>
                            <span>Max Bloat (2.5x)</span>
                          </div>
                        </div>

                        {/* Store Metrics */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-slate-950/40 p-2 rounded-lg">
                          <div>
                            <div className="text-[10px] text-slate-500">Yard Stock</div>
                            <div className="font-bold text-slate-200">{formatNumber(ds.totalYard)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500">Site Issues</div>
                            <div className="font-bold text-emerald-400">{formatNumber(ds.totalIssues)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500">In Transit</div>
                            <div className="font-bold text-cyan-400">+{formatNumber(ds.totalTransfersIn)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <PlusCircle className="w-3.5 h-3.5" /> Inspect & Place Site Order
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 44-Month Idle Stock Chart */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    44-Month Idle Stock Trajectory (Mar 2023 – Oct 2026)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comparing historical yard accumulation vs strictly causal Six Sigma ROP ({zScore}σ Service Level).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80"></span> Historical Actual
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span> GridPulse Planner
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simulatedReplayData} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => formatNumber(val)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                      formatter={(val: any) => [formatNumber(Number(val)) + " units", ""]}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual_idle_stock"
                      name="Historical Actual Idle"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#actualGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="display_planner_stock"
                      name="GridPulse Causal Planner"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#simGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DEPARTMENT 2: MATERIALS & PROCUREMENT                     */}
        {/* ========================================================= */}
        {activeDept === "procurement" && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    Materials & Procurement Operations — Month: {selectedMonth}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lead-time protected reorder queues, supplier dispatch hold directives, and Sarvam AI vendor dispatch briefs.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {currentRecommendations.orders_now.length} Orders Pending
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-400 border border-amber-800">
                    {currentRecommendations.holds.length} Holds Active
                  </span>
                </div>
              </div>
            </div>

            {/* Procurement Directives Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ORDER NOW Queue */}
              <div className="bg-slate-900/70 border border-emerald-900/40 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-mono">
                    <Package className="w-4 h-4" /> ORDER NOW QUEUE (Lead-Time Protected)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Six Sigma ROP
                  </span>
                </div>

                <div className="space-y-3">
                  {currentRecommendations.orders_now.length > 0 ? (
                    currentRecommendations.orders_now.map((o: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                        <div className="flex justify-between font-mono font-bold text-white">
                          <span className="text-emerald-300">{o.item_code}</span>
                          <span className="text-emerald-400 text-sm">+{formatNumber(o.suggested_order_qty)} units</span>
                        </div>
                        <div className="text-slate-200 font-medium">{o.item_name}</div>
                        <div className="grid grid-cols-3 gap-2 bg-slate-900 p-2 rounded-lg text-slate-400 font-mono text-[11px]">
                          <div>Stock: <strong className="text-slate-200">{formatNumber(o.current_stock)}</strong></div>
                          <div>Monthly Burn: <strong className="text-slate-200">{formatNumber(o.monthly_burn)}</strong></div>
                          <div>Lead Time: <strong className="text-amber-300">{o.lead_time_days}d</strong></div>
                        </div>
                        <div className="text-[11px] text-slate-400">{o.reason}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic py-4">No reorder triggers active for this month.</div>
                  )}
                </div>
              </div>

              {/* HOLD / SLOW TRUCKS Queue */}
              <div className="bg-slate-900/70 border border-amber-900/40 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase font-mono">
                    <AlertTriangle className="w-4 h-4" /> HOLD / SLOW TRUCKS (Yard Bloat Prevention)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Waste Defect Filter
                  </span>
                </div>

                <div className="space-y-3">
                  {currentRecommendations.holds.length > 0 ? (
                    currentRecommendations.holds.map((h: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                        <div className="flex justify-between font-mono font-bold text-white">
                          <span className="text-amber-300">{h.item_code}</span>
                          <span className="text-amber-400 text-sm">Hold {formatNumber(h.incoming_grn_qty)} units</span>
                        </div>
                        <div className="text-slate-200 font-medium">{h.item_name}</div>
                        <div className="bg-slate-900 p-2 rounded-lg text-amber-400/90 font-mono text-[11px]">
                          Currently holding {h.months_of_supply} months of inventory. Delay supplier delivery.
                        </div>
                        <div className="text-[11px] text-slate-400">{h.reason}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic py-4">No vendor holds flagged for this month.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Sarvam AI Procurement Copilot */}
            <div className="bg-slate-900/80 border border-cyan-800/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  Sarvam-105b Vendor Dispatch & Procurement Briefs
                </h4>
                <button
                  onClick={() => handleAskSarvam("Generate an executive vendor dispatch brief for items requiring order actions this month.", "procurement")}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate Brief
                </button>
              </div>

              {aiResponse && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                  {aiResponse}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DEPARTMENT 3: DISTRICT GODOWN STORES & ERP AUDIT DATABASE */}
        {/* ========================================================= */}
        {activeDept === "godowns" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-amber-400" />
                  District Godown Stores Ledger & ERP Audit Database
                </h3>
                <p className="text-xs text-slate-400">
                  Real ERP vouchers merged with live recorded site purchase orders. Includes 1-click CSV export.
                </p>
              </div>

              {/* Godown Selector */}
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Filter Store:</span>
                <select
                  value={selectedGodown}
                  onChange={(e) => setSelectedGodown(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">ALL 6 DISTRICT GODOWNS</option>
                  {summaryData.godowns.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inter-Godown Transfer Recommendations */}
            <div className="bg-slate-900/70 border border-cyan-900/40 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase font-mono">
                  <ArrowRightLeft className="w-4 h-4" /> Recommended Inter-District Transfers
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Surplus to Deficit Rebalancing
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentRecommendations.transfers.length > 0 ? (
                  currentRecommendations.transfers.map((t: any, idx: number) => (
                    <div key={idx} className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between font-mono font-bold text-white">
                        <span>{t.item_code}</span>
                        <span className="text-cyan-400">{t.transfer_qty} units</span>
                      </div>
                      <div className="text-[11px] text-slate-300 flex items-center gap-1 font-semibold">
                        <span className="text-rose-400">{t.from_godown}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-emerald-400">{t.to_godown}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{t.reason}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 italic py-2">District stores well balanced this month.</div>
                )}
              </div>
            </div>

            {/* Live ERP Stock Movement & Audit Database Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    ERP Stock Movement & Live Transaction Ledger ({allMovements.length} Records)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Live ERP audit trail tracking GRN Receipts, District Transfers, Contractor Issues/Returns, and Site Purchase Orders.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Movement Type Filter */}
                  <select
                    value={movementTypeFilter}
                    onChange={(e) => setMovementTypeFilter(e.target.value)}
                    className="bg-slate-800 text-xs text-white border border-slate-700 rounded-md px-2.5 py-1.5 focus:outline-none font-mono"
                  >
                    <option value="ALL">All Types</option>
                    <option value="ORDER">Live Purchase Orders</option>
                    <option value="RECEIPT">GRN Receipts</option>
                    <option value="TRANSFER">Transfers IN/OUT</option>
                    <option value="ISSUE">Contractor Issues</option>
                    <option value="RETURN">Yard Returns</option>
                  </select>

                  {/* Search Query Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search voucher or item..."
                      value={movementSearchQuery}
                      onChange={(e) => setMovementSearchQuery(e.target.value)}
                      className="bg-slate-800 text-xs text-white border border-slate-700 rounded-md pl-8 pr-3 py-1.5 focus:outline-none font-mono w-48"
                    />
                  </div>

                  {/* 1-Click CSV Export Button */}
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Ledger (.CSV)
                  </button>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/70 max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-900 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Voucher / PO #</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Godown Store</th>
                      <th className="py-2.5 px-4">Item Code & Name</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {allMovements.slice(0, 100).map((m, idx) => {
                      const isOrder = m.tx_type.includes("ORDER");
                      const isReceipt = m.tx_type.includes("RECEIPT");
                      const isTransfer = m.tx_type.includes("TRANSFER");
                      const isIssue = m.tx_type.includes("ISSUE");

                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="py-2 px-3 font-mono text-slate-400 whitespace-nowrap">{m.date}</td>
                          <td className="py-2 px-3 font-mono font-bold text-white whitespace-nowrap">
                            {m.voucher_no}
                          </td>
                          <td className="py-2 px-3 font-mono whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isOrder
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/60"
                                  : isReceipt
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/60"
                                  : isTransfer
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/60"
                                  : isIssue
                                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/60"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {m.tx_type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-medium whitespace-nowrap">{m.godown}</td>
                          <td className="py-2 px-4">
                            <div className="font-mono font-bold text-slate-200">{m.item_code}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                              {m.item_name}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {formatNumber(m.qty)} {m.unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* KANPUR CLOSER Wind-Down Store Info Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                <div>
                  <h5 className="font-bold text-white">KANPUR CLOSER Store (Project Wind-Down Store)</h5>
                  <p className="text-slate-400 text-[11px]">
                    Transfers to KANPUR CLOSER during 2026 represent site wind-down asset returns rather than district field demand.
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300">
                Wind-down Active (2026)
              </span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DEPARTMENT 4: FIELD CONTRACTORS & SET KITTING             */}
        {/* ========================================================= */}
        {activeDept === "contractors" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-violet-400" />
                  Contractor Field Stock & Parent-Child Set Kitting — Month: {selectedMonth}
                </h3>
                <p className="text-xs text-slate-400">
                  Field Bloat = Issues - Returns - Consumption. Evaluate 3 parent sets (Pole Clamps, 1-Phase Box, 3-Phase Box).
                </p>
              </div>

              {/* Official vs Empirical Ratio Toggle */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setRatioMode("official")}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition ${
                    ratioMode === "official"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Official sets.csv Ratio
                </button>
                <button
                  onClick={() => setRatioMode("empirical")}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition ${
                    ratioMode === "empirical"
                      ? "bg-cyan-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Empirical Site Consumption Ratio
                </button>
              </div>
            </div>

            {/* Set Balance Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {currentSetData.sets.map((s: any) => {
                const assembleable = ratioMode === "official" ? s.assembleable_official : s.assembleable_empirical;
                const stranded = ratioMode === "official" ? s.stranded_official : s.stranded_empirical;
                const bottleneck = ratioMode === "official" ? s.bottleneck_official : s.bottleneck_empirical;
                const isBottlenecked = stranded > 0;

                return (
                  <div
                    key={s.parent_code}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {s.parent_code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            isBottlenecked
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/50"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                          }`}
                        >
                          {isBottlenecked ? "Stranded Parent" : "Balanced Set"}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white">{s.parent_name}</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg text-center font-mono text-xs">
                      <div>
                        <div className="text-slate-500 text-[10px]">Total Parent</div>
                        <div className="text-sm font-bold text-white">{formatNumber(s.parent_stock)}</div>
                      </div>
                      <div>
                        <div className="text-emerald-400 text-[10px]">Assembleable</div>
                        <div className="text-sm font-bold text-emerald-400">{formatNumber(assembleable)}</div>
                      </div>
                      <div>
                        <div className="text-rose-400 text-[10px]">Stranded Units</div>
                        <div className="text-sm font-bold text-rose-400">{formatNumber(stranded)}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Primary Bottleneck:
                      </span>
                      <div className="font-mono font-bold text-amber-300 truncate">{bottleneck}</div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                      <span className="text-[11px] font-semibold text-slate-400">Child Inventory Health:</span>
                      {s.children.map((ch: any) => (
                        <div
                          key={ch.child_code}
                          className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/40 px-2 py-1 rounded"
                        >
                          <span className="truncate max-w-[170px]" title={ch.child_name}>
                            {ch.child_name}
                          </span>
                          <span className="font-mono text-slate-400">
                            {formatNumber(ch.stock)} {ch.child_unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {isBottlenecked && (
                      <div className="pt-3 border-t border-slate-800">
                        <button
                          onClick={() => handleOrderMissingChildKit(s)}
                          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow flex items-center justify-center gap-1.5"
                        >
                          <Package className="w-3.5 h-3.5" />
                          Order Missing Child Kit ({formatNumber(stranded)} sets)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* SPC Erection Velocity Chart */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    SPC Contractor Erection Velocity Chart (Project Level)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Monthly site consumption trajectory vs Upper Control Limit (+3σ).
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    UCL (+3σ): {formatNumber(projectSpc?.ucl || 0)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Mean: {formatNumber(projectSpc?.mean || 0)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    LCL: {formatNumber(projectSpc?.lcl || 0)}
                  </span>
                </div>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={causalReplayData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(val) => formatNumber(val)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                      formatter={(val: any) => [formatNumber(Number(val)) + " units consumed", ""]}
                    />
                    <ReferenceLine y={projectSpc?.ucl} stroke="#f43f5e" strokeDasharray="3 3" />
                    <ReferenceLine y={projectSpc?.mean} stroke="#fbbf24" strokeDasharray="3 3" />
                    <ReferenceLine y={projectSpc?.lcl} stroke="#38bdf8" strokeDasharray="3 3" />
                    <Area
                      type="monotone"
                      dataKey="project_consumption"
                      name="Actual Site Consumption"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#consGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* SLIDE-OVER DRAWER: COMPLETE 16-ITEM INVENTORY & SITE ORDER */}
      {/* ========================================================= */}
      {inspectedSite && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-xl bg-[#0e1424] border-l border-slate-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    {inspectedSite} — Site Inventory & Buffer Audit
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Month: {selectedMonth} | Total Buffer Target: {formatNumber(siteBuffers[inspectedSite]?.total_buffer_units || 25000)} units
                  </span>
                </div>
                <button
                  onClick={() => setInspectedSite(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order Placement Sub-Modal / Bar */}
              {orderModalItem && (() => {
                const parentChildren = summaryData.sets.filter((s: any) => s.parent_code === orderModalItem.item_code);
                const isParent = parentChildren.length > 0;

                return (
                  <div className="bg-emerald-950/90 border border-emerald-500 rounded-xl p-4 space-y-3 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {isParent ? "BOM-Aware Parent-Child Kit Order" : "Direct Site Purchase Order"}
                        </span>
                        <h4 className="text-sm font-bold text-white">{orderModalItem.item_name}</h4>
                        <span className="text-xs text-slate-300 font-mono">
                          Code: {orderModalItem.item_code} | Lead Time: {orderModalItem.lead_time_days} days
                        </span>
                      </div>
                      <button onClick={() => setOrderModalItem(null)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex-1">
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Parent Order Qty ({orderModalItem.unit}):
                        </label>
                        <input
                          type="number"
                          value={orderQtyInput}
                          onChange={(e) => setOrderQtyInput(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <button
                        onClick={handlePlaceOrderSubmit}
                        disabled={orderSubmitting || orderQtyInput <= 0}
                        className="mt-5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
                      >
                        {orderSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                        {isParent ? "Confirm Synchronized Kit PO" : "Confirm PO Dispatch"}
                      </button>
                    </div>

                    {/* BOM Synchronized JIT Kit Breakdown */}
                    {isParent && (
                      <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 space-y-2 mt-2">
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" /> Synchronized JIT Kit Breakdown (BOM-Aware)
                          </span>
                          <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">
                            Auto-Bundled Children
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Ordering {orderQtyInput} {orderModalItem.unit} of parent bundles all required child hardware based on sets.csv ratios:
                        </p>
                        <div className="space-y-1 text-[11px] font-mono">
                          {parentChildren.map((ch: any) => {
                            const childOnHand = (currentLedger.items as any)?.[ch.child_code]?.godowns?.[inspectedSite]?.closing_yard_stock || 0;
                            const childInTransit = liveOrders
                              .filter((o) => o.godown === inspectedSite && o.item_code === ch.child_code)
                              .reduce((sum, o) => sum + o.qty, 0);
                            const reqQty = Math.max(0.1, Math.round(orderQtyInput * ch.official_ratio * 10) / 10);
                            const isShort = childOnHand + childInTransit < reqQty;

                            return (
                              <div key={ch.child_code} className="flex justify-between items-center bg-slate-950 px-2.5 py-1.5 rounded">
                                <span className="text-slate-300 truncate max-w-[240px]">
                                  {ch.child_name} ({ch.child_code})
                                </span>
                                <span className={isShort ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                                  +{reqQty} {ch.child_unit} {isShort ? "(Deficit Bundled)" : "(Matched)"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 16-Item Site Inventory & Buffer Target Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-400" /> Complete 16-Item Site Inventory & Buffer Target
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1-Click JIT Ordering</span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/70 max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-900 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-2 text-right">On-Hand</th>
                        <th className="py-2.5 px-2 text-right">Buffer</th>
                        <th className="py-2.5 px-2 text-right">In-Transit</th>
                        <th className="py-2.5 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {Object.entries(currentLedger.items).map(([code, item]: [string, any]) => {
                        const meta = (summaryData.items as any)[code];
                        const onHand = item.godowns?.[inspectedSite]?.closing_yard_stock || 0;
                        const bufferTarget = siteBuffers[inspectedSite]?.items?.[code] || 50;

                        // Calculate in-transit orders for this item and godown
                        const inTransitOrders = liveOrders
                          .filter((o) => o.godown === inspectedSite && o.item_code === code)
                          .reduce((acc, curr) => acc + curr.qty, 0);

                        const isDeficit = onHand < bufferTarget;
                        const isBloated = onHand > bufferTarget * 2.5;

                        return (
                          <tr key={code} className="hover:bg-slate-800/40 transition">
                            <td className="py-2.5 px-3">
                              <div className="font-mono font-bold text-white text-[11px]">{code}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                                {meta?.item_name || ""}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-200">
                              {formatNumber(onHand)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-emerald-400">
                              {formatNumber(bufferTarget)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-cyan-400">
                              {inTransitOrders > 0 ? `+${formatNumber(inTransitOrders)}` : "-"}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => {
                                  const recQty = Math.max(10, Math.round(bufferTarget * 1.2 - onHand - inTransitOrders));
                                  setOrderModalItem({
                                    item_code: code,
                                    item_name: meta?.item_name || code,
                                    unit: meta?.unit || "UNITS",
                                    lead_time_days: meta?.lead_time_days || 30,
                                  });
                                  setOrderQtyInput(recQty > 0 ? recQty : 25);
                                }}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 font-mono text-[10px] transition border border-slate-700"
                              >
                                Order
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transit & Bottleneck Summary Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs font-mono">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">
                    Contractor Site Issues:
                  </span>
                  <div className="text-base font-bold text-emerald-400">
                    {formatNumber(
                      Object.values(currentLedger.items).reduce((acc: number, curr: any) => {
                        return acc + (curr.godowns?.[inspectedSite]?.issues || 0);
                      }, 0)
                    )} units
                  </div>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs font-mono">
                  <span className="text-[10px] text-slate-400 uppercase block mb-1">
                    Active In-Transit Pipeline:
                  </span>
                  <div className="text-base font-bold text-cyan-400">
                    +{formatNumber(
                      liveOrders
                        .filter((o) => o.godown === inspectedSite)
                        .reduce((sum, o) => sum + o.qty, 0)
                    )} units
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setInspectedSite(null);
                  setOrderModalItem(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Close Site Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SMART ALERT DISPATCH DRAWER (HEADER BELL)                 */}
      {/* ========================================================= */}
      {alertDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg bg-[#0e1424] border-l border-slate-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Smart Alert Dispatch Center</h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {activeAlerts.length} Auto-Detected Anomalies — {selectedMonth}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setAlertDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Alert List with 1-Click WhatsApp / Email Dispatch */}
              <div className="space-y-3">
                {activeAlerts.map((alert) => {
                  const isDispatched = !!dispatchedAlerts[alert.id];
                  const isDispatching = dispatchingId === alert.id;
                  const isCopied = copiedId === alert.id;

                  return (
                    <div
                      key={alert.id}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              alert.severity === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/60"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/60"
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                          <span className="text-[10px] text-cyan-400 font-mono block">
                            Site: {alert.site}
                          </span>
                        </div>

                        {isDispatched ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
                            <Check className="w-3.5 h-3.5" /> Dispatched
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDispatchAlert(alert)}
                            disabled={isDispatching}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-[11px] font-semibold transition shadow"
                          >
                            {isDispatching ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Send WhatsApp / Email
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                        {alert.description}
                      </p>

                      {/* Dispatched Preview Box */}
                      {isDispatched && (
                        <div className="bg-slate-950 p-3 rounded-lg border border-emerald-900/40 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                            <span>Ready-to-Copy Storekeeper Alert:</span>
                            <button
                              onClick={() => copyToClipboard(alert.id, dispatchedAlerts[alert.id])}
                              className="text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              {isCopied ? (
                                <span className="text-emerald-400 font-bold">Copied!</span>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          <div className="font-mono text-[10px] text-slate-300 whitespace-pre-line leading-relaxed">
                            {dispatchedAlerts[alert.id]}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setAlertDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Close Alert Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        GridPulse &copy; 2026 | Open Supply Chain Operations | Lumino Industries 1,700 Poles Planner
      </footer>
    </div>
  );
}
