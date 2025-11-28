// ==============================
// やさいクイズ script.js（BGM + 効果音 完全版）
// ==============================

let quizData = [];
let current = 0;
let score = 0;

// ==============================
// 🎵 ここから BGM & 効果音
// ==============================
const bgmNormal = new Audio("music/Tekuteku_Aruko-1(Marimba).mp3");   // タイトル・選択画面
const bgmQuiz = new Audio("music/Dotabata_Panic-1(Fast).mp3");        // クイズ中
const seCorrect = new Audio("music/Quiz-Ding_Dong05-4(Slow-Short).mp3");
const seWrong = new Audio("music/Short_Accent10-1(Low).mp3");
const seButton = new Audio("music/Inspiration03-1(High).mp3");
const seResult = new Audio("music/Quiz-Results01-1.mp3");

bgmNormal.loop = true;
bgmQuiz.loop = true;

bgmNormal.volume = 1.0;
bgmQuiz.volume = 1.0;

// 🚫 動画再生中のミュート制御
let isVideoPlaying = false;

// 🔊 ボタン押したら SE 再生
document.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    seButton.currentTime = 0;
    seButton.play();
  }
});

// 🔊 BGM フェード関数
function fadeOut(audio, duration = 600) {
  const step = audio.volume / (duration / 30);
  const fade = setInterval(() => {
    audio.volume = Math.max(0, audio.volume - step);
    if (audio.volume <= 0) {
      audio.pause();
      clearInterval(fade);
    }
  }, 30);
}

// 🔊 フェードイン
function fadeIn(audio, targetVolume = 1.0, duration = 600) {
  audio.volume = 0;
  audio.play();
  const step = targetVolume / (duration / 30);
  const fade = setInterval(() => {
    audio.volume = Math.min(targetVolume, audio.volume + step);
    if (audio.volume >= targetVolume) {
      clearInterval(fade);
    }
  }, 30);
}

// ==============================
// 画面切り替え
// ==============================
function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // 🎵 画面別の BGM 切替
  if (id === "title-screen" || id === "select-screen") {
    fadeOut(bgmQuiz);
    fadeIn(bgmNormal, 1.0);
  } else if (id === "quiz-screen") {
    fadeOut(bgmNormal);

    // 音クイズ中なら音量 1/4 に
    const isSoundQuiz = quizData[current]?.choice1_text !== undefined;
    fadeIn(bgmQuiz, isSoundQuiz ? 0.25 : 1.0);
  }
}

// ==============================
// CSV読み込み
// ==============================
async function loadCSV(path = "./data.csv") {
  const res = await fetch(path);
  if (!res.ok) throw new Error("CSV読み込み失敗");
  const text = await res.text();
  const [header, ...rows] = text.trim().split("\n");
  const keys = header.split(",").map((k) => k.trim());
  return rows.map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return Object.fromEntries(keys.map((k, i) => [k, cols[i]]));
  });
}

const pickRandom = (arr, n = 3) =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);

// ==============================
// クイズ1：問題表示
// ==============================
function renderQuestion() {
  const q = quizData[current];
  if (!q) return renderResult();

  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choices = document.getElementById("choices");

  questionText.textContent = q.question || "";
  questionImage.src = q.image || "";
  choices.innerHTML = "";

  const opts = [
    q.choice1_img ? { img: q.choice1_img, correct: true } : null,
    q.choice2_img ? { img: q.choice2_img, correct: false } : null,
    q.choice3_img ? { img: q.choice3_img, correct: false } : null,
  ].filter(Boolean);

  opts.sort(() => Math.random() - 0.5);

  opts.forEach((o) => {
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

// ==============================
// 判定画面
// ==============================
function handleAnswer(isCorrect, q) {
  const judgeText = document.getElementById("judge-text");
  judgeText.textContent = isCorrect ? "せいかい！" : "ざんねん！";

  // 🎵 効果音
  (isCorrect ? seCorrect : seWrong).play();

  if (isCorrect) score++;
  show("judge-screen");

  setTimeout(() => showAnswer(q), 1000);
}

// ==============================
// クイズ1：答えあわせ
// ==============================
function showAnswer(q) {
  const video = document.getElementById("answer-video");

  isVideoPlaying = true;
  fadeOut(bgmQuiz);

  video.pause();
  video.src = q.answer_video;
  video.style.display = "block";
  video.currentTime = 0;
  video.muted = false;

  video.play().catch((e) => console.warn("video error:", e));

  video.onended = () => {
    isVideoPlaying = false;
    fadeIn(bgmQuiz, 1.0);
  };

  const next = document.getElementById("next-btn");
  next.textContent =
    current >= quizData.length - 1 ? "けっかをみる" : "つぎのもんだいへ";

  next.onclick = () => {
    video.pause();
    video.src = "";
    isVideoPlaying = false;
    fadeIn(bgmQuiz, 1.0);

    if (current >= quizData.length - 1) renderResult();
    else {
      current++;
      renderQuestion();
    }
  };

  show("answer-screen");
}

// ==============================
// 結果
// ==============================
function renderResult() {
  document.getElementById("score-text").textContent = `せいかい：${score} / ${quizData.length}`;

  // 🎵 リザルトSE
  seResult.currentTime = 0;
  seResult.play();

  // 🎵 BGM はタイトル曲に戻す
  fadeOut(bgmQuiz);
  fadeIn(bgmNormal, 1.0);

  show("end-screen");
}

// ==============================
// クイズ2：音クイズ
// ==============================
function renderQuestionSound() {
  const q = quizData[current];
  if (!q) return renderResult();

  show("quiz-screen");

  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choices = document.getElementById("choices");
  questionText.textContent = q.question;
  questionImage.src = q.image;
  choices.innerHTML = "";

  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.style.display = "none";
  video.currentTime = 0;
  video.muted = false;
  video.play().catch((e) => console.warn(e));

  // BGM は小さく
  fadeOut(bgmNormal);
  fadeIn(bgmQuiz, 0.25);

  const opts = [
    { img: q.choice1_img, text: q.choice1_text, correct: true },
    { img: q.choice2_img, text: q.choice2_text, correct: false },
  ].sort(() => Math.random() - 0.5);

  const container = document.createElement("div");
  container.className = "choice-container";

  opts.forEach((o) => {
    const div = document.createElement("div");
    div.className = "choice-item";
    const img = document.createElement("img");
    img.src = o.img;
    const label = document.createElement("p");
    label.textContent = o.text;
    div.appendChild(img);
    div.appendChild(label);
    div.onclick = () => handleAnswerSound(o.correct, q);
    container.appendChild(div);
  });

  choices.appendChild(container);
}

function handleAnswerSound(isCorrect, q) {
  const judgeText = document.getElementById("judge-text");
  judgeText.textContent = isCorrect ? "⭕ せいかい！" : "❌ ざんねん！";
  (isCorrect ? seCorrect : seWrong).play();

  if (isCorrect) score++;
  show("judge-screen");

  setTimeout(() => showAnswerSound(q), 1000);
}

function showAnswerSound(q) {
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.style.display = "block";
  video.currentTime = 0;

  fadeOut(bgmQuiz);

  video.play().catch((e) => console.warn(e));
  video.onended = () => fadeIn(bgmQuiz, 0.25);

  const next = document.getElementById("next-btn");
  next.textContent =
    current >= quizData.length - 1 ? "けっかをみる" : "つぎのもんだいへ";

  next.onclick = () => {
    video.pause();
    fadeIn(bgmQuiz, 0.25);

    if (current >= quizData.length - 1) renderResultSound();
    else {
      current++;
      renderQuestionSound();
    }
  };

  show("answer-screen");
}

// 結果（音クイズ）
function renderResultSound() {
  document.getElementById("score-text").textContent = `せいかい：${score} / ${quizData.length}`;
  seResult.play();
  fadeOut(bgmQuiz);
  fadeIn(bgmNormal, 1.0);
  show("end-screen");
}

// ==============================
// イベント登録
// ==============================
document.getElementById("start-btn").onclick = () => show("select-screen");

document.getElementById("quiz-shape-btn").onclick = async () => {
  const data = await loadCSV("./data.csv");
  quizData = pickRandom(data, 3);
  current = 0;
  score = 0;
  renderQuestion();
};

document.getElementById("quiz-sound-btn").onclick = async () => {
  const data = await loadCSV("./data_sound.csv");
  quizData = pickRandom(data, 3);
  current = 0;
  score = 0;
  renderQuestionSound();
};

document.getElementById("restart-btn").onclick = () => location.reload();
