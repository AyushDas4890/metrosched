from optimizer.constraints import IBL, REVENUE, STANDBY, check_plan, expired_certificates, is_fit, open_critical_jobs


def test_expired_cert_makes_unfit(snap25):
    tid = snap25.trains[0]["train_id"]
    snap25.certificates[tid][0]["valid_until"] = "2026-10-01"
    assert expired_certificates(snap25, tid)
    assert not is_fit(snap25, tid)


def test_open_critical_job_makes_unfit(snap25):
    tid = snap25.trains[1]["train_id"]
    snap25.job_cards[tid] = [{"wonum": "WOX", "assetnum": tid, "description": "x",
                              "wopriority": "CRITICAL", "status": "OPEN", "reportdate": "2026-10-20"}]
    assert open_critical_jobs(snap25, tid)
    assert not is_fit(snap25, tid)


def test_checker_flags_unfit_in_revenue(snap25):
    tid = snap25.trains[0]["train_id"]
    snap25.certificates[tid][0]["valid_until"] = "2026-10-01"
    plan = {t["train_id"]: STANDBY for t in snap25.trains}
    plan[tid] = REVENUE
    assert any(tid + ": unfit" in p for p in check_plan(snap25, plan))
    plan[tid] = IBL
    assert not any(tid + ": unfit" in p for p in check_plan(snap25, plan))
