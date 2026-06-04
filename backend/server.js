import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// ALLOWED_ORIGINS 환경변수(쉼표 구분)로 허용 도메인을 제한. 미설정 시 전체 허용.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : null;

app.use(
  cors({
    origin: allowedOrigins || true,
  })
);
app.use(express.json());

// In-memory storage for leads
let leads = [];

// 카테고리별 분석 함수
const analyzeCategory = (categoryType, score, answers) => {
  const categories = {
    cavity_nerve: {
      displayName: "충치·신경 치료",
      medicalName: "보존치료",
      icon: "🦷",
      description: "치아를 뽑지 않고 살리는 치료",
      examples: [
        "충치 때우기 (레진, 인레이)",
        "신경 치료 (근관치료)",
        "이 시릴 때 치료"
      ],
      threshold: 70
    },
    crown_implant: {
      displayName: "크라운·임플란트",
      medicalName: "보철치료",
      icon: "🔧",
      description: "상한 치아를 씌우거나 새로 심는 치료",
      examples: [
        "금니, 지르코니아 (크라운)",
        "임플란트 (이 심기)",
        "브릿지, 틀니"
      ],
      threshold: 65
    },
    gum_disease: {
      displayName: "잇몸 질환",
      medicalName: "치주치료",
      icon: "🩸",
      description: "피나는 잇몸, 흔들리는 이를 치료",
      examples: [
        "스케일링 (치석 제거)",
        "잇몸 속 치료 (치주 소파술)",
        "잇몸 수술"
      ],
      threshold: 75
    }
  };

  const category = categories[categoryType];
  const percentage = Math.min(100, Math.max(0, score + (categoryType === 'gum_disease' ? 5 : 0)));
  
  let status = '적정';
  if (percentage < category.threshold) {
    status = percentage < (category.threshold - 20) ? '매우 부족' : '부족';
  }

  // 현재 보장액 계산 (점수 기반)
  const baseCoverage = {
    cavity_nerve: 1000000,
    crown_implant: 1200000,
    gum_disease: 800000
  };

  const currentCoverage = Math.floor(baseCoverage[categoryType] * (percentage / 100));
  const recommendedCoverage = baseCoverage[categoryType];
  const shortfall = recommendedCoverage - currentCoverage;

  // 관련 증상/고민 확인
  let relatedSymptoms = null;
  if (categoryType === 'crown_implant') {
    if (answers.concerns?.includes('임플란트 (이 빠지면) 💰')) {
      relatedSymptoms = "⚠️ 당신의 선택: 임플란트 고민 → 긴급 보완 필요!";
    }
  } else if (categoryType === 'gum_disease') {
    if (answers.symptoms?.some(s => s.includes('잇몸') || s.includes('피'))) {
      relatedSymptoms = "⚠️ 당신의 증상: 잇몸 피남/시림 → 지금 당장 보장 추가!";
    }
  } else if (categoryType === 'cavity_nerve') {
    if (answers.dentalHistory?.includes('충치 치료 (때우기)')) {
      relatedSymptoms = "⚠️ 치료 이력 있음 → 보장 상향 추천";
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
    relatedSymptoms
  };
};

// 리드 품질 점수 계산
const calculateLeadScore = (score, riskFactors) => {
  let leadScore = 0;

  // 진단 점수 (낮을수록 고품질)
  if (score < 40) leadScore += 40;
  else if (score < 60) leadScore += 30;
  else if (score < 80) leadScore += 15;

  // 위험 요인 개수
  leadScore += riskFactors.length * 5;

  // 심각도
  const highRisk = riskFactors.filter(r => r.severity === 'high').length;
  leadScore += highRisk * 10;

  return {
    score: leadScore,
    quality: leadScore >= 80 ? 'HOT' : leadScore >= 50 ? 'WARM' : 'COLD',
    priority: leadScore >= 80 ? 1 : leadScore >= 50 ? 2 : 3
  };
};

// 예상 보험료 계산 함수
const calculateInsurancePremium = (score, riskFactors, concerns) => {
  // 기본 보험료 구조 (월 단위)
  const basePremium = {
    basic: 20000,      // 기본형
    standard: 35000,   // 표준형
    premium: 60000     // 프리미엄형
  };

  // 현재 예상 보험료 (점수 기반)
  let currentPremium;
  if (score >= 70) currentPremium = basePremium.basic;
  else if (score >= 50) currentPremium = basePremium.standard;
  else currentPremium = basePremium.premium;

  // 권장 보험료 (리스크 기반)
  let recommendedPremium = basePremium.standard;
  
  // 고위험 요인이 있으면 프리미엄형 권장
  const highRiskCount = riskFactors.filter(r => r.severity === 'high').length;
  if (highRiskCount >= 2 || concerns?.some(c => c.includes('임플란트') || c.includes('틀니'))) {
    recommendedPremium = basePremium.premium;
  }

  // 연간 보험료
  const currentAnnual = currentPremium * 12;
  const recommendedAnnual = recommendedPremium * 12;
  const annualDifference = recommendedAnnual - currentAnnual;

  return {
    current: {
      monthly: currentPremium,
      annual: currentAnnual,
      type: currentPremium === basePremium.basic ? '기본형' : 
            currentPremium === basePremium.standard ? '표준형' : '프리미엄형'
    },
    recommended: {
      monthly: recommendedPremium,
      annual: recommendedAnnual,
      type: recommendedPremium === basePremium.basic ? '기본형' : 
            recommendedPremium === basePremium.standard ? '표준형' : '프리미엄형'
    },
    difference: {
      monthly: annualDifference / 12,
      annual: annualDifference
    },
    isUpgradeNeeded: recommendedPremium > currentPremium
  };
};

// 상세 점수 계산 알고리즘 (개선 버전)
const calculateDetailedScore = (answers) => {
  let score = 100;
  let riskFactors = [];
  let scenarioCosts = [];

  // 1. 연령대 - 기본 감점 추가 (현실적 반영)
  const ageScores = {
    '20대': -5,      // 치과 방문 안 함 → 잠재 위험
    '30대': -8,      // 잇몸 질환 시작
    '40대': -12,     // 치아 노화 본격화
    '50대': -18,     // 임플란트 필요성 증가
    '60대 이상': -25 // 전반적 치아 상태 저하
  };
  const ageDeduction = ageScores[answers.ageGroup] || -10;
  score += ageDeduction;
  
  // 연령대 자체를 위험 요인으로 추가 (40대 이상)
  if (answers.ageGroup === '40대' || answers.ageGroup === '50대' || answers.ageGroup === '60대 이상') {
    riskFactors.push({
      category: '연령 위험도',
      detail: `${answers.ageGroup}: 치아 노화로 인한 치료 가능성 증가`,
      severity: answers.ageGroup === '50대' || answers.ageGroup === '60대 이상' ? 'high' : 'medium'
    });
  }

  // 2. 치료 이력 (최대 30점)
  const historyScores = {
    '없어요 (건강해요)': 0,
    '스케일링만 받았어요': -5,
    '충치 치료 (때우기)': -10,
    '신경 치료 (크라운 씌움)': -15,
    '이를 뺐어요': -20,
    '임플란트/브릿지': -25
  };

  if (Array.isArray(answers.dentalHistory)) {
    answers.dentalHistory.forEach(history => {
      const deduction = historyScores[history] || 0;
      score += deduction;
      if (deduction < 0) {
        riskFactors.push({
          category: '치료 이력',
          detail: history,
          severity: Math.abs(deduction) >= 15 ? 'high' : 'medium'
        });

        if (history === '신경 치료 (크라운 씌움)') {
          scenarioCosts.push({
            item: '크라운 재치료 가능성',
            cost: 800000
          });
        } else if (history === '임플란트/브릿지') {
          scenarioCosts.push({
            item: '추가 임플란트 가능성',
            cost: 1200000
          });
        }
      }
    });
  }

  // 3. 현재 증상 (최대 30점)
  const symptomScores = {
    '없어요 (괜찮아요)': 0,
    '양치할 때 피가 나요 🩸': -8,
    '찬물 마시면 시려요 🧊': -6,
    '씹을 때 아파요 😣': -10,
    '이가 흔들려요 💨': -15,
    '잇몸이 자주 부어요 🔥': -8
  };

  if (Array.isArray(answers.symptoms)) {
    answers.symptoms.forEach(symptom => {
      const deduction = symptomScores[symptom] || 0;
      score += deduction;
      if (deduction < 0) {
        riskFactors.push({
          category: '현재 증상',
          detail: symptom,
          severity: Math.abs(deduction) >= 10 ? 'high' : 'medium'
        });

        if (symptom === '이가 흔들려요 💨') {
          scenarioCosts.push({
            item: '임플란트 필요 가능성',
            cost: 1200000
          });
        } else if (symptom.includes('잇몸') || symptom.includes('피')) {
          scenarioCosts.push({
            item: '잇몸 치료',
            cost: 500000
          });
        }
      }
    });
  }

  // 4. 미래 걱정 (최대 30점)
  const concernScores = {
    '없어요': 0,
    '임플란트 (이 빠지면) 💰': -15,
    '크라운·금니 (씌우기) 👑': -8,
    '자녀 치아 교정 👶': -5,
    '부모님 틀니 👴': -10,
    '잇몸 치료 (치주염) 🦷': -8
  };

  if (Array.isArray(answers.concerns)) {
    answers.concerns.forEach(concern => {
      const deduction = concernScores[concern] || 0;
      score += deduction;
      if (deduction < 0) {
        riskFactors.push({
          category: '미래 걱정',
          detail: concern,
          severity: Math.abs(deduction) >= 10 ? 'high' : 'medium'
        });

        if (concern.includes('임플란트')) {
          scenarioCosts.push({
            item: '임플란트 (평균 2개)',
            cost: 2400000
          });
        } else if (concern.includes('교정')) {
          scenarioCosts.push({
            item: '자녀 교정',
            cost: 4500000
          });
        } else if (concern.includes('틀니')) {
          scenarioCosts.push({
            item: '부모님 틀니',
            cost: 3000000
          });
        } else if (concern.includes('크라운')) {
          scenarioCosts.push({
            item: '크라운 치료',
            cost: 500000
          });
        } else if (concern.includes('잇몸')) {
          scenarioCosts.push({
            item: '잇몸 치료',
            cost: 800000
          });
        }
      }
    });
  }

  // 점수 범위 제한 (최고점 85점으로 제한 - 완벽한 치아는 없음)
  score = Math.max(0, Math.min(85, score));
  
  // 예방 관리 부족에 대한 추가 감점 (기본 -5점)
  // 아무리 좋아도 정기 검진 필요성 반영
  if (score > 75) {
    score -= 5;
    riskFactors.push({
      category: '예방 관리',
      detail: '정기 검진 및 예방 관리 필요 (완벽한 보장은 없습니다)',
      severity: 'low'
    });
  }

  // 등급 결정 (최고 85점 기준)
  let grade;
  if (score >= 70) grade = { text: '양호', color: 'blue', emoji: '🔵' };
  else if (score >= 55) grade = { text: '보통', color: 'yellow', emoji: '🟡' };
  else if (score >= 35) grade = { text: '주의', color: 'orange', emoji: '🟠' };
  else grade = { text: '위험', color: 'red', emoji: '🔴' };

  // 총 예상 비용 계산
  const totalScenarioCost = scenarioCosts.reduce((sum, item) => sum + item.cost, 0) || 2500000; // 최소 기본값
  const currentCoverageRate = Math.max(0.15, score * 0.01); // 최소 15% 보장
  const currentOutOfPocket = Math.floor(totalScenarioCost * (1 - currentCoverageRate));
  const optimizedOutOfPocket = Math.floor(totalScenarioCost * 0.15); // 85% 보장 목표
  const savings = Math.max(0, currentOutOfPocket - optimizedOutOfPocket);

  // 카테고리별 분석
  const categories = {
    cavity_nerve: analyzeCategory('cavity_nerve', score, answers),
    crown_implant: analyzeCategory('crown_implant', score, answers),
    gum_disease: analyzeCategory('gum_disease', score, answers)
  };

  // 리드 스코어 계산
  const leadScoreData = calculateLeadScore(score, riskFactors);

  // 예상 보험료 계산
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
    insurancePremium  // 예상 보험료 추가
  };
};

// POST /api/diagnosis - Calculate score based on user answers
app.post('/api/diagnosis', (req, res) => {
  try {
    const answers = req.body;
    console.log('📊 Diagnosis Request:', answers);

    const result = calculateDetailedScore(answers);

    console.log('✅ Diagnosis Result:', {
      score: result.score,
      grade: result.grade.text,
      leadQuality: result.leadScore.quality
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Diagnosis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate diagnosis'
    });
  }
});

// 구글 시트(Apps Script 웹앱)로 리드 전달. 실패해도 사용자 응답은 막지 않음.
const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

const forwardLeadToSheets = async (leadData) => {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) return;
  try {
    const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    if (!response.ok) {
      console.error(`⚠️ Google Sheets 전송 실패: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('⚠️ Google Sheets 전송 오류:', error.message);
  }
};

// POST /api/lead - Save lead information
app.post('/api/lead', async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      timestamp: new Date().toISOString(),
      id: leads.length + 1
    };

    leads.push(leadData);

    console.log('🎯 New High-Quality Lead Captured:', {
      name: leadData.name,
      phone: leadData.phone,
      score: leadData.score,
      quality: leadData.leadQuality
    });
    console.log(`📈 Total Leads: ${leads.length}`);

    await forwardLeadToSheets(leadData);

    res.json({
      success: true,
      message: '상담 신청이 완료되었습니다.',
      leadId: leadData.id
    });
  } catch (error) {
    console.error('❌ Lead Capture Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save lead information'
    });
  }
});

// GET /api/leads - Get all leads (for admin)
app.get('/api/leads', (req, res) => {
  res.json({
    success: true,
    count: leads.length,
    data: leads
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🦷 치위선생 Backend Server is running on port ${PORT}`);
  console.log(`📊 Diagnosis API: http://localhost:${PORT}/api/diagnosis`);
  console.log(`🎯 Lead Capture API: http://localhost:${PORT}/api/lead`);
});
