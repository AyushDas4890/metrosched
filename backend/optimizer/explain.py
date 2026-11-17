"""Rule-based, human-readable reasons and conflict alerts for each assignment (no LLM)."""
from __future__ import annotations

from datetime import date

from .constraints import (CERT_LABEL, IBL, REVENUE, STANDBY, cleaning_due, expired_certificates,
                          missing_certificates, open_critical_jobs, open_noncritical_jobs)
from .snapshot import FleetSnapshot

EXPIRY_WARN_DAYS = 2
APU_ALERT_AT = 0.5


def explain(snap: FleetSnapshot, train: dict, assignment: dict[str, str], mean_km: float) -> tuple[list[str], list[str]]:
    tid = train["train_id"]
    a = assignment[tid]
    reasons: list[str] = []
    alerts: list[str] = []

    for c in expired_certificates(snap, tid):
        reasons.append(f"{CERT_LABEL[c['kind']]} fitness certificate expired on {c['valid_until']} (hard rule)")
    for k in missing_certificates(snap, tid):
        reasons.append(f"No {CERT_LABEL[k]} fitness certificate on record (hard rule)")
    for j in open_critical_jobs(snap, tid):
        reasons.append(f"Open critical job card {j['wonum']}: {j['description']} (hard rule)")
    certs = snap.certificates.get(tid, [])
    if certs and not expired_certificates(snap, tid) and not missing_certificates(snap, tid):
        first = min(certs, key=lambda c: c["valid_until"])
        days = (date.fromisoformat(first["valid_until"]) - snap.service_date).days
        reasons.append(f"All fitness certificates valid; earliest expiry {CERT_LABEL[first['kind']]} on {first['valid_until']}")
        if days <= EXPIRY_WARN_DAYS:
            alerts.append(f"{CERT_LABEL[first['kind']]} certificate expires in {days} day(s)")

    noncrit = open_noncritical_jobs(snap, tid)
    if noncrit:
        names = ", ".join(f"{j['wonum']} ({j['wopriority'].lower()})" for j in noncrit)
        reasons.append(f"Open non-critical job cards: {names}" + ("; scheduled into IBL maintenance window" if a == IBL else ""))

    br = snap.branding.get(tid)
    if br:
        txt = f"Branding: {br['advertiser']} needs {br['min_hours_per_day']} h/day, {br['hours_shortfall_7d']} h short over 7 days"
        reasons.append(txt + (" — revenue service recovers exposure" if a == REVENUE else ""))
        if a != REVENUE and br["hours_shortfall_7d"] > 0:
            alerts.append(f"Branding shortfall grows: {br['advertiser']} train not in revenue")

    apu = snap.apu.get(tid)
    if apu:
        pct = round(apu["risk"] * 100)
        where = f"MetroPT-3 sensor slice {apu['slice_start']} to {apu['slice_end']}"
        if apu["risk"] >= APU_ALERT_AT:
            alerts.append(f"Compressor (APU) fault risk {pct}% ({where}); inspect the air system before service")
        reasons.append(f"Compressor (APU) fault risk {pct}% from real {where}"
                       + ("; a reported air leak falls in this slice" if apu.get("reported_failure_in_slice") else ""))
        lp = apu.get("low_pressure_minutes", 0)
        if lp > 0:
            alerts.append(f"Air pressure below 7 bar for {lp:g} min in its MetroPT-3 slice (LPS signal)")
        if "duty" in apu:
            duties = [v.get("duty", 0) for v in snap.apu.values()]
            mean_duty = sum(duties) / len(duties)
            word = "above" if apu["duty"] > mean_duty else "below"
            reasons.append(f"Compressor loaded {apu['duty'] * 100:.0f}% of the time, {word} the fleet mean of {mean_duty * 100:.0f}%")

    if snap.available["mileage"] and train.get("cumulative_km") is not None:
        delta = train["cumulative_km"] - mean_km
        word = "above" if delta > 0 else "below"
        reasons.append(f"Mileage {train['cumulative_km']:,} km is {abs(delta):,.0f} km {word} fleet mean")

    if cleaning_due(snap, train):
        if a == REVENUE:
            reasons.append(f"Cleaning due ({train['days_since_cleaning']} days since last); uses tonight's cleaning slot")
        else:
            alerts.append(f"Cleaning overdue ({train['days_since_cleaning']} days)")

    bay = snap.bays.get(train.get("bay_id"))
    if bay and bay["kind"] == "STABLING":
        blockers = [u["train_id"] for u in snap.trains
                    if (b := snap.bays.get(u.get("bay_id"))) and b["kind"] == "STABLING" and b["depot_id"] == bay["depot_id"]
                    and b["line"] == bay["line"] and b["position"] < bay["position"] and assignment[u["train_id"]] != REVENUE]
        if a == REVENUE and blockers:
            alerts.append(f"Shunting needed: {', '.join(blockers)} block exit from {train['bay_id']}")
        elif a == REVENUE:
            reasons.append(f"Bay {train['bay_id']} has a clear exit path; no shunting")

    # Only claim "fit" when certificate and job-card data were actually loaded and checked.
    verified = snap.available["certificates"] and snap.available["job_cards"]
    if a == STANDBY:
        reasons.insert(0, ("Fit for service" if verified else "Fitness not verified (no certificate or job-card data)")
                       + "; held as standby because revenue requirement is met by higher-ranked trains")
    elif a == REVENUE:
        reasons.insert(0, "Fit for service and selected for revenue" if verified
                       else "Selected for revenue; fitness not verified (no certificate or job-card data)")
    elif not (expired_certificates(snap, tid) or missing_certificates(snap, tid) or open_critical_jobs(snap, tid)):
        if apu and apu["risk"] >= APU_ALERT_AT:
            reasons.insert(0, "No blocking fault on record, but sent to IBL: high compressor (APU) fault risk")
        elif apu and apu.get("low_pressure_minutes", 0) > 0:
            reasons.insert(0, "No blocking fault on record, but sent to IBL: air pressure fell below 7 bar")
        else:
            reasons.insert(0, "Fit, but sent to IBL for preventive maintenance")
    else:
        reasons.insert(0, "Not fit for service; must go to Inspection Bay Line")
    return reasons, alerts
