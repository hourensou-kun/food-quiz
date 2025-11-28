// ==============================
// やさいクイズ script.js（完全分離画面タイプ）+ BGM/効果音（フェード付き）
// ==============================

let quizData = [];
let current = 0;
let score = 0;

/* ============================
   🎵 BGM & 効果音 ヘルパー
   ============================ */
let bgmFadeTimer = null;

function playBGM() {
  const bgm = document.getElementById("bgm");
  if (!bgm) return;

  // フェード中だったら止める
  if (bgmFadeTimer) {
    clearInterval(bgmFadeTimer);
    bgmFadeTimer = null;
  }

  // 通常音量
  bgm.volume = 0.5;

  if (bgm.paused) {
    bgm.play().catch(() => {
      // モバイルで失敗しても無視（ユーザー操作後にまた呼ばれる）
    });
  }
}

// 音量を徐々に下げてから停止
function pauseBGM() {
  const bgm = document.getElementById("bgm");
  if (!bgm) return;
  if (bgm.paused) return;

  if (bgmFadeTimer) {
    clearInterval(bgmFadeTimer);
  }

  const fadeDuration = 600; // フェード時間（ms）
  const steps = 12;
  const stepTime = fadeDuration / steps;
  const startVolume = bgm.volume;
  const volumeStep = startVolume / steps;

  bgmFadeTimer = setInterval(() => {
    let v = bgm.volume - volumeStep;
    if (v <= 0.01) {
      v = 0;
      bgm.volume = v;
      bgm.pause();
      bgm.volume = 0.5; // 次回再生用にリセット
      clearInterval(bgmFadeTimer);
      bgmFadeTimer = null;
    } else {
      bgm.volume = v;
    }
  }, stepTime);
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

// ---- 問題表示（クイズ1：かたち）----
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

// ---- 答えあわせ画面（クイズ1）----
// ※ここでは BGM は止めない（動画＋BGM 同時）
function showAnswer(q) {
  const video = document.getElementById("answer-video");

  video.pause();
  video.src = q.answer_video;
  video.style.display = "block";
  video.muted = false;
  video.currentTime = 0;

  // クイズ1では BGM 停止しない
  video.play().catch(e => console.warn("再生エラー:", e));

  const next = document.getElementById("next-btn");
  next.textContent = current >= quizData.length - 1
    ? "けっかをみる"
    : "つぎのもんだいへ";

  next.onclick = () => {
    video.pause(); // 答えあわせ動画を止める

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

/* ============================
   🎮 イベント登録
   ============================ */

// ✅ ブラウザの制限で「ユーザー操作のあと」しか再生できないので
//   最初のクリックで BGM をスタートさせる
document.addEventListener(
  "click",
  () => {
    playBGM();
  },
  { once: true }
);

// スタートボタン：画面遷移だけ（BGM再生は上の1回きりリスナーでも行われる）
document.getElementById("start-btn").onclick = () => {
  playBGM();          // 念のためここでも呼ぶ（2回目以降は無視される）
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

  // 出題時：「音声だけ」再生（映像非表示）
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.currentTime = 0;
  video.muted = false;
  video.style.display = "none";

  // 🔇 音クイズの問題音声の間は BGM をフェードアウト
  pauseBGM();
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

  // 🔇 答えあわせ動画の間も BGM フェードアウト
  pauseBGM();
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
