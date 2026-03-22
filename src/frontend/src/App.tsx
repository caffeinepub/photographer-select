import { Progress } from "@/components/ui/progress";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type GameMode = "addition" | "subtraction" | "counting";
type Screen = "home" | "game" | "result";

interface Question {
  text: string;
  answer: number;
  options: number[];
  emoji?: string;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  shape: "square" | "circle" | "star";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(mode: GameMode): Question {
  if (mode === "addition") {
    const a = rand(1, 9);
    const b = rand(1, 9);
    const answer = a + b;
    const wrongOptions = new Set<number>();
    while (wrongOptions.size < 3) {
      const w = rand(Math.max(1, answer - 4), answer + 4);
      if (w !== answer) wrongOptions.add(w);
    }
    return {
      text: `${a} + ${b} = ?`,
      answer,
      options: shuffle([answer, ...wrongOptions]),
    };
  }
  if (mode === "subtraction") {
    const a = rand(3, 10);
    const b = rand(1, a);
    const answer = a - b;
    const wrongOptions = new Set<number>();
    while (wrongOptions.size < 3) {
      const w = rand(0, a);
      if (w !== answer) wrongOptions.add(w);
    }
    return {
      text: `${a} - ${b} = ?`,
      answer,
      options: shuffle([answer, ...wrongOptions]),
    };
  }
  // counting mode
  const emojis = ["🍎", "🌟", "🐟", "🌸", "🍭", "🦋", "🍦", "🎈"];
  const emoji = emojis[rand(0, emojis.length - 1)];
  const count = rand(1, 9);
  const wrongOptions = new Set<number>();
  while (wrongOptions.size < 3) {
    const w = rand(1, 12);
    if (w !== count) wrongOptions.add(w);
  }
  return {
    text: "",
    answer: count,
    options: shuffle([count, ...wrongOptions]),
    emoji: emoji.repeat(count),
  };
}

const TOTAL_QUESTIONS = 10;
const CONFETTI_COLORS = [
  "#FF5B5B",
  "#2FAFE3",
  "#FFC83D",
  "#2FB86A",
  "#8B5CF6",
  "#FF9B4E",
];

const CORRECT_MESSAGES = [
  "शाबाश! 🌟",
  "बहुत अच्छा! ⭐",
  "क्या बात है! 🎉",
  "वाह! बहुत बढ़िया! 🏆",
  "सुपर! 🦁",
];
const WRONG_MESSAGES = [
  "दोबारा कोशिश करो! 💪",
  "हिम्मत रखो! 🌈",
  "कोई बात नहीं, फिर से! 😊",
];

const FLOATING_NUMS = ["3", "7", "+", "5", "=", "8", "2"];
const FLOAT_TOPS = [10, 20, 40, 60, 70, 15, 55];
const FLOAT_LEFTS = [5, 15, 80, 88, 70, 55, 35];
const MASCOTS = ["🦁", "🐘", "🐒"];
const BADGE_ICONS = ["🥇", "🏆", "⭐", "🌟", "🎖️"];
const BADGE_LABELS = ["सोना", "चैंपियन", "तारा", "सुपर", "हीरो"];
const PROGRESS_VALS = [0, 25, 50, 75, 100];
const FIVE_STARS = [0, 1, 2, 3, 4];
const FLOAT_DATA = FLOATING_NUMS.map((n, i) => ({
  key: `fn-${i}`,
  n,
  top: FLOAT_TOPS[i],
  left: FLOAT_LEFTS[i],
  delay: i * 0.4,
}));

// ─── Confetti Component ───────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }
    const newPieces: ConfettiPiece[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: rand(0, 100),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: rand(0, 600),
      duration: rand(1500, 2500),
      size: rand(8, 14),
      shape: (["square", "circle", "star"] as const)[rand(0, 2)],
    }));
    setPieces(newPieces);
    const t = setTimeout(() => setPieces([]), 2600);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            backgroundColor: p.shape !== "star" ? p.color : "transparent",
            width: p.size,
            height: p.size,
            borderRadius:
              p.shape === "circle" ? "50%" : p.shape === "square" ? "2px" : "0",
            animationDuration: `${p.duration}ms`,
            animationDelay: `${p.delay}ms`,
            color: p.shape === "star" ? p.color : undefined,
            fontSize: p.shape === "star" ? p.size + 4 : undefined,
          }}
        >
          {p.shape === "star" ? "★" : null}
        </div>
      ))}
    </>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ onStart }: { onStart: (mode: GameMode) => void }) {
  const gameModes: {
    mode: GameMode;
    emoji: string;
    title: string;
    hindi: string;
    color: string;
    shadow: string;
  }[] = [
    {
      mode: "addition",
      emoji: "➕",
      title: "Jodo",
      hindi: "जोड़ो",
      color: "bg-coral text-white",
      shadow: "shadow-coral",
    },
    {
      mode: "subtraction",
      emoji: "➖",
      title: "Ghato",
      hindi: "घटाओ",
      color: "bg-grape text-white",
      shadow: "shadow-grape",
    },
    {
      mode: "counting",
      emoji: "🔢",
      title: "Gino",
      hindi: "गिनो",
      color: "bg-jungle text-white",
      shadow: "shadow-jungle",
    },
  ];

  const steps = [
    { icon: "🎯", title: "खेल चुनो", desc: "अपना पसंदीदा गणित गेम चुनो" },
    { icon: "🧮", title: "सवाल हल करो", desc: "10 सवालों का जवाब दो" },
    { icon: "🏆", title: "तारे जीतो", desc: "हर सही जवाब पर तारा मिलेगा" },
  ];

  return (
    <div className="min-h-screen sky-bg flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex justify-center">
        <div className="bg-white rounded-3xl px-6 py-3 shadow-card flex items-center gap-3">
          <span
            className="text-3xl animate-float"
            style={{ display: "inline-block" }}
          >
            🦁
          </span>
          <span className="font-display font-black text-lg text-foreground uppercase tracking-wide">
            Math Adventure Safari
          </span>
        </div>
      </header>

      {/* Hero jungle section */}
      <div className="jungle-bg mx-4 rounded-3xl overflow-hidden relative py-10 px-6 flex flex-col items-center mt-2">
        {FLOAT_DATA.map((fd) => (
          <span
            key={fd.key}
            className="absolute text-white/30 font-black select-none pointer-events-none"
            style={{
              fontSize: 32,
              top: `${fd.top}%`,
              left: `${fd.left}%`,
              animationDelay: `${fd.delay}s`,
              animation: "float 3s ease-in-out infinite",
            }}
          >
            {fd.n}
          </span>
        ))}

        <div className="flex justify-center gap-6 mb-4">
          {MASCOTS.map((e, i) => (
            <span
              key={`hero-mascot-${e}`}
              className="text-6xl"
              style={{
                display: "inline-block",
                animation: "float 3s ease-in-out infinite",
                animationDelay: `${i * 0.7}s`,
              }}
            >
              {e}
            </span>
          ))}
        </div>

        <h1 className="text-center font-black text-white uppercase tracking-wide leading-tight text-3xl md:text-4xl drop-shadow-lg">
          मज़ेदार गणित
          <br />
          <span className="text-sunshine">सीखो खेलते हुए!</span>
        </h1>
        <p className="text-white/90 font-bold text-center mt-2 text-lg">
          Fun Math Adventures For Kids! 🎮
        </p>

        <motion.button
          type="button"
          data-ocid="home.primary_button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onStart("addition")}
          className="mt-6 bg-coral text-white font-black text-xl uppercase px-10 py-4 rounded-full shadow-coral hover:bg-coral-light transition-colors"
        >
          🚀 खेलना शुरू करो!
        </motion.button>
      </div>

      {/* How it works */}
      <section className="px-4 mt-8">
        <h2 className="text-center font-black text-2xl uppercase text-foreground mb-4">
          यह कैसे काम करता है?
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="bg-white rounded-2xl p-4 text-center shadow-card"
            >
              <div className="text-4xl mb-2">{step.icon}</div>
              <div className="font-black text-sm text-foreground">
                {step.title}
              </div>
              <div className="text-xs text-muted-foreground font-semibold mt-1">
                {step.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Game Mode Cards */}
      <section className="px-4 mt-8">
        <h2 className="text-center font-black text-2xl uppercase text-foreground mb-4">
          गेम चुनो 🎲
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {gameModes.map((g, i) => (
            <motion.button
              key={g.mode}
              type="button"
              data-ocid={`home.${g.mode}.button`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.12 }}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onStart(g.mode)}
              className={`${g.color} ${g.shadow} rounded-3xl p-6 flex flex-col items-center gap-2 font-black text-xl shadow-lg hover:opacity-90 transition-all`}
            >
              <span className="text-5xl">{g.emoji}</span>
              <span className="text-2xl font-black">{g.hindi}</span>
              <span className="text-sm font-bold opacity-90 uppercase">
                {g.title}
              </span>
              <span className="mt-2 bg-white/20 rounded-full px-4 py-1 text-sm font-black uppercase">
                Play Now →
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Rewards section */}
      <section className="px-4 mt-8 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-card">
          <h2 className="text-center font-black text-xl uppercase text-foreground mb-4">
            🏅 तुम्हारे पुरस्कार
          </h2>
          <div className="flex justify-center gap-4 mb-4">
            {BADGE_ICONS.map((b, i) => (
              <div key={`badge-${b}`} className="text-center">
                <div className="text-3xl">{b}</div>
                <div className="text-xs font-bold text-muted-foreground mt-1">
                  {BADGE_LABELS[i]}
                </div>
              </div>
            ))}
          </div>
          <div className="relative">
            <Progress value={30} className="h-4 rounded-full" />
            <div className="flex justify-between mt-1">
              {PROGRESS_VALS.map((v) => (
                <span
                  key={`prog-${v}`}
                  className="text-xs font-bold text-sunshine"
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-muted-foreground font-semibold">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

// ─── Game Screen ──────────────────────────────────────────────────────────────
const ANSWER_COLORS = [
  { bg: "bg-coral", shadow: "shadow-coral", hover: "hover:bg-coral-light" },
  { bg: "bg-grape", shadow: "shadow-grape", hover: "hover:bg-grape-light" },
  { bg: "bg-jungle", shadow: "shadow-jungle", hover: "hover:bg-jungle-dark" },
  { bg: "bg-sky", shadow: "shadow-kid", hover: "hover:opacity-90" },
];

function GameScreen({
  mode,
  onFinish,
  onHome,
}: { mode: GameMode; onFinish: (score: number) => void; onHome: () => void }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState<Question>(() =>
    generateQuestion(mode),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [answerShake, setAnswerShake] = useState<number | null>(null);
  const [questionKey, setQuestionKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAnswer = useCallback(
    (opt: number) => {
      if (selected !== null) return;
      setSelected(opt);
      const isCorrect = opt === question.answer;

      if (isCorrect) {
        setFeedback("correct");
        setFeedbackMsg(CORRECT_MESSAGES[rand(0, CORRECT_MESSAGES.length - 1)]);
        setScore((s) => s + 1);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2600);
      } else {
        setFeedback("wrong");
        setFeedbackMsg(WRONG_MESSAGES[rand(0, WRONG_MESSAGES.length - 1)]);
        setAnswerShake(opt);
        setTimeout(() => setAnswerShake(null), 500);
      }

      timerRef.current = setTimeout(() => {
        const nextIndex = questionIndex + 1;
        if (nextIndex >= TOTAL_QUESTIONS) {
          onFinish(isCorrect ? score + 1 : score);
        } else {
          setQuestionIndex(nextIndex);
          setQuestion(generateQuestion(mode));
          setSelected(null);
          setFeedback(null);
          setFeedbackMsg("");
          setQuestionKey((k) => k + 1);
        }
      }, 1200);
    },
    [selected, question.answer, questionIndex, score, mode, onFinish],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const modeLabel = {
    addition: "जोड़ो ➕",
    subtraction: "घटाओ ➖",
    counting: "गिनो 🔢",
  }[mode];
  const progress = (questionIndex / TOTAL_QUESTIONS) * 100;

  return (
    <div className="min-h-screen sky-bg flex flex-col">
      <Confetti active={showConfetti} />

      <header className="px-4 pt-4 pb-2">
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              data-ocid="game.home.button"
              onClick={onHome}
              className="text-2xl hover:scale-110 transition-transform"
            >
              🏠
            </button>
            <span className="font-black text-lg text-foreground">
              {modeLabel}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: score }, (_, idx) => idx).map((idx) => (
                <span
                  key={idx}
                  className="text-sunshine text-lg animate-star-float"
                  style={{ animationDelay: `${idx * 0.2}s` }}
                >
                  ⭐
                </span>
              ))}
              {score === 0 && <span className="text-2xl">⭐</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-muted-foreground">
              {questionIndex + 1}/{TOTAL_QUESTIONS}
            </span>
            <Progress value={progress} className="flex-1 h-3 rounded-full" />
            <span className="text-sm font-black text-sunshine">🌟 {score}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={questionKey}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-3xl p-8 shadow-kid text-center mb-6">
              {question.emoji ? (
                <div>
                  <p className="text-3xl leading-relaxed mb-3 break-all">
                    {question.emoji}
                  </p>
                  <p className="font-black text-2xl text-foreground">
                    कितने हैं? 🤔
                  </p>
                </div>
              ) : (
                <p className="font-black text-5xl md:text-6xl text-foreground tracking-wider">
                  {question.text}
                </p>
              )}
            </div>

            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-center mb-4 rounded-2xl py-3 px-6 font-black text-xl ${
                    feedback === "correct"
                      ? "bg-jungle/10 text-jungle"
                      : "bg-coral/10 text-coral"
                  }`}
                >
                  {feedbackMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-4">
              {question.options.map((opt, i) => {
                const isSelected = selected === opt;
                const isCorrect = opt === question.answer;
                const colorSet = ANSWER_COLORS[i % ANSWER_COLORS.length];
                let extra = "";
                if (isSelected && feedback === "correct")
                  extra = "ring-4 ring-sunshine scale-105";
                if (isSelected && feedback === "wrong") extra = "opacity-60";
                if (selected !== null && isCorrect && !isSelected)
                  extra = "ring-4 ring-jungle";

                return (
                  <motion.button
                    key={String(opt)}
                    type="button"
                    data-ocid={`game.answer.button.${i + 1}`}
                    whileHover={selected === null ? { scale: 1.04, y: -3 } : {}}
                    whileTap={selected === null ? { scale: 0.96 } : {}}
                    onClick={() => handleAnswer(opt)}
                    disabled={selected !== null}
                    className={`
                      ${colorSet.bg} ${colorSet.shadow} ${selected === null ? colorSet.hover : ""}
                      text-white font-black text-4xl md:text-5xl
                      rounded-2xl py-6 shadow-lg transition-all
                      ${answerShake === opt ? "animate-shake" : ""}
                      ${extra}
                      disabled:cursor-not-allowed
                    `}
                  >
                    {isSelected && feedback === "correct"
                      ? "✅"
                      : isSelected && feedback === "wrong"
                        ? "❌"
                        : opt}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="text-center pb-6">
        <span
          className="text-5xl animate-float"
          style={{ display: "inline-block" }}
        >
          {feedback === "correct" ? "🦁" : feedback === "wrong" ? "😅" : "🐘"}
        </span>
      </div>
    </div>
  );
}

// ─── Result Screen ────────────────────────────────────────────────────────────
function ResultScreen({
  score,
  onReplay,
  onHome,
}: { score: number; onReplay: () => void; onHome: () => void }) {
  const [showConfetti, setShowConfetti] = useState(true);
  const stars = Math.round((score / TOTAL_QUESTIONS) * 5);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const getMessage = () => {
    if (score === TOTAL_QUESTIONS)
      return { text: "परफेक्ट स्कोर! 🏆", sub: "तुम गणित के राजा हो!", emoji: "👑" };
    if (score >= 8)
      return { text: "शानदार! 🌟", sub: "बहुत बढ़िया खेले!", emoji: "🦁" };
    if (score >= 6)
      return { text: "बहुत अच्छा! ⭐", sub: "और अभ्यास करते रहो!", emoji: "🐘" };
    if (score >= 4)
      return {
        text: "अच्छा किया! 💪",
        sub: "हिम्मत रखो, दोबारा खेलो!",
        emoji: "🐒",
      };
    return { text: "कोई बात नहीं! 😊", sub: "अभ्यास से सब होता है!", emoji: "🌈" };
  };

  const msg = getMessage();

  return (
    <div className="min-h-screen sky-bg flex flex-col items-center justify-center px-4 py-8">
      <Confetti active={showConfetti} />

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl p-8 shadow-kid text-center mb-6">
          <div
            className="text-7xl mb-4 animate-bounce-in"
            style={{ display: "inline-block" }}
          >
            {msg.emoji}
          </div>
          <h1 className="font-black text-3xl text-foreground mb-1">
            {msg.text}
          </h1>
          <p className="text-muted-foreground font-bold text-lg">{msg.sub}</p>

          <div className="flex justify-center gap-2 my-6">
            {FIVE_STARS.map((starIdx) => (
              <motion.span
                key={starIdx}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.3 + starIdx * 0.12,
                  type: "spring",
                  stiffness: 300,
                }}
                className="text-4xl"
              >
                {starIdx < stars ? "⭐" : "☆"}
              </motion.span>
            ))}
          </div>

          <div className="bg-sky-pale rounded-2xl p-4 mb-2">
            <p className="text-muted-foreground font-black uppercase text-sm mb-1">
              तुम्हारा स्कोर
            </p>
            <p className="font-black text-5xl text-foreground">
              <span className="text-jungle">{score}</span>
              <span className="text-muted-foreground text-3xl">
                /{TOTAL_QUESTIONS}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <motion.button
            type="button"
            data-ocid="result.replay.button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onReplay}
            className="bg-coral text-white font-black text-xl uppercase py-5 rounded-2xl shadow-coral hover:bg-coral-light transition-colors"
          >
            🔄 फिर से खेलो!
          </motion.button>
          <motion.button
            type="button"
            data-ocid="result.home.button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onHome}
            className="bg-white text-foreground font-black text-xl uppercase py-5 rounded-2xl shadow-card border-2 border-border hover:bg-muted transition-colors"
          >
            🏠 होम पर जाओ
          </motion.button>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          {MASCOTS.map((e, i) => (
            <span
              key={`result-mascot-${e}`}
              className="text-5xl"
              style={{
                display: "inline-block",
                animation: "float 3s ease-in-out infinite",
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {e}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<GameMode>("addition");
  const [finalScore, setFinalScore] = useState(0);

  const handleStart = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setScreen("game");
  };

  const handleFinish = (score: number) => {
    setFinalScore(score);
    setScreen("result");
  };

  return (
    <AnimatePresence mode="wait">
      {screen === "home" && (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <HomeScreen onStart={handleStart} />
        </motion.div>
      )}
      {screen === "game" && (
        <motion.div
          key="game"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
        >
          <GameScreen
            mode={mode}
            onFinish={handleFinish}
            onHome={() => setScreen("home")}
          />
        </motion.div>
      )}
      {screen === "result" && (
        <motion.div
          key="result"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <ResultScreen
            score={finalScore}
            onReplay={() => setScreen("game")}
            onHome={() => setScreen("home")}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
