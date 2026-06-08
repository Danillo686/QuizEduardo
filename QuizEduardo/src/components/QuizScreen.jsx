import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle, Clock, Lightbulb, ArrowRight,
  CheckCircle2, XCircle, Star
} from 'lucide-react';

export const QUESTIONS = [
  {
    id: 1,
    question: "Qual é a função dos drones com IA na maquete?",
    options: [
      "Plantar árvores automaticamente",
      "Monitorar as florestas e ajudar a identificar queimadas",
      "Separar materiais recicláveis",
      "Construir cidades sustentáveis",
    ],
    correctAnswer: 1,
    hint: "Drones voam alto sobre as copas das árvores, o que lhes dá uma visão privilegiada para detectar fumaça ou calor precocemente.",
    explanation: "Os drones equipados com IA sobrevoam as florestas em patrulha contínua. Seus sensores térmicos e câmeras de alta resolução conseguem detectar focos de calor e fumaça muito antes que um incêndio se alastre, permitindo uma resposta rápida dos bombeiros e autoridades. Na maquete, eles simbolizam essa vigilância aérea inteligente da natureza.",
  },
  {
    id: 2,
    question: "O que as câmeras com IA ajudam a fazer?",
    options: [
      "Melhorar o trânsito das cidades",
      "Identificar a poluição do ar",
      "Proteger os animais e evitar a caça ilegal",
      "Coletar lixo reciclável",
    ],
    correctAnswer: 2,
    hint: "Essas câmeras vigiam áreas preservadas de difícil acesso para detectar caçadores ou invasores antes que firam a fauna silvestre.",
    explanation: "Câmeras inteligentes são posicionadas em áreas de preservação ambiental. Os algoritmos de visão computacional analisam as imagens em tempo real para identificar a presença de humanos em zonas proibidas, reconhecer espécies raras e alertar guardas ambientais sobre possíveis ameaças. Isso substitui com eficiência a fiscalização humana contínua em locais de difícil acesso.",
  },
  {
    id: 3,
    question: "O que os sensores com IA analisam no rio?",
    options: [
      "A velocidade dos carros",
      "A qualidade da água e do ar",
      "O crescimento das árvores",
      "A quantidade de lixo nas ruas",
    ],
    correctAnswer: 1,
    hint: "Sensores submersos e estações meteorológicas locais monitoram pH, poluentes químicos e partículas suspensas na água e no ar.",
    explanation: "Sensores físico-químicos instalados nos rios medem continuamente parâmetros como pH, oxigênio dissolvido, turbidez, temperatura e presença de metais pesados ou agrotóxicos. A IA interpreta esses dados em tempo real, gerando alertas automáticos caso a qualidade da água ultrapasse limites seguros, auxiliando órgãos ambientais a agir rapidamente contra fontes de poluição.",
  },
  {
    id: 4,
    question: "Como a IA ajuda nas cidades sustentáveis?",
    options: [
      "Aumentando a poluição",
      "Planejando áreas com menos poluição e mais qualidade de vida",
      "Construindo rios artificiais",
      "Apenas monitorando animais",
    ],
    correctAnswer: 1,
    hint: "Sistemas inteligentes cruzam dados geográficos e de ventilação urbana para desenhar bairros mais limpos, verdes e otimizados.",
    explanation: "No planejamento urbano sustentável, a IA processa grandes volumes de dados geoespaciais, climáticos e demográficos. Com isso, é possível identificar os melhores locais para parques, otimizar rotas de transporte público, monitorar a qualidade do ar em diferentes bairros e sugerir políticas que reduzam a emissão de carbono, promovendo cidades mais verdes e habitáveis para todos.",
  },
  {
    id: 5,
    question: "Qual é a função da coleta inteligente?",
    options: [
      "Separar os resíduos e ajudar na reciclagem",
      "Fazer queimadas controladas",
      "Construir estradas",
      "Proteger os rios",
    ],
    correctAnswer: 0,
    hint: "Essa tecnologia usa sensores ópticos para escanear e classificar materiais como metal, vidro ou plástico para triagem automática.",
    explanation: "A coleta inteligente de resíduos utiliza robôs e esteiras com sensores ópticos, raio-X e IA para identificar e separar automaticamente cada tipo de material reciclável — plástico, vidro, metal e papel. Esse processo é muito mais rápido e preciso do que a triagem humana manual, aumentando as taxas de reciclagem e reduzindo a quantidade de lixo que vai para aterros sanitários.",
  },
  {
    id: 6,
    question: "Além da tecnologia, o que as pessoas podem fazer para ajudar o meio ambiente?",
    options: [
      "Jogar lixo na rua",
      "Desperdiçar água",
      "Reciclar, economizar água e descartar o lixo corretamente",
      "Cortar árvores sem necessidade",
    ],
    correctAnswer: 2,
    hint: "A tecnologia é apenas uma aliada; a preservação real depende do consumo sustentável e atitudes ecológicas básicas diárias de todos.",
    explanation: "Mesmo com toda a inovação tecnológica, a mudança de comportamento humano é insubstituível. Ações como separar o lixo para reciclagem, evitar desperdício de água, preferir produtos com menos embalagem, optar por transporte sustentável e conscientizar outras pessoas compõem a base de qualquer movimento ecológico eficaz. A IA amplifica, mas não substitui, o esforço coletivo.",
  },
  {
    id: 7,
    question: "Qual é o principal objetivo do trabalho apresentado?",
    options: [
      "Mostrar apenas como funciona a tecnologia",
      "Conscientizar sobre a preservação da natureza e mostrar como a IA pode ajudar",
      "Ensinar a construir maquetes",
      "Falar somente sobre cidades",
    ],
    correctAnswer: 1,
    hint: "O projeto busca unir educação ecológica com inovação tecnológica para mostrar caminhos viáveis de coexistência saudável com o planeta.",
    explanation: "O trabalho vai além de apenas demonstrar tecnologia. O objetivo central é criar consciência ambiental: mostrar que problemas reais como queimadas, caça ilegal, poluição hídrica e descarte inadequado de resíduos podem ser combatidos com inteligência artificial aplicada de forma responsável, inspirando os visitantes a refletir sobre o papel da inovação na preservação do planeta.",
  },
  {
    id: 8,
    question: "O que a maquete representa?",
    options: [
      "Como construir cidades grandes",
      "Como a Inteligência Artificial pode ajudar a proteger a natureza",
      "Apenas formas de reciclagem",
      "Somente a vida dos animais",
    ],
    correctAnswer: 1,
    hint: "É uma demonstração tátil e visual de como ferramentas eletrônicas e algoritmos inteligentes podem ser aplicados em biomas reais.",
    explanation: "A maquete foi projetada como um ecossistema integrado em miniatura, onde cada componente — drones, câmeras, sensores e sistema de coleta — representa uma aplicação real da IA no meio ambiente. Ao tornar essa tecnologia visível e tangível, ela facilita a compreensão de conceitos complexos e demonstra de forma concreta como sistemas inteligentes podem atuar em harmonia com a natureza.",
  },
  {
    id: 9,
    question: "Por que é importante identificar queimadas rapidamente?",
    options: [
      "Para o fogo se espalhar mais rápido",
      "Para evitar grandes danos ao meio ambiente",
      "Para aumentar a fumaça",
      "Para derrubar árvores",
    ],
    correctAnswer: 1,
    hint: "Incêndios florestais propagam-se exponencialmente. Detectar o fogo em minutos faz a diferença entre apagar um arbusto ou perder hectares.",
    explanation: "Incêndios florestais podem se expandir de poucos metros para centenas de hectares em questão de horas, dependendo do vento e da vegetação. Cada minuto de atraso na detecção equivale a uma área muito maior destruída. A identificação precoce por drones e sensores térmicos permite que as equipes de combate cheguem antes que o fogo se torne incontrolável, salvando florestas, animais e até comunidades humanas próximas.",
  },
  {
    id: 10,
    question: "O que a coleta inteligente ajuda a tornar mais eficiente?",
    options: [
      "O trânsito nas cidades",
      "O processo de reciclagem",
      "O desmatamento",
      "A construção de casas",
    ],
    correctAnswer: 1,
    hint: "Ela otimiza a triagem e o recolhimento de materiais, reduzindo o que vai para os lixões e acelerando o reaproveitamento industrial.",
    explanation: "A coleta inteligente moderniza toda a cadeia de reciclagem: desde lixeiras com sensores que avisam quando estão cheias (otimizando rotas de coleta) até esteiras automatizadas que separam os materiais com precisão. O resultado é uma cadeia de reciclagem mais rápida, com menos desperdício de recursos e menor custo operacional, contribuindo para uma economia circular mais robusta e sustentável.",
  },
];

const LETTERS = ["A", "B", "C", "D"];

export default function QuizScreen({ userName, userClass, userRole, onQuizComplete }) {
  const [currentIdx, setCurrentIdx]     = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered]   = useState(false);
  const [isCorrect, setIsCorrect]       = useState(false);
  const [score, setScore]               = useState(0);
  const [showHint, setShowHint]         = useState(false);
  const [timeTaken, setTimeTaken]       = useState(0);
  const timerRef = useRef(null);

  // Start global stopwatch
  useEffect(() => {
    timerRef.current = setInterval(() => setTimeTaken(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const currentQ = QUESTIONS[currentIdx];

  const handleSelectOption = (idx) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
  };

  const handleConfirm = () => {
    if (selectedOption === null || hasAnswered) return;
    const correct = selectedOption === currentQ.correctAnswer;
    setIsCorrect(correct);
    setHasAnswered(true);
    if (correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setHasAnswered(false);
      setIsCorrect(false);
      setShowHint(false);
    } else {
      clearInterval(timerRef.current);
      onQuizComplete({ score: isCorrect ? score : score, timeTaken });
    }
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const getOptionClass = (idx) => {
    if (!hasAnswered) {
      return idx === selectedOption ? 'option-btn is-selected' : 'option-btn';
    }
    if (idx === currentQ.correctAnswer) {
      return idx === selectedOption
        ? 'option-btn is-correct'
        : 'option-btn is-correct-but-not-selected';
    }
    if (idx === selectedOption) return 'option-btn is-wrong';
    return 'option-btn';
  };

  // Initials for avatar
  const initials = userName
    ? userName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const progress = ((currentIdx + (hasAnswered ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div className="glass-card">

      {/* Top bar */}
      <div className="quiz-topbar">
        <div className="card-tag">
          <HelpCircle size={14} />
          Questão {currentIdx + 1} / {QUESTIONS.length}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {hasAnswered && (
            <div className={`quiz-score-pill`} style={
              isCorrect
                ? {}
                : { background: 'var(--error-light)', color: 'var(--error)', borderColor: 'var(--error-border)' }
            }>
              <Star size={12} fill="currentColor" />
              {score} pt{score !== 1 ? 's' : ''}
            </div>
          )}
          <div className="timer-pill">
            <Clock size={14} />
            {formatTime(timeTaken)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="question-number-dot">{currentIdx + 1}</div>
      <p className="question-text">{currentQ.question}</p>

      {/* Hint (shown before answering) */}
      {showHint && !hasAnswered && (
        <div className="hint-panel">
          <Lightbulb className="hint-icon" size={18} />
          <p className="hint-text"><strong>Dica:</strong> {currentQ.hint}</p>
        </div>
      )}

      {/* Options */}
      <div className="options-list">
        {currentQ.options.map((opt, idx) => (
          <button
            key={idx}
            className={getOptionClass(idx)}
            onClick={() => handleSelectOption(idx)}
            disabled={hasAnswered}
            id={`option-${currentIdx}-${idx}`}
          >
            <span className="option-letter">{LETTERS[idx]}</span>
            <span className="option-text">{opt}</span>
          </button>
        ))}
      </div>

      {/* ── ANSWER EXPLANATION (shown after answering) ── */}
      {hasAnswered && (
        <div className={`answer-explanation ${isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="explanation-icon-wrap">
            {isCorrect
              ? <CheckCircle2 size={20} />
              : <XCircle size={20} />
            }
          </div>
          <div className="explanation-body">
            <div className="explanation-verdict">
              {isCorrect ? '✓ Resposta Correta!' : '✗ Resposta Incorreta'}
            </div>
            <p className="explanation-text">{currentQ.explanation}</p>
            {!isCorrect && (
              <p className="explanation-correct-answer">
                ✓ Resposta certa: {LETTERS[currentQ.correctAnswer]}) {currentQ.options[currentQ.correctAnswer]}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="quiz-actions">
        {!hasAnswered && (
          <button
            className="btn btn-secondary"
            onClick={() => setShowHint(v => !v)}
            id="btn-quiz-hint"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Lightbulb size={16} />
            {showHint ? 'Ocultar Dica' : 'Ver Dica'}
          </button>
        )}

        {!hasAnswered ? (
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={selectedOption === null}
            id="btn-quiz-confirm"
          >
            Confirmar Resposta
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleNext}
            id="btn-quiz-next"
            style={{ gridColumn: '1 / -1' }}
          >
            {currentIdx === QUESTIONS.length - 1 ? 'Ver Resultado Final' : 'Próxima Questão'}
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Player strip */}
      <div className="player-strip">
        <div className="player-avatar">{initials}</div>
        <div className="player-info">
          <div className="player-name">{userName}</div>
          <div className="player-role-badge">
            {userRole === 'professor' ? '👨‍🏫 Professor' : `🎓 ${userClass || 'Aluno'}`}
          </div>
        </div>
        <div className="quiz-score-pill">
          <Star size={12} fill="currentColor" />
          {score} / {currentIdx + (hasAnswered ? 1 : 0)}
        </div>
      </div>

    </div>
  );
}
