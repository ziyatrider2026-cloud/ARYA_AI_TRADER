import type { ExecutionResult, OrderIntent } from "./types";

export interface ExecutionProvider {
  execute(order: OrderIntent): Promise<ExecutionResult>;
}

/** Deterministic paper executor. It never talks to a broker. */
export class PaperExecutionProvider implements ExecutionProvider {
  readonly name = "paper";

  async execute(order: OrderIntent): Promise<ExecutionResult> {
    if (order.mode !== "paper") {
      return {
        orderId: order.id,
        status: "rejected",
        filledQuantity: 0,
        message: "PaperExecutionProvider accepts paper orders only",
        executedAt: Date.now(),
      };
    }

    return {
      orderId: order.id,
      status: "accepted",
      filledQuantity: 0,
      message: "Paper order accepted; fill simulation must be performed by the paper market simulator",
      executedAt: Date.now(),
    };
  }
}
