// ==============================
// やさいクイズ script.js（完全分離画面タイプ）+ BGM/効果音
// ==============================

let quizData = [];
let current = 0;
let score = 0;

// BGMの音量プリセット
const BGM_NORMAL = 0.5;  // いつもの音量
const BGM_LOW    = 0.25; // 音クイズ中の音量

/* ============================
   🎵 BGM & 効果音 ヘルパー
   ============================ */

// BGMを流す（必要なら音量を指定）
function playBGM(volume = BGM_NORMAL) {
  const bgm = document.getElementById("bgm");
  if (!bgm) return;

  bgm.volume = volume;

  if (bgm.paused) {
    bgm.play().catch(() => {
      // iOSなどで失敗しても、ユーザー操作後にまた呼ばれるので無視
    });
  }
}

// BGM音量だけ変える
function setBGMVolume(v) {
  const bgm = document.getElementById("bgm");
  if (!bgm) return;
  bgm.volume = v;
}

// 正解SE
function playSECorrect() {
  const se = document.getElementById("se-correct");
  if (!se) return;
  se.currentTime = 0;
  se.play().catch(() => {});
}

// 不正解SE
function playSEWrong() {
  const se = document.getElementById("se-wrong");
  if (!se) return;
  se.currentTime = 0;
  se.play().catch(() => {});
}

/* ============================
   🖥 画面切り替え
   ============================ */

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ============================
   🗂 CSV読み込み＆問題選択
   ============================ */

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

// ランダム抽出
const pickRandom = (arr, n = 3) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

/* ============================
   🥕 クイズ1：やさいのかたち
   ============================ */

// 問題表示（形クイズ）
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

  // シャッフル
  opts.sort(() => Math.random() - 0.5);

  // DOMに反映
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

  // クイズ1ではBGMは通常音量
  setBGMVolume(BGM_NORMAL);

  show("quiz-screen");
}

// 判定（クイズ1）
function handleAnswer(isCorrect, q) {
  // 効果音
  if (isCorrect) {
    playSECorrect();
  } else {
    playSEWrong();
  }

  const judgeText = document.getElementById("judge-text");
  judgeText.textContent = isCorrect ? "せいかい！" : "ざんねん！";
  if (isCorrect) score++;
  show("judge-screen");

  // 1秒後に答えあわせへ
  setTimeout(() => showAnswer(q), 1000);
}

// 答えあわせ（クイズ1）
// 👉 BGMは止めず、そのまま流しっぱなし
function showAnswer(q) {
  const video = document.getElementById("answer-video");

  video.pause();
  video.src = q.answer_video;
  video.style.display = "block"; // 映像を表示する
  video.muted = false;
  video.currentTime = 0;
  video.play().catch(e => console.warn("再生エラー:", e));

  const next = document.getElementById("next-btn");
  next.textContent = current >= quizData.length - 1
    ? "けっかをみる"
    : "つぎのもんだいへ";

  next.onclick = () => {
    video.pause(); // 答えあわせ動画を止めて次へ
    if (current >= quizData.length - 1) {
      renderResult();
    } else {
      current++;
      renderQuestion();
    }
  };

  show("answer-screen");
}

/* ============================
   🎉 結果表示
   ============================ */

function renderResult() {
  document.getElementById("score-text").textContent =
    `せいかい：${score} / ${quizData.length}`;
  // 結果画面ではBGMをふつうの音量に戻しておく
  setBGMVolume(BGM_NORMAL);
  show("end-screen");
}

/* ============================
   🎛 イベント登録（共通）
   ============================ */

// ✅ ブラウザ制限対応：最初の1回のクリックでBGMを許可
document.addEventListener(
  "click",
  () => {
    playBGM(BGM_NORMAL);
  },
  { once: true }
);

// スタート → ゲーム選択へ
document.getElementById("start-btn").onclick = () => {
  playBGM(BGM_NORMAL); // 念のためここでも
  show("select-screen");
};

// クイズ1ボタン
document.getElementById("quiz-shape-btn").onclick = async () => {
  try {
    const data = await loadCSV("./data.csv");
    quizData = pickRandom(data, 3);
    current = 0;
    score = 0;
    setBGMVolume(BGM_NORMAL); // クイズ1はいつも標準音量
    renderQuestion();
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
};

// リスタート
document.getElementById("restart-btn").onclick = () => location.reload();

/* ============================
   🎵 クイズ2：やさいをきったらどんなおと？
   ============================ */

// 問題表示（音クイズ：BGMは小さく流しっぱなし）
function renderQuestionSound() {
  const q = quizData[current];
  if (!q) return renderResult();

  // 問題文と画像
  document.getElementById("question-text").textContent = q.question;
  document.getElementById("question-image").src = q.image;

  const choices = document.getElementById("choices");
  choices.innerHTML = "";

  // BGMは止めず、音クイズ中は小さく
  setBGMVolume(BGM_LOW);

  // 出題時に「音声だけ」再生（映像非表示）
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.currentTime = 0;
  video.muted = false;
  video.style.display = "none"; // 出題時は音だけ
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
      video.pause();          // 出題音を止める
      handleAnswerSound(o.correct, q);
    };

    container.appendChild(div);
  });

  choices.appendChild(container);
  show("quiz-screen");
}

// 判定（音クイズ）
function handleAnswerSound(isCorrect, q) {
  // 効果音
  if (isCorrect) {
    playSECorrect();
  } else {
    playSEWrong();
  }

  const judgeText = document.getElementById("judge-text");
  judgeText.textContent = isCorrect ? "⭕ せいかい！" : "❌ ざんねん！";
  if (isCorrect) score++;
  show("judge-screen");

  // 1秒後に答えあわせへ
  setTimeout(() => showAnswerSound(q), 1000);
}

// 答えあわせ（音クイズ：動画＋BGM小さめ）
function showAnswerSound(q) {
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.currentTime = 0;
  video.muted = false;
  video.style.display = "block";

  // 答えあわせ中もBGMは小さめのまま
  setBGMVolume(BGM_LOW);
  video.play().catch(e => console.warn("動画再生エラー:", e));

  const next = document.getElementById("next-btn");
  next.textContent = current >= quizData.length - 1
    ? "けっかをみる ▶️"
    : "つぎのもんだいへ ▶️";

  next.onclick = () => {
    video.pause();

    if (current >= quizData.length - 1) {
      // 結果画面ではBGMをふつうの音量に戻す
      setBGMVolume(BGM_NORMAL);
      renderResult();
    } else {
      current++;
      // 次の問題も音クイズなので、また1/4音量で出す
      renderQuestionSound();
    }
  };

  show("answer-screen");
}

// 音クイズボタン登録
document.getElementById("quiz-sound-btn").disabled = false;
document.getElementById("quiz-sound-btn").onclick = async () => {
  try {
    const data = await loadCSV("./data_sound.csv");
    quizData = pickRandom(data, 3);
    current = 0;
    score = 0;
    // 音クイズモード：BGM小さめからスタート
    setBGMVolume(BGM_LOW);
    renderQuestionSound();
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
};
