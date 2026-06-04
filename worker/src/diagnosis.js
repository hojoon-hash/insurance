// 진단 점수 계산 로직 (HTTP 프레임워크 비의존 순수 함수)

const analyzeCategory = (categoryType, score, answers) => {
  const categories = {
    cavity_nerve: {
      displayName: '충치·신경 치료',
      medicalName: '보존치료',
      icon: '🦷',
      description: '치아를 뽑지 않고 살리는 치료',
      examples: ['충치 때우기 (레진, 인레이)', '신경 치료 (근관치료)', '이 시릴 때 치료'],
      threshold: 70,
    },
    crown_implant: {
      displayName: '크라운·임플란트',
      medicalName: '보철치료',
      icon: '🔧',
      description: '상한 치아를 씌우거나 새로 심는 치료',
      examples: ['금니, 지르코니아 (크라운)', '임플란트 (이 심기)', '브릿지, 틀니'],
      threshold: 65,
    },
    gum_disease: {
      displayName: '잇몸 질환',
      medicalName: '치주치료',
      icon: '🩸',
      description: '피나는 잇몸, 흔들리는 이를 치료',
      examples: ['스케일링 (치석 제거)', '잇몸 속 치료 (치주 소파술)', '잇몸 수술'],
      threshold: 75,
    },
  };

  const category = categories[categoryType];
  const percentage = Math.min(100, Math.max(0, score + (categoryType === 'gum_disease' ? 5 : 0)));

  let status = '적정';
  if (percentage < category.threshold) {
    status = percentage < category.threshold - 20 ? '매우 부족' : '부족';
  }

  const baseCoverage = {
    cavity_nerve: 1000000,
    crown_implant: 1200000,
    gum_disease: 800000,
  };

  const currentCoverage = Math.floor(baseCoverage[categoryType] * (percentage / 100));
  const recommendedCoverage = baseCoverage[categoryType];
  const shortfall = recommendedCoverage - currentCoverage;

  let relatedSymptoms = null;
  if (categoryType === 'crown_implant') {
    if (answers.concerns?.includes('임플란트 (이 빠지면) 💰')) {
      relatedSymptoms = '⚠️ 당신의 선택: 임플란트 고민 → 긴급 보완 필요!';
    }
  } else if (categoryType === 'gum_disease') {
    if (answers.symptoms?.some((s) => s.includes('잇몸') || s.includes('피'))) {
      relatedSymptoms = '⚠️ 당신의 증상: 잇몸 피남/시림 → 지금 당장 보장 추가!';
    }
  } else if (categoryType === 'cavity_nerve') {
    if (answers.dentalHistory?.includes('충치 치료 (때우기)')) {
      relatedSymptoms = '⚠️ 치료 이력 있음 → 보장 상향 추천';
    }
  }

  return {
    displayName: category.displayName,
    medicalName: category.medicalName,
    icon: category.icon,
    description: category.description,
    status,
    percentage: Math.floor(percentage),
    currentCoverage,
    recommendedCoverage,
    shortfall,
    examples: category.examples,
    relatedSymptoms,
  };
};

const calculateLeadScore = (score, riskFactors) => {
  let leadScore = 0;
  if (score < 40) leadScore += 40;
  else if (score < 60) leadScore += 30;
  else if (score < 80) leadScore += 15;

  leadScore += riskFactors.length * 5;

  const highRisk = riskFactors.filter((r) => r.severity === 'high').length;
  leadScore += highRisk * 10;

  return {
    score: leadScore,
    quality: leadScore >= 80 ? 'HOT' : leadScore >= 50 ? 'WARM' : 'COLD',
    priority: leadScore >= 80 ? 1 : leadScore >= 50 ? 2 : 3,
  };
};

const calculateInsurancePremium = (score, riskFactors, concerns) => {
  const basePremium = { basic: 20000, standard: 35000, premium: 60000 };

  let currentPremium;
  if (score >= 70) currentPremium = basePremium.basic;
  else if (score >= 50) currentPremium = basePremium.standard;
  else currentPremium = basePremium.premium;

  let recommendedPremium = basePremium.standard;

  const highRiskCount = riskFactors.filter((r) => r.severity === 'high').length;
  if (highRiskCount >= 2 || concerns?.some((c) => c.includes('임플란트') || c.includes('틀니'))) {
    recommendedPremium = basePremium.premium;
  }

  const currentAnnual = currentPremium * 12;
  const recommendedAnnual = recommendedPremium * 12;
  const annualDifference = recommendedAnnual - currentAnnual;

  return {
    current: {
      monthly: currentPremium,
      annual: currentAnnual,
      type:
        currentPremium === basePremium.basic
          ? '기본형'
          : currentPremium === basePremium.standard
          ? '표준형'
          : '프리미엄형',
    },
    recommended: {
      monthly: recommendedPremium,
      annual: recommendedAnnual,
      type:
        recommendedPremium === basePremium.basic
          ? '기본형'
          : recommendedPremium === basePremium.standard
          ? '표준형'
          : '프리미엄형',
    },
    difference: { monthly: annualDifference / 12, annual: annualDifference },
    isUpgradeNeeded: recommendedPremium > currentPremium,
  };
};

export const calculateDetailedScore = (answers) => {
  let score = 100;
  let riskFactors = [];
  let scenarioCosts = [];

  const ageScores = {
    '20대': -5,
    '30대': -8,
    '40대': -12,
    '50대': -18,
    '60대 이상': -25,
  };
  const ageDeduction = ageScores[answers.ageGroup] || -10;
  score += ageDeduction;

  if (answers.ageGroup === '40대' || answers.ageGroup === '50대' || answers.ageGroup === '60대 이상') {
    riskFactors.push({
      category: '연령 위험도',
      detail: `${answers.ageGroup}: 치아 노화로 인한 치료 가능성 증가`,
      severity: answers.ageGroup === '50대' || answers.ageGroup === '60대 이상' ? 'high' : 'medium',
    });
  }

  const historyScores = {
    '없어요 (건강해요)': 0,
    '스케일링만 받았어요': -5,
    '충치 치료 (때우기)': -10,
    '신경 치료 (크라운 씌움)': -15,
    '이를 뺐어요': -20,
    '임플란트/브릿지': -25,
  };

  if (Array.isArray(answers.dentalHistory)) {
    answers.dentalHistory.forEach((history) => {
      const deduction = historyScores[history] || 0;
      score += deduction;
      if (deduction < 0) {
        riskFactors.push({
          category: '치료 이력',
          detail: history,
          severity: Math.abs(deduction) >= 15 ? 'high' : 'medium',
        });

        if (history === '신경 치료 (크라운 씌움)') {
          scenarioCosts.push({ item: '크라운 재치료 가능성', cost: 800000 });
        } else if (history === '임플란트/브릿지') {
          scenarioCosts.push({ item: '추가 임플란트 가능성', cost: 1200000 });
        }
      }
    });
  }

  const symptomScores = {
    '없어요 (괜찮아요)': 0,
    '양치할 때 피가 나요 🩸': -8,
    '찬물 마시면 시려요 🧊': -6,
    '씹을 때 아파요 😣': -10,
    '이가 흔들려요 💨': -15,
    '잇몸이 자주 부어요 🔥': -8,
  };

  if (Array.isArray(answers.symptoms)) {
    answers.symptoms.forEach((symptom) => {
      const deduction = symptomScores[symptom] || 0;
      score += deduction;
      if (deduction < 0) {
        riskFactors.push({
          category: '현재 증상',
          detail: symptom,
          severity: Math.abs(deduction) >= 10 ? 'high' : 'medium',
        });

        if (symptom === '이가 흔들려요 💨') {
          scenarioCosts.push({ item: '임플란트 필요 가능성', cost: 1200000 });
        } else if (symptom.includes('잇몸') || symptom.includes('피')) {
          scenarioCosts.push({ item: '잇몸 치료', cost: 500000 });
        }
      }
    });
  }

  const concernScores = {
    '없어요': 0,
    '임플란트 (이 빠지면) 💰': -15,
    '크라운·금니 (씌우기) 👑': -8,
    '자녀 치아 교정 👶': -5,
    '부모님 틀니 👴': -10,
    '잇몸 치료 (치주염) 🦷': -8,
  };

  if (Array.isArray(answers.concerns)) {
    answers.concerns.forEach((concern) => {
      const deduction = concernScores[concern] || 0;
      score += deduction;
      if (deduction < 0) {
        riskFactors.push({
          category: '미래 걱정',
          detail: concern,
          severity: Math.abs(deduction) >= 10 ? 'high' : 'medium',
        });

        if (concern.includes('임플란트')) {
          scenarioCosts.push({ item: '임플란트 (평균 2개)', cost: 2400000 });
        } else if (concern.includes('교정')) {
          scenarioCosts.push({ item: '자녀 교정', cost: 4500000 });
        } else if (concern.includes('틀니')) {
          scenarioCosts.push({ item: '부모님 틀니', cost: 3000000 });
        } else if (concern.includes('크라운')) {
          scenarioCosts.push({ item: '크라운 치료', cost: 500000 });
        } else if (concern.includes('잇몸')) {
          scenarioCosts.push({ item: '잇몸 치료', cost: 800000 });
        }
      }
    });
  }

  score = Math.max(0, Math.min(85, score));

  if (score > 75) {
    score -= 5;
    riskFactors.push({
      category: '예방 관리',
      detail: '정기 검진 및 예방 관리 필요 (완벽한 보장은 없습니다)',
      severity: 'low',
    });
  }

  let grade;
  if (score >= 70) grade = { text: '양호', color: 'blue', emoji: '🔵' };
  else if (score >= 55) grade = { text: '보통', color: 'yellow', emoji: '🟡' };
  else if (score >= 35) grade = { text: '주의', color: 'orange', emoji: '🟠' };
  else grade = { text: '위험', color: 'red', emoji: '🔴' };

  const totalScenarioCost = scenarioCosts.reduce((sum, item) => sum + item.cost, 0) || 2500000;
  const currentCoverageRate = Math.max(0.15, score * 0.01);
  const currentOutOfPocket = Math.floor(totalScenarioCost * (1 - currentCoverageRate));
  const optimizedOutOfPocket = Math.floor(totalScenarioCost * 0.15);
  const savings = Math.max(0, currentOutOfPocket - optimizedOutOfPocket);

  const categories = {
    cavity_nerve: analyzeCategory('cavity_nerve', score, answers),
    crown_implant: analyzeCategory('crown_implant', score, answers),
    gum_disease: analyzeCategory('gum_disease', score, answers),
  };

  const leadScoreData = calculateLeadScore(score, riskFactors);
  const insurancePremium = calculateInsurancePremium(score, riskFactors, answers.concerns);

  return {
    score: Math.floor(score),
    grade,
    riskFactors,
    totalScenarioCost,
    scenarioCosts,
    currentOutOfPocket,
    optimizedOutOfPocket,
    savings,
    categories,
    hasInsurance: answers.hasInsurance,
    leadScore: leadScoreData,
    insurancePremium,
  };
};
