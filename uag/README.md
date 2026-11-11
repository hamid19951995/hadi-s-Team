# UAG — Universal Agent Graph

چرخه کامل: **ایده → مدل‌ها → سورس → ادغام → پیش‌نمایش → دیباگ → انتشار**

## نصب

```bash
cd uag
pip install -e .
export PYTHONPATH=.
```

## چرخه تولید (11 مرحله)

```bash
python -c "from uag.pipeline import run_pipeline; run_pipeline('ایده شما')"
# یا
python -m uag.cli pipeline "ایده شما" -o ./out
```

## مهندسی معکوس + بازسازی از ریپو

```python
from uag.bridge import rebuild_from_hadi_defaults, capability_bridge

result = rebuild_from_hadi_defaults("API برای health و وضعیت")
print(result["pipeline"]["status"])
print(result["reverse"]["entrypoints"])
print(capability_bridge())
```

## پل به engine/ پروژه hadi-s-Team

| hadi engine | UAG |
|-------------|-----|
| task_graph | AgentGraph |
| orchestrator | ProductionCycle |
| provider_router | LLMClient |
| tool_executor | sandbox + connectors |
| memory | db.Store |
| dispatcher | FastAPI api |

## API

```bash
uvicorn uag.api.app:app --port 8700
curl localhost:8700/health
curl -X POST localhost:8700/pipeline -H 'Content-Type: application/json' -d '{"idea":"..."}'
```

## CLI

```bash
uag status
uag node "عنوان" -m grok-4,claude-4
uag run <id> -p "پرامپت"
uag merge <id1>,<id2> -o out.py
uag pipeline "ایده"
uag demo
```

## تست

```bash
pytest uag/tests/ -v
```

## ساختار

- `pipeline.py` — ProductionCycle (11 steps)
- `bridge.py` — reverse → pipeline + نقشه engine
- `reverse.py` — تحلیل درخت ریپو
- `templates.py` — قالب سورس بر اساس intent
- `engine.py` / `llm.py` / `cli.py` / `api/` / `db/`

## نسخه

0.1.0
