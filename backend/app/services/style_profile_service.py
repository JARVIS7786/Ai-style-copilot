from collections import Counter

from app.schemas.style import StyleAnalysis, StyleProfile


class StyleProfileService:

    def build_profile(
        self,
        analyses: list[StyleAnalysis],
    ) -> StyleProfile:

        if not analyses:
            raise ValueError("At least one style analysis is required.")

        styles = self._most_common(
            item
            for analysis in analyses
            for item in analysis.style
        )

        colors = self._most_common(
            item
            for analysis in analyses
            for item in analysis.dominant_colors
        )

        fits = self._most_common(
            item.fit
            for analysis in analyses
            for item in analysis.clothing
        )

        patterns = self._most_common(
            item.pattern
            for analysis in analyses
            for item in analysis.clothing
        )

        occasions = self._most_common(
            item
            for analysis in analyses
            for item in analysis.occasions
        )

        return StyleProfile(
            styles=styles,
            preferred_colors=colors,
            preferred_fits=fits,
            common_patterns=patterns,
            occasions=occasions,
        )

    @staticmethod
    def _most_common(items, limit: int = 5) -> list[str]:
        counts = Counter(items)

        return [
            item
            for item, _ in counts.most_common(limit)
        ]