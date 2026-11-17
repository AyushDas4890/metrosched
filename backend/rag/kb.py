"""Retrieval over the MetroSched knowledge base (retrieval only, no language model; real documents only).

Corpus (data/kb/):
  metropt3_failures.md  the four real MetroPT-3 failure reports, one chunk per "## " section
  metropt3_signals.md   the real MetroPT-3 sensor documentation, one chunk per section
  work_orders.csv       optional: real past work orders, if supplied (Maximo columns + root_cause, resolution,
                        downtime_hours, closedate); one chunk per row. None ships with the project.

Index: TF-IDF over words and word pairs; ranking by cosine similarity. Every hit carries its source
("real" or "synthetic") so the UI can say how far to trust it.
"""
from __future__ import annotations

import csv
import re
from functools import lru_cache
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

from optimizer.constraints import CERT_LABEL, cleaning_due, expired_certificates, open_critical_jobs, open_noncritical_jobs
from optimizer.snapshot import FleetSnapshot

KB_DIR = Path(__file__).resolve().parents[2] / "data" / "kb"
MIN_SCORE = 0.05
GUIDANCE_DOCS = {"metropt3_failures.md", "metropt3_signals.md"}
HISTORY_DOCS = {"work_orders.csv"}
APU_ALERT_AT = 0.5


def _md_chunks(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    m = re.search(r"<!--\s*source:\s*(\w+)\s*-->", text)
    source = m.group(1) if m else "unlabelled"
    chunks = []
    for i, part in enumerate(re.split(r"^## ", text, flags=re.M)[1:]):
        title, _, body = part.partition("\n")
        chunks.append({"id": f"{path.stem}#{i + 1}", "doc": path.name, "title": title.strip(),
                       "text": body.strip(), "source": source})
    return chunks


def _work_order_chunks(path: Path) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return [{
        "id": r["wonum"], "doc": path.name, "source": "real",
        "title": f"{r['wonum']}: {r['description']} on {r['assetnum']} ({r['reportdate']})",
        "text": (f"{r['description']}. Priority {r['wopriority']}. Root cause: {r['root_cause']}. "
                 f"Fix: {r['resolution']}. Downtime {r['downtime_hours']} h, closed {r['closedate']}."),
    } for r in rows]


def load_chunks(kb_dir: Path = KB_DIR) -> list[dict]:
    chunks = []
    for md in sorted(kb_dir.glob("*.md")):
        chunks += _md_chunks(md)
    wo = kb_dir / "work_orders.csv"
    if wo.exists():
        chunks += _work_order_chunks(wo)
    return chunks


class Index:
    def __init__(self, chunks: list[dict]):
        self.chunks = chunks
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, stop_words="english")
        self.matrix = self.vectorizer.fit_transform([f"{c['title']} {c['title']} {c['text']}" for c in chunks])

    def search(self, query: str, k: int = 5, min_score: float = MIN_SCORE, docs: set[str] | None = None) -> list[dict]:
        """Top-k chunks by cosine similarity; `docs` restricts the search to some source files."""
        if not query.strip() or not self.chunks:
            return []
        scores = linear_kernel(self.vectorizer.transform([query]), self.matrix).ravel()
        order = sorted((i for i in range(len(scores)) if docs is None or self.chunks[i]["doc"] in docs),
                       key=lambda i: (-scores[i], self.chunks[i]["id"]))
        hits = []
        for i in order:
            if len(hits) == k or scores[i] < min_score:
                break
            c = self.chunks[i]
            hits.append({"id": c["id"], "doc": c["doc"], "title": c["title"], "source": c["source"],
                         "snippet": c["text"][:280], "score": round(float(scores[i]), 3)})
        return hits


@lru_cache(maxsize=1)
def default_index() -> Index:
    return Index(load_chunks())


def topics_for_train(snap: FleetSnapshot, train_id: str) -> list[tuple[str, str]]:
    """(topic shown to the user, retrieval query) for each issue this train has tonight."""
    # Most serious first: blocking faults and certificates, then compressor alerts, then minor jobs.
    topics = [(f"{j['wonum']}: {j['description']}", j["description"]) for j in open_critical_jobs(snap, train_id)]
    for c in expired_certificates(snap, train_id):
        topics.append((f"{CERT_LABEL[c['kind']]} certificate expired", "fitness certificate renewal expired"))
    apu = snap.apu.get(train_id)
    if apu and apu["risk"] >= APU_ALERT_AT:
        topics.append((f"Compressor (APU) fault risk {round(apu['risk'] * 100)}%",
                       "compressor air leak pressure drop LPS air production unit"))
    if apu and apu.get("low_pressure_minutes", 0) > 0:
        topics.append((f"Air pressure below 7 bar for {apu['low_pressure_minutes']:g} min",
                       "LPS low pressure signal below 7 bar"))
    topics += [(f"{j['wonum']}: {j['description']}", j["description"]) for j in open_noncritical_jobs(snap, train_id)]
    train = next((t for t in snap.trains if t["train_id"] == train_id), None)
    if train and cleaning_due(snap, train):
        topics.append(("Cleaning due", "cleaning backlog overdue"))
    return topics


def related_for_train(snap: FleetSnapshot, train_id: str, k: int = 3, index: Index | None = None) -> list[dict]:
    index = index or default_index()
    return [{"topic": topic, "query": q,
             "guidance": index.search(q, k=2, docs=GUIDANCE_DOCS),
             "past_cases": index.search(q, k=k, docs=HISTORY_DOCS)}
            for topic, q in topics_for_train(snap, train_id)]
