// --- 設定 ---
const CSV_PATH = "./data.csv";
const QUIZ_COUNT = 3;

let quizData = [];
let current = 0;
let score = 0;

// --- 画面切り替え ---
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// --- CSV読み込み ---
async function loadCSV() {
  const res = await fetch(CSV_PATH);
  const text = await res.text();
  const [header, ...lines] = text.trim().split("\n");
  const keys = header.split(",");
  return lines.map(line => {
    const cols = line.split(",");
    return Object.fromEntries(keys.map((k, i) => [k, cols[i] || ""]));
  });
}

// --- 問題表示 ---
function showQuestion() {
  const q = quizData[current];
  if (!q) return showResult();

  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choicesDiv = document.getElementById("choices");

  questionText.textContent = q.question;
  questionImage.src = q.image;
  choicesDiv.innerHTML = "";

  // choice1が正解、並び順はランダム
  const choices = [
    { img: q.choice1_img, correct: true },
    { img: q.choice2_img, correct: false },
    { img: q.choice3_img, correct: false },
  ].sort(() => Math.random() - 0.5);

  choices.forEach(c => {
    const img = document.createElement("img");
    img.src = c.img;
    img.className = "choice-img";
    img.onclick = () => handleAnswer(c.correct, q);
    choicesDiv.appendChild(img);
  });

  show("quiz-screen");
}

// --- 回答処理 ---
function handleAnswer(isCorrect, q) {
  if (isCorrect) score++;

  const feedback = document.createElement("div");
  feedback.textContent = isCorrect ? "⭕ せいかい！" : "❌ ざんねん！";
  feedback.className = "feedback-overlay";
  document.getElementById("quiz-screen").appendChild(feedback);

  setTimeout(() => {
    feedback.remove();
    showAnswer(q);
  }, 1000);
}

// --- 答え合わせ動画 ---
function showAnswer(q) {
  show("answer-screen");
  const video = document.getElementById("answer-video");
  video.src = q.answer_video;
  video.load();
  video.play().catch(() => {});
  const next = document.getElementById("next-btn");
  next.textContent = current === quizData.length - 1 ? "けっかをみる ▶️" : "つぎのもんだいへ ▶️";
  next.onclick = () => {
    current++;
    current >= quizData.length ? showResult() : showQuestion();
  };
}

// --- 結果画面 ---
function showResult() {
  show("end-screen");
  document.getElementById("score-text").textContent = `せいかい：${score} / ${quizData.length}`;
}

// --- スタート時の処理 ---
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start-btn").onclick = () => show("select-screen");
  document.getElementById("restart-btn").onclick = () => location.reload();

  document.getElementById("quiz-shape-btn").onclick = async () => {
    try {
      const data = await loadCSV();
      quizData = data.sort(() => Math.random() - 0.5).slice(0, QUIZ_COUNT);
      current = 0;
      score = 0;
      showQuestion();
    } catch (e) {
      alert("CSVの読み込みに失敗しました");
      console.error(e);
    }
  };
});
