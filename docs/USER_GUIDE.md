# MetroSched user guide

This guide is for the depot supervisor preparing tomorrow's induction between 21:00 and 23:00. MetroSched uses no synthetic data: trains are scored on real MetroPT-3 compressor data, and inputs with no real source are shown as not loaded.

## 1. Generate tonight's plan
Open **Tonight's plan** and select **Generate plan**.

The ranked list shows every trainset in this order: revenue trains, then standby, then IBL. Within each group, trains are sorted by score. The score is a train's suitability for revenue service. With only MetroPT-3 data, it falls with compressor fault risk, minutes below 7 bar and compressor duty above the fleet mean. When real files are uploaded, branding, mileage, bay position and open job cards also count.

A yellow note above the list says which hard rules were **not checked** and which goals were **not used**, because their data isn't loaded. Read it before relying on the plan.

Select a row to see:
- **Reasons**: the rule-based facts behind the assignment. Without certificate and job-card data, the first reason says "fitness not verified".
- **Conflict alerts**: items to check by hand, such as a high compressor fault risk or air pressure below 7 bar.
- **From the knowledge base**: the real MetroPT-3 documents that match each issue.

If no plan satisfies every hard rule, the page shows the smallest relaxation instead.

## 2. Override an assignment
Expand a train, choose **Move to**, give a reason and select **Save override**. A train with a known blocking fault cannot be moved out of IBL. Overrides appear on the **Override log** page. After 20 overrides, the soft weights are re-learned from them.

## 3. Fleet health
The **Compressor (APU) fault risk** chart shows each train's risk, scored from its slice of real compressor readings. At 50% or more the train gets an alert and the optimizer prefers to keep it out of revenue. Below the chart: how well the model caught the real reported failures, and each train's sensor slice. Treat the risk as a prompt to inspect, not a verdict: the model misses some failures and raises some false alarms.

Certificates and job cards show "not loaded" unless real files were uploaded.

## 4. Compressor usage
- **Duty chart**: the share of time each compressor ran under load, against the fleet mean.
- **Low-pressure chart**: minutes each train's air pressure was below 7 bar (the LPS signal). This caught TS-03's real air leak, which the risk model missed.
- Mileage and branding show "not loaded" unless uploaded.

## 5. Depot
Lists the trains in the inspection bay line and why. Bay positions and shunting show "not loaded" unless real bay data is uploaded.

## 6. What-if simulator
Pick a scenario and select **Run simulation**:
- a fitness certificate expires (hypothetical),
- a critical fault is reported,
- the number of revenue trains changes.

"Cleaning crews are absent" is disabled until real cleaning data is uploaded. The result lists every train whose assignment changes, with the new reasons.

## 7. Knowledge base
Search the four real MetroPT-3 failure reports and the dataset's sensor documentation. Every result shows its source. Results are retrieved, not generated.

## Loading real data
Send files to `POST /data/ingest` (for example `certificates.json`, a Maximo `job_cards.csv`, `trainsets.json` with mileage and bay ids). Check what is loaded with `GET /data/status`, and go back to the MetroPT-3-only fleet with `DELETE /data`.
