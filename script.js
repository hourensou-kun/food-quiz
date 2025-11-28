// ==============================
// やさいクイズ script.js（完全分離画面タイプ）
// ==============================

let quizData = [];
let current = 0;
let score = 0;

// ---- 画面切り替え ----
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
const pickRandom = (arr, n = 3) =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);

// ---- 形クイズ（3択）----
function renderQuestion() {
  const q = quizData[current];
  if (!q) return renderResult();

  const choices = document.getElementById("choices");
  choices.innerHTML = "";

  const opts = [
    { img: q.choice1_img || q.choice1, correct: true },
    { img: q.choice2_img || q.choice2, correct: false },
    { img: q.choice3_img || q.choice3, correct: false }
  ].filter(o => o.img);

  opts.sort(() => Math.random() - 0.5);

  document.getElementById("question-text").textContent = q.question;
  document.getElementById("question-image").src = q.image;

  opts.forEach(o => {
    const div = document.createElement("div");
    div.className = "choice-item";

    const img = document.createElement("img");
    img.src = o.img;

    div.appendChild(img);
    div.onclick = () => handleAnswer(o.correct, q);

    choices.appendChild(div);
  });

  show("quiz-screen");
}

// ---- ○×判定 ----
function handleAnswer(isCorrect, q) {
  document.getElementById("judge-text").textContent =
    isCorrect ? "せいかい！" : "ざんねん！";

  if (isCorrect) score++;

  show("judge-screen");
  setTimeout(() => showAnswer(q), 1000);
}

// ---- 答えあわせ ----
function showAnswer(q) {
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.style.display = "block";
  video.currentTime = 0;
  video.play();

  const next = document.getElementById("next-btn");
  next.textContent =
    current >= quizData.length - 1 ? "けっかをみる" : "つぎのもんだいへ";

  next.onclick = () => {
    video.pause();
    if (current >= quizData.length - 1) renderResult();
    else {
      current++;
      renderQuestion();
    }
  };

  show("answer-screen");
}

// ---- リザルト ----
function renderResult() {
  document.getElementById("score-text").textContent =
    `せいかい：${score} / ${quizData.length}`;
  show("end-screen");
}

// ---- イベント登録 ----
document.getElementById("start-btn").onclick = () => show("select-screen");

document.getElementById("quiz-shape-btn").onclick = async () => {
  const data = await loadCSV("./data.csv");
  quizData = pickRandom(data, 3);
  current = 0;
  score = 0;
  renderQuestion();
};

document.getElementById("restart-btn").onclick = () => location.reload();


// ==============================
// 🎵 音クイズ（2択）
// ==============================

function renderQuestionSound() {
  const q = quizData[current];
  if (!q) return renderResult();

  const choices = document.getElementById("choices");
  choices.innerHTML = "";

  // 2択
  const opts = [
    { img: q.choice1_img, text: q.choice1_text, correct: true },
    { img: q.choice2_img, text: q.choice2_text, correct: false }
  ].sort(() => Math.random() - 0.5);

  document.getElementById("question-text").textContent = q.question;
  document.getElementById("question-image").src = q.image;

  // 音だけ再生
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.currentTime = 0;
  video.style.display = "none";
  video.play();

  opts.forEach(o => {
    const div = document.createElement("div");
    div.className = "choice-item";

    const img = document.createElement("img");
    img.src = o.img;

    const label = document.createElement("p");
    label.textContent = o.text;

    div.appendChild(img);
    div.appendChild(label);

    div.onclick = () => {
      video.pause();
      handleAnswerSound(o.correct, q);
    };

    choices.appendChild(div);
  });

  show("quiz-screen");
}

function handleAnswerSound(isCorrect, q) {
  document.getElementById("judge-text").textContent =
    isCorrect ? "せいかい！" : "ざんねん！";

  if (isCorrect) score++;

  show("judge-screen");
  setTimeout(() => showAnswerSound(q), 1000);
}

function showAnswerSound(q) {
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.currentTime = 0;
  video.style.display = "block";
  video.play();

  const next = document.getElementById("next-btn");
  next.textContent =
    current >= quizData.length - 1 ? "けっかをみる ▶️" : "つぎのもんだいへ ▶️";

  next.onclick = () => {
    video.pause();
    if (current >= quizData.length - 1) renderResult();
    else {
      current++;
      renderQuestionSound();
    }
  };

  show("answer-screen");
}

document.getElementById("quiz-sound-btn").onclick = async () => {
  const data = await loadCSV("./data_sound.csv");
  quizData = pickRandom(data, 3);
  current = 0;
  score = 0;
  renderQuestionSound();
};
