// ==============================
// やさいクイズ script.js（最終安定版）
// ==============================

let quizData = [];
let current = 0;
let score = 0;

// ---- 汎用：画面切り替え ----
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ---- CSV読み込み ----
async function loadCSV(path = "./data.csv") {
  const res = await fetch(path);
  if (!res.ok) throw new Error("CSV読み込み失敗");
  const text = await res.text();
  const [header, ...rows] = text.trim().split("\n");
  const keys = header.split(",").map(k => k.trim());
  return rows.map(line => {
    const cols = line.split(",").map(c => c.trim());
    return Object.fromEntries(keys.map((k, i) => [k, cols[i]]));
  });
}

// ---- ランダム抽出 ----
const pickRandom = (arr, n = 3) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

// ---- 問題を表示 ----
function renderQuestion() {
  const q = quizData[current];
  if (!q) return renderResult();

  const qText = document.getElementById("question-text");
  const qImg = document.getElementById("question-image");
  const choices = document.getElementById("choices");

  qText.textContent = q.question;
  qImg.src = q.image;
  choices.innerHTML = "";

  // 正解choice1・ランダム順
  const opts = [
    { img: q.choice1_img, correct: true },
    { img: q.choice2_img, correct: false },
    { img: q.choice3_img, correct: false }
  ].sort(() => Math.random() - 0.5);

  opts.forEach(o => {
    const div = document.createElement("div");
    div.className = "choice-item";
    const img = document.createElement("img");
    img.src = o.img;
    img.alt = "せんたくし";
    div.appendChild(img);
    div.onclick = () => handleAnswer(o.correct, q);
    choices.appendChild(div);
  });

  show("quiz-screen");
}

// ---- 答えクリック ----
function handleAnswer(isCorrect, q) {
  const video = document.getElementById("answer-video");
  const feedback = document.getElementById("feedback-area");
  const next = document.getElementById("next-btn");

  feedback.textContent = isCorrect ? "せいかい！🎉" : "ざんねん！💦";
  if (isCorrect) score++;

  video.src = q.answer_video;
  video.currentTime = 0;
  video.play();

  // 最後の問題判定
  next.textContent = current >= quizData.length - 1 ? "けっかをみる ▶️" : "つぎのもんだいへ ▶️";

  next.onclick = () => {
    if (current >= quizData.length - 1) {
      renderResult();
    } else {
      current++;
      renderQuestion();
    }
  };

  show("answer-screen");
}

// ---- 結果表示 ----
function renderResult() {
  const scoreText = document.getElementById("score-text");
  scoreText.textContent = `せいかい：${score} / ${quizData.length}`;
  show("end-screen");
}

// ---- イベント登録 ----
document.getElementById("start-btn").onclick = () => show("select-screen");

document.getElementById("quiz-shape-btn").onclick = async () => {
  try {
    const data = await loadCSV("./data.csv");
    quizData = pickRandom(data, 3);
    current = 0;
    score = 0;
    renderQuestion();
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
};

document.getElementById("restart-btn").onclick = () => location.reload();
