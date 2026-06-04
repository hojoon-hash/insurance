import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import ProgressBar from '../components/ProgressBar';
import PreviewResult from '../components/PreviewResult';
import LeadFormModal from '../components/LeadFormModal';
import { apiUrl } from '../lib/api';

const questions = [
  {
    id: 'welcome',
    text: '안녕하세요! 치위선생입니다. 🦷\n\n단 3분이면 내 치아보험이 얼마나 부족한지 알 수 있어요.\n\n지금 바로 시작할까요?',
    type: 'info',
  },
  {
    id: 'ageGroup',
    text: '먼저, 연령대를 알려주세요.\n치아 상태는 나이에 따라 많이 달라져요. 🎂',
    type: 'select',
    options: ['20대', '30대', '40대', '50대', '60대 이상'],
  },
  {
    id: 'dentalHistory',
    text: '최근 1년 내 치과에서 받은 치료가 있나요? 🏥\n(여러 개 선택 가능)',
    type: 'multiselect',
    options: [
      '없어요 (건강해요)',
      '스케일링만 받았어요',
      '충치 치료 (때우기)',
      '신경 치료 (크라운 씌움)',
      '이를 뺐어요',
      '임플란트/브릿지'
    ],
  },
  {
    id: 'symptoms',
    text: '지금 이런 증상이 있으신가요? 🩺\n(여러 개 선택 가능)',
    type: 'multiselect',
    options: [
      '없어요 (괜찮아요)',
      '양치할 때 피가 나요 🩸',
      '찬물 마시면 시려요 🧊',
      '씹을 때 아파요 😣',
      '이가 흔들려요 💨',
      '잇몸이 자주 부어요 🔥'
    ],
  },
  {
    id: 'concerns',
    text: '앞으로 이런 치료가 필요할까 봐 걱정되시나요? 🤔\n(여러 개 선택 가능)',
    type: 'multiselect',
    options: [
      '없어요',
      '임플란트 (이 빠지면) 💰',
      '크라운·금니 (씌우기) 👑',
      '자녀 치아 교정 👶',
      '부모님 틀니 👴',
      '잇몸 치료 (치주염) 🦷'
    ],
  },
  {
    id: 'hasInsurance',
    text: '마지막 질문이에요! 📄\n\n현재 치아보험에 가입되어 있으신가요?',
    type: 'select',
    options: [
      '네, 가입되어 있어요',
      '아니요, 없어요',
      '잘 모르겠어요'
    ],
  },
];

export default function Diagnosis() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [multiSelectChoices, setMultiSelectChoices] = useState([]);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [userName, setUserName] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentStep === 0) {
      setTimeout(() => {
        setMessages([{ text: questions[0].text, isUser: false }]);
        setTimeout(() => {
          setCurrentStep(1);
        }, 1000);
      }, 500);
    }
  }, []);

  const handleAnswer = async (answer) => {
    const currentQuestion = questions[currentStep];
    
    if (currentQuestion.type === 'info') {
      setCurrentStep(prev => prev + 1);
      return;
    }

    setMessages(prev => [...prev, { text: answer, isUser: true }]);

    const answerKey = currentQuestion.id;
    let processedAnswer = answer;

    setAnswers(prev => ({
      ...prev,
      [answerKey]: processedAnswer,
    }));

    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        const nextQuestion = questions[currentStep + 1];
        setMessages(prev => [...prev, { text: nextQuestion.text, isUser: false }]);
        setCurrentStep(prev => prev + 1);
      } else {
        finishDiagnosis({ ...answers, [answerKey]: processedAnswer });
      }
    }, 800);
  };

  const handleMultiSelectConfirm = () => {
    if (multiSelectChoices.length === 0) {
      alert('최소 1개 이상 선택해주세요');
      return;
    }
    
    const answerText = multiSelectChoices.join(', ');
    const currentQuestion = questions[currentStep];
    
    setMessages(prev => [...prev, { text: answerText, isUser: true }]);
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: multiSelectChoices,
    }));

    setMultiSelectChoices([]);

    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        const nextQuestion = questions[currentStep + 1];
        setMessages(prev => [...prev, { text: nextQuestion.text, isUser: false }]);
        setCurrentStep(prev => prev + 1);
      } else {
        finishDiagnosis({ ...answers, [currentQuestion.id]: multiSelectChoices });
      }
    }, 800);
  };

  const finishDiagnosis = async (finalAnswers) => {
    setIsLoading(true);
    setMessages(prev => [
      ...prev,
      {
        text: '🔍 29개 보험사 약관을 분석 중입니다...\n💡 맞춤 분석을 생성하고 있어요!\n\n잠시만 기다려주세요 ⏳',
        isUser: false,
      },
    ]);

    try {
      const response = await fetch(apiUrl('/api/diagnosis'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalAnswers),
      });

      const result = await response.json();

      setTimeout(() => {
        setDiagnosisResult(result.data);
        setShowPreview(true);
      }, 3000);
    } catch (error) {
      console.error('Diagnosis error:', error);
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        {
          text: '분석 중 오류가 발생했습니다. 다시 시도해주세요.',
          isUser: false,
        },
      ]);
    }
  };

  const toggleMultiSelect = (option) => {
    setMultiSelectChoices(prev =>
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };

  const handleLeadFormSubmit = (formData) => {
    setUserName(formData.name);
    setShowLeadForm(false);
    navigate('/result', { 
      state: { 
        diagnosisResult, 
        answers,
        userName: formData.name 
      } 
    });
  };

  const currentQuestion = questions[currentStep];
  const totalQuestions = questions.filter(q => q.type !== 'info').length;
  const answeredQuestions = Object.keys(answers).length;

  // 미리보기 결과 표시
  if (showPreview && diagnosisResult) {
    return (
      <>
        <PreviewResult 
          diagnosisData={diagnosisResult}
          onShowLeadForm={() => setShowLeadForm(true)}
        />
        <LeadFormModal
          isOpen={showLeadForm}
          onClose={() => setShowLeadForm(false)}
          diagnosisData={diagnosisResult}
          onSubmitSuccess={handleLeadFormSubmit}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with Progress */}
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                진단 진행 중
              </span>
              <span className="text-sm font-bold text-primary">
                {answeredQuestions} / {totalQuestions}
              </span>
            </div>
            <ProgressBar current={answeredQuestions} total={totalQuestions} />
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg.text}
            isUser={msg.isUser}
            delay={0}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Answer Options */}
      {!isLoading && currentQuestion && currentQuestion.type !== 'info' && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <AnimatePresence mode="wait">
            {currentQuestion.type === 'select' && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 gap-3"
              >
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={option}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(option)}
                    className="w-full bg-gray-50 hover:bg-primary hover:text-white text-gray-800 font-medium py-4 px-6 rounded-xl border-2 border-gray-200 hover:border-primary transition-all text-left"
                  >
                    {option}
                  </motion.button>
                ))}
              </motion.div>
            )}

            {currentQuestion.type === 'multiselect' && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="grid grid-cols-1 gap-3 mb-4">
                  {currentQuestion.options.map((option, index) => (
                    <motion.button
                      key={option}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleMultiSelect(option)}
                      className={`py-4 px-4 rounded-xl border-2 font-medium transition-all text-left ${
                        multiSelectChoices.includes(option)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-primary'
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMultiSelectConfirm}
                  disabled={multiSelectChoices.length === 0}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                    multiSelectChoices.length > 0
                      ? 'bg-accent hover:bg-green-600'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {multiSelectChoices.length > 0
                    ? `${multiSelectChoices.length}개 선택 완료`
                    : '최소 1개 이상 선택해주세요'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
