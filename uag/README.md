# UAG — Universal Agent Graph

**حرفه‌ای · واقعی · چندمدلی · ادغام هوشمند**

کتابخانه و CLI برای orchestration چند مدل هوش مصنوعی روی یک گراف، با ادغام هوشمند نتایج و تولید سورس قابل اجرا.

## نصب

```bash
cd uag
pip install -e .
```

## کلیدهای API (اختیاری)

```bash
export XAI_API_KEY=...
export OPENAI_API_KEY=...
export ANTHROPIC_API_KEY=...
```

## دستورات CLI

```bash
uag status
uag node "طراحی API" -m grok-4,claude-4
uag list
uag run <node_id> -p "یک FastAPI برای ادغام متن بساز"
uag merge <id1>,<id2> --mode synthesis -o result.py
uag demo
```

## API

```bash
uvicorn uag.api.app:app --port 8700
curl localhost:8700/health
```

## تست

```bash
pytest uag/tests/ -v
```

## نسخه

0.1.0
