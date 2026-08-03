export type CriterionDirection = "benefit" | "cost";

export interface DecisionCriterion {
  id: string;
  name: string;
  weight: number;
  direction: CriterionDirection;
}

export interface DecisionOption {
  id: string;
  name: string;
  scores: Record<string, number>;
}

export interface DecisionAnalysisRequest {
  title: string;
  objective: string;
  criteria: DecisionCriterion[];
  options: DecisionOption[];
}

export interface CriterionContribution {
  criterion_id: string;
  criterion_name: string;
  raw_score: number;
  adjusted_score: number;
  weighted_points: number;
}

export interface RankedOption {
  option_id: string;
  option_name: string;
  rank: number;
  score: number;
  contributions: CriterionContribution[];
  weaknesses: string[];
}

export interface DecisionAnalysis {
  title: string;
  recommended_option_id: string;
  ranking: RankedOption[];
  score_gap: number;
  stability: "stable" | "sensitive";
  sensitive_criteria: string[];
  warnings: string[];
  methodology: string;
}

export async function analyzeDecision(
  request: DecisionAnalysisRequest,
  signal?: AbortSignal,
): Promise<DecisionAnalysis> {
  const response = await fetch("/api/v1/decisions/analyze", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal,
  });
  if (!response.ok) {
    throw new Error(
      response.status === 422
        ? "输入内容未通过校验，请检查方案、维度、权重和评分。"
        : `分析服务暂时不可用（${response.status}）`,
    );
  }
  return (await response.json()) as DecisionAnalysis;
}
