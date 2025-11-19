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
const pickRandom = (arr, n = 3) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

// ---- 問題表示 ----
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

// ---- ○×判定画面（1秒後に自動遷移）----
function handleAnswer(isCorrect, q) {
  const judgeText = document.getElementById("judge-text");
  judgeText.textContent = isCorrect ? "⭕ せいかい！" : "❌ ざんねん！";
  if (isCorrect) score++;
  show("judge-screen");

  // 1秒後に答えあわせへ
  setTimeout(() => showAnswer(q), 1000);
}

// ---- 答えあわせ画面 ----
function showAnswer(q) {
  const video = document.getElementById("answer-video");

  video.pause();
  video.src = q.answer_video;
  video.style.display = "block"; // ← 映像を表示する
  video.muted = false;
  video.currentTime = 0;
  video.play().catch(e => console.warn("再生エラー:", e));

  const next = document.getElementById("next-btn");
  next.textContent = current >= quizData.length - 1
    ? "けっかをみる ▶️"
    : "つぎのもんだいへ ▶️";

  next.onclick = () => {
    video.pause(); // ← 答えあわせ動画を止めて次へ
    if (current >= quizData.length - 1) {
      renderResult();
    } else {
      current++;
      renderQuestionSound();
    }
  };

  show("answer-screen");
}

// ---- 結果表示 ----
function renderResult() {
  document.getElementById("score-text").textContent = `せいかい：${score} / ${quizData.length}`;
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

// ==============================
// クイズ2：やさいをきったらどんなおと？
// ==============================

// ---- 音クイズ用：問題表示（音だけ再生＋2択＋文字つき）----
function renderQuestionSound() {
  const q = quizData[current];
  if (!q) return renderResult();

  // 問題文と画像
  document.getElementById("question-text").textContent = q.question;
  document.getElementById("question-image").src = q.image;

  const choices = document.getElementById("choices");
  choices.innerHTML = ""; // ← 前問のHTMLを確実にリセット

  // 出題時に「音声だけ」再生（映像非表示）
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.currentTime = 0;
  video.muted = false;
  video.style.display = "none"; // ← 出題時は音だけ
  video.play().catch(e => console.warn("音声再生エラー:", e));

  // 2択（画像＋文字、左右ランダム）
  const opts = [
    { img: q.choice1_img, text: q.choice1_text, correct: true },
    { img: q.choice2_img, text: q.choice2_text, correct: false }
  ].sort(() => Math.random() - 0.5);

  // コンテナ生成
  const container = document.createElement("div");
  container.className = "choice-container";
  container.style.display = "flex";
  container.style.justifyContent = "center";
  container.style.gap = "20px";

  opts.forEach(o => {
    const div = document.createElement("div");
    div.className = "choice-item";

    const img = document.createElement("img");
    img.src = o.img;
    img.alt = o.text;

    const label = document.createElement("p");
    label.textContent = o.text;
    label.style.marginTop = "6px";
    label.style.fontSize = "1.2em";
    label.style.fontWeight = "bold";

    div.appendChild(img);
    div.appendChild(label);

    div.onclick = () => {
      video.pause(); // 出題音を止める
      handleAnswerSound(o.correct, q); // ← 音クイズ専用判定へ
    };

    container.appendChild(div);
  });

  choices.appendChild(container);
  show("quiz-screen");
}

// ---- 音クイズ用：判定＆答えあわせ遷移 ----
function handleAnswerSound(isCorrect, q) {
  const judgeText = document.getElementById("judge-text");
  judgeText.textContent = isCorrect ? "⭕ せいかい！" : "❌ ざんねん！";
  if (isCorrect) score++;
  show("judge-screen");

  // 1秒後に答えあわせへ
  setTimeout(() => showAnswerSound(q), 1000);
}

// ---- 音クイズ用：答えあわせ（映像＋音で再生）----
function showAnswerSound(q) {
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.currentTime = 0;
  video.muted = false;
  video.style.display = "block"; // ← 映像を見せる
  video.play().catch(e => console.warn("動画再生エラー:", e));

  const next = document.getElementById("next-btn");
  next.textContent = current >= quizData.length - 1
    ? "けっかをみる ▶️"
    : "つぎのもんだいへ ▶️";

  next.onclick = () => {
    video.pause();
    if (current >= quizData.length - 1) {
      renderResult();
    } else {
      current++;
      renderQuestionSound(); // ← 次も音クイズ専用で出題！
    }
  };

  show("answer-screen");
}

// ---- 音クイズボタン登録 ----
document.getElementById("quiz-sound-btn").disabled = false;
document.getElementById("quiz-sound-btn").onclick = async () => {
  try {
    const data = await loadCSV("./data_sound.csv");
    quizData = pickRandom(data, 3);
    current = 0;
    score = 0;
    renderQuestionSound(); // ← 専用関数呼び出し
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
};

// 💡 画面スケーリング（常に全体が見えるように）
function fitToScreen() {
  const baseWidth = 675;
  const baseHeight = 1200;
  const scale = Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight);
  document.documentElement.style.setProperty("--scale", scale);
}

window.addEventListener("resize", fitToScreen);
window.addEventListener("orientationchange", fitToScreen);
fitToScreen();

