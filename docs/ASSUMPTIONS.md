# Data and assumptions

MetroSched uses **no synthetic data**. This page lists every data source and every assumption.

## Real data used

| Data | Source |
|---|---|
| Air-compressor (APU) sensor readings, Feb–Aug 2020, 15 signals, 1,516,948 rows | MetroPT-3, UCI Machine Learning Repository, doi:10.24432/C5VW3R, CC BY 4.0 (Metro do Porto) |
| Four reported air-leak failures (18 Apr, 29–30 May, 5–7 Jun, 15 Jul 2020) | Same dataset page |
| Sensor documentation used by the knowledge base | Same dataset page (paraphrased in `data/kb/metropt3_signals.md`) |
| Fleet of 25 trainsets, Muttom depot | Public KMRL facts (verify before quoting) |
| Anything uploaded through `POST /data/ingest` | You |

## Not loaded (no public source)

Fitness certificates, Maximo job cards, branding contracts, mileage, cleaning status and stabling-bay positions are not loaded. MetroSched does not invent them:
- the hard rules that need them (certificates, critical job cards, cleaning slots) are skipped and **listed as not checked** on every plan;
- the soft goals that need them (branding, mileage, shunting) are not used;
- no train is called "fit" unless certificate and job-card data were checked.

## Assumptions

| Assumption | Value | Where |
|---|---|---|
| Mapping one real train onto a fleet | Each of the 25 trainsets gets a seeded slice of 24 consecutive logged 30-minute windows (12 h of logged data; longer in calendar time where the logger had gaps). Three trainsets get a slice that overlaps a reported failure; the others get slices at least a day away from any failure. | `backend/ml/apu_risk.py` |
| Revenue trains required per morning | 18 | `data/fleet_config.json` |
| Minimum standby | 2 | `data/fleet_config.json` |
| IBL bay capacity | 6 | `data/fleet_config.json` |
| Service date | Today, unless set | `data/fleet_config.json` |
| Compressor alert level | Fault risk ≥ 50% | `ml/apu_risk.py`, `optimizer/explain.py` |
| Soft-goal weights | Compressor risk 500, minutes below 7 bar 5, compressor duty 2, standby 3, maintenance 4 (branding 10, mileage 2, shunting 5 when uploaded) | `optimizer/model.py` |
| Real trainsets are 3-car | The SIH25081 statement says four-car; the model is car-count agnostic | `app/metropt_fleet.py` |

The oil-level signal is not used: the documentation says it is active when oil is low, but in the data it reads active during normal operation.

## Tests only

`backend/tests/fixture_data.py` generates a seeded, invented fleet (certificates, job cards, branding, bays) so the tests can exercise the rules that need those inputs. It lives under `backend/tests/` and is never loaded by the app.
