# MetroSched user guide

This guide is for the depot supervisor preparing tomorrow's induction between 21:00 and 23:00. Planning data is synthetic; compressor sensor data is real (MetroPT-3, Metro do Porto).

## 1. Generate tonight's plan
Open **Tonight's plan** and select **Generate plan**. If no data is loaded yet, the seeded data is loaded automatically.

The ranked list shows every trainset in this order: revenue trains, then standby, then IBL. Within each group, trains are sorted by score.

The score is a train's suitability for revenue service. It rises with branding need and with mileage below the fleet mean. It falls with distance from the bay exit and with open non-critical job cards.

Select a row to see:
- **Reasons**: the rule-based facts behind the assignment.
- **Conflict alerts**: items to check by hand, such as a certificate expiring within 2 days or a shunting move needed.

Below the list, three columns show which trains are in Revenue, Standby and IBL.

If no plan satisfies every hard rule, the page shows the smallest relaxation instead. For example: "Relax cleaning slots by 2".

## 2. Override an assignment
Expand a train, choose **Move to**, give a reason and select **Save override**.

An unfit train cannot be moved out of IBL. Overrides appear on the **Override log** page. After 20 overrides, the optimizer's soft weights are re-learned from them.

## 3. Check fleet health
**Fleet health** charts how many days remain until each train's earliest certificate expires. Expand **Show certificate table** to see all three certificates per train. The page also lists open Maximo job cards, with critical ones first.

The **Compressor (APU) fault risk** chart shows each train's risk, scored from a slice of real air-compressor readings (MetroPT-3). At 50% or more the train gets an alert on Tonight's plan and the optimizer prefers to keep it out of revenue. Below the chart: how well the model caught the real reported failures, and a table of each train's sensor slice. Treat the risk as a prompt to inspect, not a verdict: the model misses some failures and raises some false alarms.

## 4. Mileage and branding
- **Mileage chart**: each train's distance from the fleet mean. Below the mean is blue; above is amber.
- **Branding chart**: hours each wrapped train is behind its advertiser contract.

## 5. Depot bay map
Shows each stabling line with position 1 nearest the exit. Each train is coloured by its assignment. The page also lists IBL occupancy and the shunting moves the plan needs.

## 6. What-if simulator
Pick a scenario and select **Run simulation**:
- a certificate expires,
- cleaning crews are absent,
- a critical fault is reported,
- the number of revenue trains changes.

The result lists every train whose assignment changes, with the new reasons.
