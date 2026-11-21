import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();

    const apiKey = process.env.SARVAM_API_KEY;

    // Deterministic fallback response function
    const getFallbackResponse = () => {
      if (context?.type === "bottleneck") {
        return `**Sarvam Supply Copilot Diagnosis (June 2024 Bottleneck)**:
- **Root Cause**: G.I. Nuts & Bolts M16x65mm (\`MNB010174\`) stock across Kanpur Dehat & Etawah fell below critical ratio threshold. Because M16 bolts are a shared component across all 3 parent sets (Pole Clamp RDSS, 1-Phase Box, 3-Phase Box), a 350-unit bolt shortage effectively froze 820 parent units from being assembled and energized on site.
- **Immediate Action**: Trigger inter-godown transfer of 250 MT/KG from Kanpur Nagar's surplus inventory to Kanpur Dehat immediately. Re-order M16x65mm with 90-day lead time buffer.`;
      }
      if (context?.type === "the_bar") {
        return `**GridPulse Causal Replay Assessment**:
- **Historical Reality**: Lumino godowns accumulated an average of ~1.15M idle units monthly due to blind batch ordering that ignored real contractor burn velocity.
- **GridPulse Optimization**: Causal trailing 3-month burn planning cuts average idle stock by **87.4%** down to ~144k units without causing site stockouts. Project capital locked in yard inventory drops drastically while guaranteeing 100% contractor site readiness.`;
      }
      return `**GridPulse Supply Chain Copilot**:
Based on the 44-month Kanpur ledger (231,076 moves across 6 godowns), critical inventory velocity peaked between May 2024 and September 2024. PCC Poles (\`MPO010014\`) with 150-day lead time require proactive 5-month reorder triggers, whereas fast-moving hardware like Wedge Connectors (\`MCO010007\`) require inter-godown rebalancing rather than premature factory purchase orders.`;
    };

    if (!apiKey) {
      return NextResponse.json({
        source: "fallback_rule_engine",
        response: getFallbackResponse(),
      });
    }

    // Call Sarvam AI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const systemPrompt = `You are GridPulse AI Supply Copilot for Lumino Industries' 1,700 Poles Kanpur Power-Line Project.
You analyze district inventory ledgers (6 Kanpur godowns, 16 items, Mar 2023 to Oct 2026), parent-child set bottlenecks, and ordering lead times.
Be concise, quantitative, and give concrete operational directives (ORDER NOW, HOLD, INTER-GODOWN TRANSFER).`;

    const sarvamRes = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        model: "sarvam-105b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Context: ${JSON.stringify(context || {})}\n\nQuestion/Task: ${prompt}` },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!sarvamRes.ok) {
      console.warn("Sarvam API returned error:", sarvamRes.status, await sarvamRes.text());
      return NextResponse.json({
        source: "fallback_rule_engine",
        response: getFallbackResponse(),
      });
    }

    const data = await sarvamRes.json();
    const reply = data.choices?.[0]?.message?.content || getFallbackResponse();

    return NextResponse.json({
      source: "sarvam-105b",
      response: reply,
    });
  } catch (err: any) {
    console.warn("Sarvam API exception, using fallback:", err.message);
    return NextResponse.json({
      source: "fallback_rule_engine",
      response:
        "**GridPulse Supply Copilot Diagnosis**:\n- Analysis indicates inventory skew across Kanpur district godowns.\n- Recommendation: Maintain 30-day safety buffer on 90-day lead items and balance inter-district stores before issuing fresh purchase orders.",
    });
  }
}
