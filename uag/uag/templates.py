"""Intent-based source templates for pipeline fallback."""

from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .pipeline import IntentSpec


def intent_template(intent) -> str:
    goal = intent.goal
    if any(k in goal for k in ("تسک", "task", "todo")):
        return """from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from uuid import uuid4

app = FastAPI(title="Task Manager API", version="0.1.0")

class TaskCreate(BaseModel):
    title: str
    done: bool = False

class Task(TaskCreate):
    id: str

_DB: dict[str, Task] = {}

@app.get("/health")
def health():
    return {"status": "ok", "service": "task-manager", "tasks": len(_DB)}

@app.get("/tasks", response_model=List[Task])
def list_tasks():
    return list(_DB.values())

@app.post("/tasks", response_model=Task)
def create_task(body: TaskCreate):
    t = Task(id=str(uuid4())[:8], title=body.title, done=body.done)
    _DB[t.id] = t
    return t

@app.get("/tasks/{task_id}", response_model=Task)
def get_task(task_id: str):
    if task_id not in _DB:
        raise HTTPException(404, "Task not found")
    return _DB[task_id]

@app.delete("/tasks/{task_id}")
def delete_task(task_id: str):
    if task_id not in _DB:
        raise HTTPException(404, "Task not found")
    del _DB[task_id]
    return {"deleted": task_id}
"""
    return f"""from fastapi import FastAPI

app = FastAPI(title="UAG Generated API", version="0.1.0")

@app.get("/health")
def health():
    return {{"status": "ok", "goal": {goal[:120]!r}}}
"""
