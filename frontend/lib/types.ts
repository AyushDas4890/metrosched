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
  data_source: "metropt3" | "uploaded";
  inputs_loaded: Record<string, boolean>;
  rules_not_checked: string[];
  goals_not_used: string[];
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
  cumulative_km: number | null;
  bay_id: string | null;
  days_since_cleaning: number | null;
  /** null when no certificate or job-card data is loaded, so fitness is unknown. */
  fit: boolean | null;
  cleaning_due: boolean;
  certificates: Certificate[];
  expired: string[];
  job_cards: JobCard[];
  critical_open: number;
  branding: Branding | null;
  apu: ApuRisk | null;
}

/** Compressor (APU) failure risk from real MetroPT-3 sensor data mapped onto this trainset. */
export interface ApuRisk {
  risk: number;
  slice_start: string;
  slice_end: string;
  peak_window: string;
  reported_failure_in_slice: boolean;
  source: string;
  /** Share of the slice the compressor ran under load (real, from the DV electric signal). */
  duty: number;
  /** Minutes the air pressure was below 7 bar in the slice (real, from the LPS signal). */
  low_pressure_minutes: number;
  oil_temp_max: number;
}

export interface ApuModel {
  source: string;
  alert_threshold: number;
  slice_hours: number;
  metrics: {
    windows: number;
    failure_windows: number;
    roc_auc: number;
    average_precision: number;
    recall_at_0_5: number;
    false_alarm_rate_at_0_5: number;
    events_detected: number;
    events: number;
  };
}

/** One retrieved knowledge-base passage. `source` says whether it is real data or synthetic. */
export interface KbHit {
  id: string;
  doc: string;
  title: string;
  source: "real" | "synthetic";
  snippet: string;
  score: number;
}

export interface KbTopic {
  topic: string;
  query: string;
  guidance: KbHit[];
  past_cases: KbHit[];
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
  config: { required_revenue: number; min_standby: number; cleaning_slots: number | null; ibl_capacity: number; cleaning_due_days: number };
  data_source: "metropt3" | "uploaded";
  inputs_loaded: Record<string, boolean>;
  rules_not_checked: string[];
  goals_not_used: string[];
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

export interface KbAnswer {
  question: string;
  status: "answered" | "refused" | "no_match" | "quotes_only";
  answer: string;
  citations: { passage_id: string; title: string; quote: string }[];
  passages: KbHit[];
  reason: string;
}
