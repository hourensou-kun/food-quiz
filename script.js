// ==============================
// やさいクイズ script.js（安定版）
// ==============================

let quizData = [];
let current = 0;
let score = 0;

// 画面切り替え
function show(id) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.remove("active");
    s.style.display = "none";
  });
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("active");
    el.style.display = "block";
  }
}

// CSV読み込み
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

// ランダム抽出（3問）
const pickRandom = (arr, n = 3) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

// 問題を表示
function renderQuestion() {
  const q = quizData[current];
  if (!q) return renderResult();

  document.getElementById("question-text").textContent = q.question;
  document.getElementById("question-image").src = q.image;

  const choices = document.getElementById("choices");
  choices.innerHTML = "";

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

// 答えクリック時
function handleAnswer(isCorrect, q) {
  const feedback = document.getElementById("feedback-area");
  const video = document.getElementById("answer-video");
  const nextBtn = document.getElementById("next-btn");

  feedback.textContent = isCorrect ? "⭕ せいかい！" : "❌ ざんねん！";

  if (isCorrect) score++;

  // 動画をセット（自動再生しない）
  video.src = q.answer_video;
  video.muted = false;
  video.controls = true; // 手動再生
  video.load();

  // 最後の問題ならボタン文言変更
  nextBtn.textContent = current >= quizData.length - 1 ? "けっかをみる ▶️" : "つぎのもんだいへ ▶️";

  nextBtn.onclick = () => {
    if (current >= quizData.length - 1) {
      renderResult();
    } else {
      current++;
      renderQuestion();
    }
  };

  show("answer-screen");
}

// 結果画面
function renderResult() {
  document.getElementById("score-text").textContent = `せいかい：${score} / ${quizData.length}`;
  show("end-screen");
}

// イベント登録
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
