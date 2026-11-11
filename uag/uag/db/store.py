"""
Persistent store for UAG — SQLite by default, Neon/Postgres-ready schema.
"""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


DEFAULT_DB = Path(os.getenv("UAG_DB_PATH", str(Path.home() / ".uag" / "uag.db")))


SCHEMA = """
CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    models TEXT NOT NULL,
    status TEXT DEFAULT 'idle',
    prompt TEXT DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    provider TEXT DEFAULT 'simulation',
    content TEXT NOT NULL,
    score REAL DEFAULT 0,
    error TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (node_id) REFERENCES nodes(id)
);

CREATE TABLE IF NOT EXISTS merges (
    id TEXT PRIMARY KEY,
    source_node_ids TEXT NOT NULL,
    mode TEXT NOT NULL,
    final_content TEXT NOT NULL,
    status TEXT DEFAULT 'done',
    steps_json TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    ref_id TEXT,
    meta_json TEXT,
    created_at TEXT NOT NULL
);
"""


class Store:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = Path(db_path) if db_path else DEFAULT_DB
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init()

    def _init(self):
        with self._conn() as c:
            c.executescript(SCHEMA)

    @contextmanager
    def _conn(self):
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def save_node(self, node_id: str, title: str, models: List[str], status: str = "idle", prompt: str = ""):
        with self._conn() as c:
            c.execute(
                """INSERT OR REPLACE INTO nodes (id, title, models, status, prompt, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (node_id, title, json.dumps(models), status, prompt, datetime.utcnow().isoformat()),
            )

    def save_output(self, node_id: str, model_id: str, content: str, provider: str = "simulation", score: float = 0, error: str = None):
        with self._conn() as c:
            c.execute(
                """INSERT INTO outputs (node_id, model_id, provider, content, score, error, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (node_id, model_id, provider, content, score, error, datetime.utcnow().isoformat()),
            )

    def save_merge(self, merge_id: str, source_ids: List[str], mode: str, final_content: str, steps: Any = None, status: str = "done"):
        with self._conn() as c:
            c.execute(
                """INSERT OR REPLACE INTO merges (id, source_node_ids, mode, final_content, status, steps_json, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    merge_id,
                    json.dumps(source_ids),
                    mode,
                    final_content,
                    status,
                    json.dumps(steps) if steps else None,
                    datetime.utcnow().isoformat(),
                ),
            )

    def list_nodes(self) -> List[Dict]:
        with self._conn() as c:
            rows = c.execute("SELECT * FROM nodes ORDER BY created_at DESC").fetchall()
            return [dict(r) for r in rows]

    def list_merges(self) -> List[Dict]:
        with self._conn() as c:
            rows = c.execute("SELECT id, mode, status, created_at, length(final_content) as content_len FROM merges ORDER BY created_at DESC").fetchall()
            return [dict(r) for r in rows]

    def get_merge(self, merge_id: str) -> Optional[Dict]:
        with self._conn() as c:
            row = c.execute("SELECT * FROM merges WHERE id = ?", (merge_id,)).fetchone()
            return dict(row) if row else None

    def log_run(self, kind: str, ref_id: str = None, meta: Dict = None):
        with self._conn() as c:
            c.execute(
                "INSERT INTO runs (kind, ref_id, meta_json, created_at) VALUES (?, ?, ?, ?)",
                (kind, ref_id, json.dumps(meta or {}), datetime.utcnow().isoformat()),
            )

    def stats(self) -> Dict[str, int]:
        with self._conn() as c:
            nodes = c.execute("SELECT COUNT(*) FROM nodes").fetchone()[0]
            outputs = c.execute("SELECT COUNT(*) FROM outputs").fetchone()[0]
            merges = c.execute("SELECT COUNT(*) FROM merges").fetchone()[0]
            runs = c.execute("SELECT COUNT(*) FROM runs").fetchone()[0]
        return {"nodes": nodes, "outputs": outputs, "merges": merges, "runs": runs}


_store: Optional[Store] = None


def get_store() -> Store:
    global _store
    if _store is None:
        _store = Store()
    return _store
