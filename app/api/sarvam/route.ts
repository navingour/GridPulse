import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();

    const apiKey = process.env.SARVAM_API_KEY;

    // Six Sigma Deterministic fallback response function
    const getFallbackResponse = () => {
      if (context?.type === "six_sigma") {
        return `**Sarvam AI Six Sigma (DMAIC & SPC) Assessment**:
- **DPMO Shift**: Historical district operations exhibited ~34,564 DPMO (~3.3σ) driven primarily by Idle Yard Waste (>2x lead-time demand) and stranded parent sets. GridPulse Six Sigma causal planning cuts defects to ~22,333 DPMO (~3.5σ) while slashing aggregate inventory by 87%.
- **Demand Volatility ($CV$)**: Child items like Eye Hooks (\`MEH050071\`) and G.I. Nuts & Bolts (\`MNB010174\`) exhibit $CV > 1.4$ (erratic contractor site pull), contrasting with rigid vendor push batches ($CV > 1.8$).
- **Statistical Control Directive**: Use $Z=3.0$ (99.87% service level) ROP formula $\\text{ROP} = (\\mu_d \\times L) + Z \\cdot \\sigma_d \\sqrt{L}$ for PCC Poles (\`MPO010014\`) and resolve out-of-control erection spikes via inter-godown buffer transfers.`;
      }
      if (context?.type === "bottleneck") {
        return `**Sarvam Supply Copilot Diagnosis (June 2024 Bottleneck — Six Sigma Analysis)**:
- **Root Cause & SPC Out-of-Control**: G.I. Nuts & Bolts M16x65mm (\`MNB010174\`) site demand spiked past upper control limits ($UCL$), while vendor dispatches remained lump-sum. Because M16 bolts are a shared component across all 3 parent sets (Pole Clamp RDSS, 1-Phase Box, 3-Phase Box), a 350-unit bolt deficit stranded 820 parent sets.
- **DMAIC Action**: Trigger DMAIC inter-godown transfer of 250 MT/KG from Kanpur Nagar's surplus inventory to Kanpur Dehat immediately. Reorder with $3\\sigma$ safety buffer (90-day lead time).`;
      }
      if (context?.type === "the_bar") {
        return `**GridPulse Causal Replay Assessment ("The Bar")**:
- **Historical Reality**: Lumino godowns accumulated an average of ~1.15M idle units monthly due to blind batch ordering that ignored real contractor burn velocity ($CV_{supply} = 1.9$).
- **GridPulse Optimization**: Six Sigma causal trailing burn planning cuts average idle stock by **87.4%** down to ~144k units without causing site stockouts. Process capability improves drastically from uncontrolled yard waste to statistical process control.`;
      }
      return `**GridPulse Supply Chain Copilot (Six Sigma Engine)**:
Based on the 44-month Kanpur ledger (231,076 moves across 6 godowns), contractor burn exhibits seasonal variance with peak erection velocity in mid-2024. Items with lead times $\\ge 90$ days require Six Sigma ROP buffers $\\text{ROP} = (\\mu_d \\times L) + Z \\cdot \\sigma_d \\sqrt{L}$, while fast-moving hardware requires DMAIC inter-district transfers to eliminate stranded sets.`;
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
You specialize in Six Sigma (DMAIC), Statistical Process Control (SPC), Coefficient of Variation (CV = sigma/mu), DPMO, and Lead-Time Buffer optimization.
Analyze 6 district godowns and 16 items across 44 months.
Provide crisp, quantitative root-cause diagnosis and actionable directives (ORDER NOW, HOLD, INTER-GODOWN TRANSFER).`;

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
          { role: "user", content: `Six Sigma Context: ${JSON.stringify(context || {})}\n\nQuestion/Task: ${prompt}` },
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
        "**GridPulse Six Sigma Supply Copilot**:\n- Analysis indicates significant Coefficient of Variation (CV) mismatch between erratic site consumption and lump-sum vendor deliveries.\n- Recommendation: Maintain 3σ safety buffer on items with >90-day lead time and use DMAIC inter-godown transfers to eliminate stranded sets.",
    });
  }
}
