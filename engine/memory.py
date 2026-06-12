import logging
import asyncio
from typing import Dict, List, Optional, Set
from uuid import UUID, uuid4
from datetime import datetime
from schemas import MemoryEntry, MemoryType

logger = logging.getLogger("studio.engine.memory")

class MemoryManager:
    """
    Subsystem managing context storage across Working, Episodic, Semantic, and Procedural memory zones.
    Calculates decay curves and supports associative keyword-based semantic retrieval.
    """
    def __init__(self):
        # Memory stores separated by partition type
        self._partitions: Dict[MemoryType, Dict[UUID, MemoryEntry]] = {
            t: {} for t in MemoryType
        }
        self._lock = asyncio.Lock()

    async def store(self, entry: MemoryEntry) -> MemoryEntry:
        """
        Ingests a new MemoryEntry into the specified memory partition.
        """
        async with self._lock:
            # Sync timestamp if absent
            if not entry.created_at:
                entry.created_at = datetime.utcnow()
            
            self._partitions[entry.type][entry.memory_id] = entry
            logger.debug(f"Stored {entry.type.value} memory entry: {entry.memory_id}")
            return entry

    async def store_quick(self, memory_type: MemoryType, content: str, metadata: dict = None) -> MemoryEntry:
        """
        Helper method to quickly cache a memory block in a single call.
        """
        entry = MemoryEntry(
            memory_id=uuid4(),
            type=memory_type,
            content=content,
            metadata=metadata or {},
            created_at=datetime.utcnow(),
            decay_factor=1.0
        )
        return await self.store(entry)

    async def retrieve_by_id(self, memory_id: UUID) -> Optional[MemoryEntry]:
        """
        Direct exact-match identification retrieval.
        """
        async with self._lock:
            for partition in self._partitions.values():
                if memory_id in partition:
                    return partition[memory_id]
            return None

    async def retrieve_partition(self, memory_type: MemoryType) -> List[MemoryEntry]:
        """
        Extracts all entries compiled within a specific operational partition.
        """
        async with self._lock:
            return list(self._partitions[memory_type].values())

    async def search_similar(self, query: str, memory_type: MemoryType, max_results: int = 5) -> List[MemoryEntry]:
        """
        Locates memory entries within a partition that match the query string.
        Utilizes direct keyword intersections, token overlaps, and tags-matching heuristic calculations
        to simulate high-speed vector retrieval.
        """
        async with self._lock:
            partition = self._partitions[memory_type]
            if not partition:
                return []

            query_tokens = set(query.lower().split())
            rankings = []

            for entry in partition.values():
                # Decay factor check to reduce salience of stale entries
                current_time = datetime.utcnow()
                elapsed_seconds = (current_time - entry.created_at).total_seconds()
                
                # Dynamic decay calculation
                # Halflife simulated over metadata decay periods
                decay = entry.decay_factor
                if "decay_rate" in entry.metadata:
                    decay = max(0.1, decay - (elapsed_seconds * entry.metadata["decay_rate"]))
                elif entry.type == MemoryType.WORKING:
                    # Working memory decays quickly (e.g., decays by 20% every hour if not used)
                    decay = max(0.05, decay * (0.8 ** (elapsed_seconds / 3600.0)))

                # Keyword intersection matching
                content_tokens = set(entry.content.lower().split())
                intersection = query_tokens.intersection(content_tokens)
                
                score = len(intersection) / max(1, len(query_tokens))
                
                # metadata keyword tagging multipliers
                metadata_tags = entry.metadata.get("tags", [])
                for tag in metadata_tags:
                    if str(tag).lower() in query_tokens:
                        score += 0.5

                # Weight score by decay relevance factor
                final_score = score * decay
                rankings.append((final_score, entry))

            # Filter out zero matching items first
            matches = [item for score, item in rankings if score > 0.0]
            matches.sort(key=lambda x: rankings[0][0], reverse=True) # Sort descendants by matching score
            
            # Decay actual recorded coefficients inside the retrieved subset to track retrieval cycles
            for score, entry in matches[:max_results]:
                # Increment decay multiplier slightly when accessed (reinforces memory trace)
                entry.decay_factor = min(1.0, entry.decay_factor + 0.05)

            return [entry for score, entry in matches[:max_results]]

    async def consolidate_working_to_semantic(self) -> List[MemoryEntry]:
        """
        Summarizes floating working memories into solid semantic facts, e.g. after a task cycles down.
        """
        async with self._lock:
            working_entries = list(self._partitions[MemoryType.WORKING].values())
            if not working_entries:
                return []

            # Simulate consolidation logic
            consolidated: List[MemoryEntry] = []
            logger.info(f"Consolidating {len(working_entries)} working memories into Semantic storage.")
            
            # Collate by topic tag
            topic_groups: Dict[str, List[str]] = {}
            for entry in working_entries:
                topic = entry.metadata.get("topic", "general_fact")
                if topic not in topic_groups:
                    topic_groups[topic] = []
                topic_groups[topic].append(entry.content)

            for topic, facts in topic_groups.items():
                synthesized_content = f"Synthesized understanding of topic [{topic}]: " + " | ".join(facts)
                semantic_entry = MemoryEntry(
                    memory_id=uuid4(),
                    type=MemoryType.SEMANTIC,
                    content=synthesized_content,
                    metadata={"topic": topic, "constructed_from": "consolidation", "sources": [str(e.memory_id) for e in working_entries]},
                    created_at=datetime.utcnow(),
                    decay_factor=1.0
                )
                
                # Store the consolidated memory
                self._partitions[MemoryType.SEMANTIC][semantic_entry.memory_id] = semantic_entry
                consolidated.append(semantic_entry)

            # Clear temporary working memory partition
            self._partitions[MemoryType.WORKING].clear()
            return consolidated

    async def clear_partition(self, memory_type: MemoryType) -> None:
        """
        Resets and clears targeted memories.
        """
        async with self._lock:
            self._partitions[memory_type].clear()
            logger.warning(f"Cleared memory partition {memory_type.value}")
