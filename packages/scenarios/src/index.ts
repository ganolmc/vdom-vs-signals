export type ScenarioId =
  | "S1_FILTER"
  | "S2_UPDATE_1PCT"
  | "S3_INSERT_1K"
  | "S4_REMOVE_1K"
  | "S5_SORT_COL"
  | "S6_IDLE_30S";

export interface Scenario {
  id: ScenarioId;
  description: string;
  run(page: any, opts: { baseUrl: string }): Promise<void>; // run implemented in harness
}

export const SCENARIOS: Array<Pick<Scenario, "id" | "description">> = [
  { id: "S1_FILTER", description: "change region" },
  { id: "S2_UPDATE_1PCT", description: "tick 1% 50 times" },
  { id: "S3_INSERT_1K", description: "insert 1000 rows" },
  { id: "S4_REMOVE_1K", description: "remove 1000 rows" },
  { id: "S5_SORT_COL", description: "toggle price sort" },
  { id: "S6_IDLE_30S", description: "idle 30s" }
];
