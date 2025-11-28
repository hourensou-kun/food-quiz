// ==============================
// やさいクイズ script.js（完全分離画面タイプ）+ BGM/効果音
// ==============================

let quizData = [];
let current = 0;
let score = 0;

/* ============================
   🎵 BGM & 効果音 ヘルパー
   ============================ */
function playBGM() {
  const bgm = document.getElementById("bgm");
  if (!bgm) return;
  if (bgm.paused) {
    bgm.volume = 0.5;            // お好みで音量調整
    bgm.play().catch(() => {});  // iOS対策：失敗しても無視
  }
}
function pauseBGM() {
  const bgm = document.getElementById("bgm");
  if (!bgm) return;
  bgm.pause();
}

function playSECorrect() {
  const se = document.getElementById("se-correct");
  if (!se) return;
  se.currentTime = 0;
  se.play().catch(() => {});
}
function playSEWrong() {
  const se = document.getElementById("se-wrong");
  if (!se) return;
  se.currentTime = 0;
  se.play().catch(() => {});
}

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

// ---- 問題表示（かたちクイズ）----
function renderQuestion() {
  const q = quizData[current];
  if (!q) return renderResult();

  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choices = document.getElementById("choices");

  questionText.textContent = q.question || "";
  questionImage.src = q.image || "";
  choices.innerHTML = "";

  // choice1_img / choice1 どちらにも対応
  const opts = [
    q.choice1_img || q.choice1 ? { img: q.choice1_img || q.choice1, correct: true } : null,
    q.choice2_img || q.choice2 ? { img: q.choice2_img || q.choice2, correct: false } : null,
    q.choice3_img || q.choice3 ? { img: q.choice3_img || q.choice3, correct: false } : null
  ].filter(Boolean);

  opts.sort(() => Math.random() - 0.5);

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

// ---- ○×判定画面（1秒後に答えあわせ）----
function handleAnswer(isCorrect, q) {
  // 🎵 効果音
  if (isCorrect) {
    playSECorrect();
  } else {
    playSEWrong();
  }

  const judgeText = document.getElementById("judge-text");
  judgeText.textContent = isCorrect ? "せいかい！" : "ざんねん！";
  if (isCorrect) score++;
  show("judge-screen");

  setTimeout(() => showAnswer(q), 1000);
}

// ---- 答えあわせ画面（動画再生：BGMは一時停止）----
function showAnswer(q) {
  const video = document.getElementById("answer-video");

  video.pause();
  video.src = q.answer_video;
  video.style.display = "block";
  video.muted = false;
  video.currentTime = 0;

  // 🔇 クイズ動画の間は BGM を止める
  pauseBGM();
  video.play().catch(e => console.warn("再生エラー:", e));

  const next = document.getElementById("next-btn");
  next.textContent = current >= quizData.length - 1
    ? "けっかをみる"
    : "つぎのもんだいへ";

  next.onclick = () => {
    video.pause();       // 答えあわせ動画を止める
    playBGM();           // 🔊 次の問題や結果画面では BGM 再開

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
  document.getElementById("score-text").textContent = `せいかい：${score} / ${quizData.length}`;
  show("end-screen");
}

// ---- イベント登録 ----
// スタートで BGM 再生開始（ユーザー操作なので iOS でもOK）
document.getElementById("start-btn").onclick = () => {
  playBGM();
  show("select-screen");
};

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
  choices.innerHTML = "";

  // 出題時：「音声だけ」再生（映像非表示）→ BGM は止める
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.currentTime = 0;
  video.muted = false;
  video.style.display = "none";

  pauseBGM();  // 🔇 クイズ音声中は BGM オフ
  video.play().catch(e => console.warn("音声再生エラー:", e));

  // 2択（画像＋文字、左右ランダム）
  const opts = [
    { img: q.choice1_img, text: q.choice1_text, correct: true },
    { img: q.choice2_img, text: q.choice2_text, correct: false }
  ].sort(() => Math.random() - 0.5);

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
      video.pause();   // 出題音を止める
      playBGM();       // 🔊 判定画面では BGM 再開
      handleAnswerSound(o.correct, q);
    };

    container.appendChild(div);
  });

  choices.appendChild(container);
  show("quiz-screen");
}

// ---- 音クイズ用：判定＆答えあわせ遷移 ----
function handleAnswerSound(isCorrect, q) {
  // 🎵 効果音
  if (isCorrect) {
    playSECorrect();
  } else {
    playSEWrong();
  }

  const judgeText = document.getElementById("judge-text");
  judgeText.textContent = isCorrect ? "⭕ せいかい！" : "❌ ざんねん！";
  if (isCorrect) score++;
  show("judge-screen");

  setTimeout(() => showAnswerSound(q), 1000);
}

// ---- 音クイズ用：答えあわせ（映像＋音で再生）----
function showAnswerSound(q) {
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.currentTime = 0;
  video.muted = false;
  video.style.display = "block";

  pauseBGM(); // 🔇 答えあわせ動画の間も BGM オフ
  video.play().catch(e => console.warn("動画再生エラー:", e));

  const next = document.getElementById("next-btn");
  next.textContent = current >= quizData.length - 1
    ? "けっかをみる ▶️"
    : "つぎのもんだいへ ▶️";

  next.onclick = () => {
    video.pause();
    playBGM();   // 🔊 次の問題 or 結果では BGM 再開

    if (current >= quizData.length - 1) {
      renderResult();
    } else {
      current++;
      renderQuestionSound();
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
    renderQuestionSound();
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
};
