# app/services/recommender.py

from collections import deque
from dataclasses import dataclass
from itertools import combinations
import heapq
from typing import Dict, Iterable, List, Optional, Set, Tuple

AttributeBundle = Dict[str, List[str]]

@dataclass
class OutfitItem:
    item_id: str
    attributes: AttributeBundle

def _flatten_to_node_ids(attributes: AttributeBundle) -> List[str]:
    namespace_map = {
        "dominant_colors": "color",
        "preferred_fits": "fit",
        "common_patterns": "pattern",
        "styles": "style",
    }
    node_ids: List[str] = []
    for field_name, values in attributes.items():
        namespace = namespace_map.get(field_name, field_name)
        for value in values:
            if isinstance(value, str):
                node_ids.append(f"{namespace}:{value.strip().lower()}")
    return node_ids


class AttributeGraph:
    def __init__(
        self,
        like_lr: float = 1.0,
        dislike_lr: float = 0.5,
        node_floor: float = -5.0,
        node_ceiling: float = 50.0,
    ) -> None:
        self.node_weights: Dict[str, float] = {}
        self.adjacency: Dict[str, Dict[str, float]] = {}
        self.like_lr = like_lr
        self.dislike_lr = dislike_lr
        self.node_floor = node_floor
        self.node_ceiling = node_ceiling

    def _ensure_node(self, node_id: str) -> None:
        if node_id not in self.node_weights:
            self.node_weights[node_id] = 0.0
            self.adjacency[node_id] = {}

    def _bump_node(self, node_id: str, delta: float) -> None:
        self._ensure_node(node_id)
        new_weight = self.node_weights[node_id] + delta
        self.node_weights[node_id] = max(
            self.node_floor, min(self.node_ceiling, new_weight)
        )

    def _bump_edge(self, a: str, b: str, delta: float) -> None:
        self._ensure_node(a)
        self._ensure_node(b)
        self.adjacency[a][b] = self.adjacency[a].get(b, 0.0) + delta
        self.adjacency[b][a] = self.adjacency[b].get(a, 0.0) + delta
        self.adjacency[a][b] = max(0.0, self.adjacency[a][b])
        self.adjacency[b][a] = max(0.0, self.adjacency[b][a])

    def record_swipe(self, attributes: AttributeBundle, liked: bool) -> None:
        node_ids = _flatten_to_node_ids(attributes)
        if not node_ids:
            return

        delta = self.like_lr if liked else -self.dislike_lr
        for node_id in node_ids:
            self._bump_node(node_id, delta)

        if liked:
            for a, b in combinations(sorted(set(node_ids)), 2):
                self._bump_edge(a, b, self.like_lr)

    def top_nodes(self, n: int = 5) -> List[Tuple[str, float]]:
        return heapq.nlargest(n, self.node_weights.items(), key=lambda kv: kv[1])

    def _spread_activation(
        self,
        seed_ids: Iterable[str],
        max_depth: int = 2,
        decay: float = 0.5,
    ) -> Dict[str, float]:
        activation: Dict[str, float] = {}
        visited: Set[str] = set()
        queue: deque[Tuple[str, float, int]] = deque()

        for seed in seed_ids:
            if seed in self.node_weights:
                queue.append((seed, self.node_weights[seed], 0))

        while queue:
            node_id, incoming_score, depth = queue.popleft()
            if node_id in visited:
                continue
            visited.add(node_id)
            activation[node_id] = activation.get(node_id, 0.0) + incoming_score

            if depth >= max_depth:
                continue

            for neighbor, edge_weight in self.adjacency.get(node_id, {}).items():
                if neighbor in visited:
                    continue
                propagated = incoming_score * edge_weight * (decay ** (depth + 1))
                if propagated > 0:
                    queue.append((neighbor, propagated, depth + 1))

        return activation


class OutfitRecommender:
    def __init__(self, graph: Optional[AttributeGraph] = None) -> None:
        self.graph = graph or AttributeGraph()

    def record_swipe(self, attributes: AttributeBundle, liked: bool) -> None:
        self.graph.record_swipe(attributes, liked)

    def get_user_profile(self) -> Dict:
        return {
            "top_attributes": self.graph.top_nodes(10),
            "total_nodes": len(self.graph.node_weights),
            "node_weights": self.graph.node_weights
        }