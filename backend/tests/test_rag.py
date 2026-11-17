from fastapi.testclient import TestClient

from app.main import create_app
from rag.kb import GUIDANCE_DOCS, KB_DIR, Index, load_chunks, related_for_train, topics_for_train


def test_corpus_is_real_documents_only():
    chunks = load_chunks()
    assert {c["doc"] for c in chunks} == {"metropt3_failures.md", "metropt3_signals.md"}
    assert {c["source"] for c in chunks} == {"real"}
    assert len([c for c in chunks if c["doc"] == "metropt3_failures.md"]) == 4


def test_low_pressure_query_finds_the_lps_documentation():
    hits = Index(load_chunks()).search("LPS low pressure signal below 7 bar", k=3, docs=GUIDANCE_DOCS)
    assert hits[0]["title"] == "LPS low-pressure signal"


def test_air_leak_query_cites_the_real_failure_reports():
    hits = Index(load_chunks()).search("compressor air leak pressure drop LPS air production unit", k=6)
    assert any(h["doc"] == "metropt3_failures.md" for h in hits)


def test_search_is_deterministic_and_filters_noise():
    idx = Index(load_chunks())
    assert idx.search("oil temperature motor current") == idx.search("oil temperature motor current")
    assert idx.search("zzqx unrelated words") == []
    assert idx.search("   ") == []


def test_topics_follow_the_real_sensor_alarms(snap25_apu):
    topics = [t for t, _ in topics_for_train(snap25_apu, "TS-21")]
    assert topics[0] == "Compressor (APU) fault risk 94%"
    lp = [t for t, _ in topics_for_train(snap25_apu, "TS-05")]
    assert any(t.startswith("Air pressure below 7 bar") for t in lp)
    related = related_for_train(snap25_apu, "TS-21")
    assert related[0]["guidance"] and all(h["source"] == "real" for h in related[0]["guidance"])


def test_kb_api(tmp_path):
    c = TestClient(create_app(f"sqlite:///{tmp_path / 'k.db'}"))
    r = c.get("/kb/search", params={"q": "motor current under load", "k": 3}).json()
    assert r["guidance"][0]["title"] == "Motor current and oil temperature"
    assert r["past_cases"] == []  # no work-order history ships with the project
    related = c.get("/kb/train/TS-21").json()
    assert related["train_id"] == "TS-21" and related["related"]
    assert c.get("/kb/train/TS-99").status_code == 404
    assert c.get("/kb/search", params={"q": ""}).json()["hits"] == []
    assert KB_DIR.exists()
