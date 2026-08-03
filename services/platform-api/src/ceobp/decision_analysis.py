"""Transparent weighted decision analysis domain rules."""

from __future__ import annotations

from ceobp.schemas import (
    CriterionContribution,
    DecisionAnalysisRequest,
    DecisionAnalysisResponse,
    RankedOption,
)


def _adjusted_score(raw_score: float, direction: str) -> float:
    return raw_score if direction == "benefit" else 100 - raw_score


def _option_score(
    request: DecisionAnalysisRequest,
    option_index: int,
    weights: dict[str, float],
) -> float:
    option = request.options[option_index]
    weight_total = sum(weights.values())
    return sum(
        _adjusted_score(option.scores[criterion.id], criterion.direction)
        * weights[criterion.id]
        / weight_total
        for criterion in request.criteria
    )


def _rank_indices(
    request: DecisionAnalysisRequest,
    weights: dict[str, float],
) -> list[int]:
    return sorted(
        range(len(request.options)),
        key=lambda index: (-_option_score(request, index, weights), index),
    )


def analyze_decision(request: DecisionAnalysisRequest) -> DecisionAnalysisResponse:
    """Score, rank and stress-test a user-supplied decision matrix."""

    weights = {criterion.id: criterion.weight for criterion in request.criteria}
    weight_total = sum(weights.values())
    ranked_indices = _rank_indices(request, weights)
    winner_index = ranked_indices[0]

    ranking: list[RankedOption] = []
    for rank, option_index in enumerate(ranked_indices, start=1):
        option = request.options[option_index]
        contributions: list[CriterionContribution] = []
        weaknesses: list[str] = []
        for criterion in request.criteria:
            raw_score = option.scores[criterion.id]
            adjusted = _adjusted_score(raw_score, criterion.direction)
            weighted_points = adjusted * criterion.weight / weight_total
            contributions.append(
                CriterionContribution(
                    criterion_id=criterion.id,
                    criterion_name=criterion.name,
                    raw_score=raw_score,
                    adjusted_score=adjusted,
                    weighted_points=round(weighted_points, 2),
                )
            )
            if adjusted < 40 and criterion.weight / weight_total >= 0.2:
                weaknesses.append(criterion.name)

        ranking.append(
            RankedOption(
                option_id=option.id,
                option_name=option.name,
                rank=rank,
                score=round(_option_score(request, option_index, weights), 2),
                contributions=contributions,
                weaknesses=weaknesses,
            )
        )

    sensitive_criteria: list[str] = []
    for criterion in request.criteria:
        for factor in (0.8, 1.2):
            varied_weights = dict(weights)
            varied_weights[criterion.id] *= factor
            if _rank_indices(request, varied_weights)[0] != winner_index:
                sensitive_criteria.append(criterion.name)
                break

    score_gap = round(ranking[0].score - ranking[1].score, 2)
    warnings = ["分析结果基于本次输入的评分, 不替代经营事实核验和最终审批。"]
    if abs(weight_total - 100) > 0.01:
        warnings.append(f"当前权重合计为 {weight_total:g}%, 计算时已按比例归一化。")
    if score_gap < 5:
        warnings.append("前两名综合得分接近, 建议补充证据或重新校准关键评分。")
    if sensitive_criteria:
        warnings.append("小幅调整部分权重会改变首选方案, 结论对权重较敏感。")

    return DecisionAnalysisResponse(
        title=request.title,
        recommended_option_id=request.options[winner_index].id,
        ranking=ranking,
        score_gap=score_gap,
        stability="sensitive" if sensitive_criteria else "stable",
        sensitive_criteria=sensitive_criteria,
        warnings=warnings,
        methodology=(
            "归一化加权评分; 成本型维度按 100-原始评分换算; "
            "权重上下浮动 20% 进行敏感性检查。"
        ),
    )
