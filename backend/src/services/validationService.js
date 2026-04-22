const logger = require('../utils/logger');

async function runValidationEngine(idea) {
  const score = idea.scoring?.opportunityScore || 70;

  // Scoring decomposition
  const components = idea.scoring?.components || {};
  const trendStrength = components.trendStrength?.score || 75;
  const painIntensity = components.painIntensity?.score || 80;
  const marketSize = components.marketSize?.score || 70;
  const competitionDensity = components.competitionDensity?.score || 65;
  const executionComplexity = components.executionComplexity?.score || 60;

  // Weighted score recalculation
  const weightedScore = (
    trendStrength * 0.30 +
    painIntensity * 0.25 +
    marketSize * 0.20 +
    competitionDensity * 0.15 +
    executionComplexity * 0.10
  );

  // Kill-switch checks
  const killSwitches = [];
  if (executionComplexity < 30) killSwitches.push({ flag: 'EXECUTION_COMPLEXITY_CRITICAL', description: 'Technical implementation may require 18+ months. Consider simpler MVP.', severity: 'high' });
  if (competitionDensity < 20) killSwitches.push({ flag: 'HYPER_COMPETITIVE_MARKET', description: 'Market is extremely crowded. Need extreme differentiation.', severity: 'critical' });
  if (idea.risks?.overallRisk === 'critical') killSwitches.push({ flag: 'CRITICAL_REGULATORY_RISK', description: 'Regulatory risk could shut down business. Consult lawyer first.', severity: 'critical' });

  // Opportunity windows
  const opportunityWindows = [
    score >= 80 ? { window: 'NOW', urgency: 'critical', reason: 'Trend is accelerating. 6-12 month window before saturation.' } : null,
    score >= 60 && score < 80 ? { window: '3-6 MONTHS', urgency: 'high', reason: 'Growing market. Early movers will have advantage.' } : null,
    score < 60 ? { window: '6-18 MONTHS', urgency: 'medium', reason: 'Market still forming. Education phase required.' } : null,
  ].filter(Boolean);

  // PMF indicators
  const pmfIndicators = {
    redditEngagement: (idea.evidence?.redditQuotes?.length || 0) > 2 ? 'Strong - multiple high-upvote complaints' : 'Moderate',
    evidenceStrength: (idea.evidence?.newsCitations?.length || 0) > 1 ? 'Multi-source validation' : 'Single source',
    competitorGap: (idea.competitorGhostingInsights?.length || 0) > 0 ? 'Clear gaps identified' : 'Gaps unclear',
    marketTiming: idea.whyNow?.triggers?.length > 0 ? 'Strong temporal signals' : 'Timing uncertain',
  };

  // Confidence intervals
  const confidence = {
    overall: Math.min(95, Math.max(55, weightedScore + 10)),
    marketSize: 72,
    competitorAnalysis: 80,
    technicalFeasibility: idea.execution?.mvpPlan ? 88 : 60,
  };

  // Recommendations
  const recommendations = [];
  if (score >= 80) recommendations.push({ priority: 1, action: 'Start building immediately', detail: 'This is a high-signal opportunity. Build MVP in 72 hours.' });
  if (trendStrength < 60) recommendations.push({ priority: 2, action: 'Validate trend strength', detail: 'Run Google Trends analysis and search volume for core keywords before committing.' });
  if (killSwitches.length === 0) recommendations.push({ priority: 3, action: 'Launch smoke test', detail: 'No critical blockers. Create landing page and run $500 ad spend test.' });

  return {
    ideaId: idea._id,
    title: idea.title,
    validatedAt: new Date(),
    opportunityScore: Math.round(weightedScore),
    confidence,
    killSwitches,
    opportunityWindows,
    pmfIndicators,
    recommendations,
    verdict: killSwitches.some(k => k.severity === 'critical') ? 'PROCEED_WITH_CAUTION' : score >= 75 ? 'STRONG_BUY' : score >= 55 ? 'WORTH_EXPLORING' : 'WEAK_SIGNAL',
    verdictReason: score >= 75 ? 'High opportunity score with strong evidence trail and clear market gap.' : 'Moderate opportunity. Validate core assumptions before building.',
  };
}

module.exports = { runValidationEngine };
