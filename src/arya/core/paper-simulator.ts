import type { Candle, ExecutionResult, OrderIntent, Side } from "./types";

export interface SimulationCosts { feeRate: number; slippageBps: number; spreadBps: number; }
export interface PositionState { symbol: string; side: Side; quantity: number; averageEntry: number; realizedPnl: number; feesPaid: number; }
export interface AccountState { cash: number; equity: number; realizedPnl: number; unrealizedPnl: number; feesPaid: number; positions: PositionState[]; }
export interface Fill { orderId: string; symbol: string; side: Side; quantity: number; price: number; fee: number; realizedPnl: number; timestamp: number; }

function executionPrice(side: Side, candle: Candle, costs: SimulationCosts): number { const direction = side === "long" ? 1 : -1; return candle.open * (1 + direction * (costs.spreadBps / 20_000 + costs.slippageBps / 10_000)); }

export class PaperSimulator {
  readonly costs: SimulationCosts;
  private state: AccountState;
  constructor(initialCash: number, costs: Partial<SimulationCosts> = {}) {
    if (!Number.isFinite(initialCash) || initialCash <= 0) throw new Error("initialCash must be positive");
    this.costs = { feeRate: costs.feeRate ?? 0.001, slippageBps: costs.slippageBps ?? 2, spreadBps: costs.spreadBps ?? 4 };
    if (Object.values(this.costs).some((v) => !Number.isFinite(v) || v < 0)) throw new Error("simulation costs must be finite and non-negative");
    this.state = { cash: initialCash, equity: initialCash, realizedPnl: 0, unrealizedPnl: 0, feesPaid: 0, positions: [] };
  }
  snapshot(markPrices: Record<string, number> = {}): AccountState {
    const positions = this.state.positions.map((p) => ({ ...p })); let unrealizedPnl = 0;
    for (const p of positions) { const mark = markPrices[p.symbol] ?? p.averageEntry; unrealizedPnl += (p.side === "long" ? mark - p.averageEntry : p.averageEntry - mark) * p.quantity; }
    return { ...this.state, equity: this.state.cash + unrealizedPnl, unrealizedPnl, positions };
  }
  fill(order: OrderIntent, candle: Candle): Fill | ExecutionResult {
    if (order.mode !== "paper") return { orderId: order.id, status: "rejected", filledQuantity: 0, message: "PaperSimulator accepts paper orders only", executedAt: candle.t };
    if (!Number.isFinite(order.quantity) || order.quantity <= 0) return { orderId: order.id, status: "rejected", filledQuantity: 0, message: "quantity must be positive", executedAt: candle.t };
    const price = order.entry !== undefined ? order.entry : executionPrice(order.side, candle, this.costs); if (!Number.isFinite(price) || price <= 0) return { orderId: order.id, status: "rejected", filledQuantity: 0, message: "invalid execution price", executedAt: candle.t };
    const fee = price * order.quantity * this.costs.feeRate; const position = this.state.positions.find((p) => p.symbol === order.symbol); const signed = order.side === "long" ? order.quantity : -order.quantity; let realizedPnl = -fee;
    if (!position) this.state.positions.push({ symbol: order.symbol, side: order.side, quantity: order.quantity, averageEntry: price, realizedPnl: 0, feesPaid: fee });
    else if (position.side === order.side) { const total = position.quantity + order.quantity; position.averageEntry = (position.averageEntry * position.quantity + price * order.quantity) / total; position.quantity = total; position.feesPaid += fee; }
    else {
      const closing = Math.min(position.quantity, order.quantity); const pnlPerUnit = position.side === "long" ? price - position.averageEntry : position.averageEntry - price; realizedPnl += pnlPerUnit * closing; position.realizedPnl += pnlPerUnit * closing; this.state.realizedPnl += pnlPerUnit * closing; position.feesPaid += fee; position.quantity -= closing;
      if (position.quantity === 0) { const remaining = order.quantity - closing; this.state.positions.splice(this.state.positions.indexOf(position), 1); if (remaining > 0) this.state.positions.push({ symbol: order.symbol, side: order.side, quantity: remaining, averageEntry: price, realizedPnl: 0, feesPaid: 0 }); }
    }
    this.state.cash -= signed * price; this.state.cash -= fee; this.state.feesPaid += fee;
    return { orderId: order.id, symbol: order.symbol, side: order.side, quantity: order.quantity, price, fee, realizedPnl, timestamp: candle.t };
  }
}
