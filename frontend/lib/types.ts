export type Assignment = "REVENUE" | "STANDBY" | "IBL";

export interface PlanItem {
  train_id: string;
  depot_id: string;
  assignment: Assignment;
  rank: number;
  score: number;
  reasons: string[];
  violations: string[];
}

export interface Relaxation {
  constraint: string;
  relax_by: number;
  message: string;
}

export interface Plan {
  plan_id: number | null;
  created_at: string | null;
  service_date: string;
  feasible: boolean;
  items: PlanItem[];
  relaxations: Relaxation[];
  objective: number;
  solve_seconds: number;
  weights: Record<string, number>;
  weights_source: string;
}

export interface Certificate {
  train_id: string;
  kind: string;
  label: string;
  valid_until: string;
  days_left: number;
}

export interface JobCard {
  wonum: string;
  assetnum: string;
  description: string;
  wopriority: string;
  status: string;
  reportdate: string;
}

export interface Branding {
  contract_id: string;
  train_id: string;
  advertiser: string;
  min_hours_per_day: number;
  hours_shortfall_7d: number;
}

export interface Train {
  train_id: string;
  depot_id: string;
  cars: number;
  cumulative_km: number;
  bay_id: string;
  days_since_cleaning: number;
  fit: boolean;
  cleaning_due: boolean;
  certificates: Certificate[];
  expired: string[];
  job_cards: JobCard[];
  critical_open: number;
  branding: Branding | null;
}

export interface Bay {
  bay_id: string;
  depot_id: string;
  line: number;
  position: number;
  kind: "STABLING" | "IBL";
}

export interface FleetStatus {
  service_date: string;
  config: { required_revenue: number; min_standby: number; cleaning_slots: number; ibl_capacity: number; cleaning_due_days: number };
  depots: { depot_id: string; name: string }[];
  bays: Bay[];
  trains: Train[];
}

export interface Change {
  train_id: string;
  before: Assignment | null;
  after: Assignment;
  reasons: string[];
}

export interface SimulateResult {
  baseline: Plan;
  scenario: Plan;
  changes: Change[];
}

export interface Override {
  id: number;
  created_at: string;
  plan_id: number | null;
  train_id: string;
  from_assignment: string;
  to_assignment: string;
  reason: string;
  supervisor: string;
}

export type Scenario =
  | { type: "cert_expire"; train_id: string; kind: string }
  | { type: "crews_absent"; count: number }
  | { type: "critical_job"; train_id: string; description?: string }
  | { type: "required_revenue"; value: number };
