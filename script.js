// ==============================
// やさいクイズ script.js（BGM + 効果音つき完全版）
// ==============================

let quizData = [];
let current = 0;
let score = 0;
let currentMode = null; // "shape" or "sound"

// ==============================
// 🎵 BGM & 効果音
// ==============================

// 単一の BGM プレイヤー（曲だけ切り替える）
const bgm = new Audio();
bgm.loop = true;

let bgmStarted = false;
let currentBgmType = null;   // "title" or "quiz"
let currentBgmVolume = 1.0;

// 効果音（必要に応じて currentTime = 0 してから再生）
const seCorrect = new Audio("music/Quiz-Ding_Dong05-4(Slow-Short).mp3");
const seWrong   = new Audio("music/Short_Accent10-1(Low).mp3");
const seButton  = new Audio("music/Inspiration03-1(High).mp3");
const seResult  = new Audio("music/Quiz-Results01-1.mp3");

// BGM 種類ごとのファイル
const BGM_FILES = {
  title: "music/Tekuteku_Aruko-1(Marimba).mp3",      // タイトル・クイズ選択
  quiz:  "music/Dotabata_Panic-1(Fast).mp3",         // クイズ中
};

// BGM をセット（タイプ: "title" / "quiz", volume: 0〜1）
function setBGM(type, volume) {
  // まだブラウザから再生許可が出ていない場合は、設定だけ覚えておく
  if (!bgmStarted) {
    currentBgmType = type;
    currentBgmVolume = volume;
    return;
  }

  if (!type) {
    bgm.pause();
    currentBgmType = null;
    return;
  }

  const src = BGM_FILES[type];
  if (!src) return;

  // 曲が変わる場合のみ src を入れ替え
  if (currentBgmType !== type) {
    bgm.pause();
    bgm.src = src;
    currentBgmType = type;
  }

  // 音量変更
  if (currentBgmVolume !== volume) {
    bgm.volume = volume;
    currentBgmVolume = volume;
  }

  if (bgm.paused) {
    bgm.play().catch(() => {
      // iOS 等で失敗しても、次のユーザー操作で再トライされるので無視
    });
  }
}

// 最初のユーザー操作で BGM 再生を解禁 & タイトルBGM を鳴らす
document.addEventListener(
  "click",
  () => {
    if (!bgmStarted) {
      bgmStarted = true;
      // その時点の画面に合わせて BGM をスタート
      const active = document.querySelector(".screen.active");
      if (active && active.id === "quiz-screen") {
        // すでにクイズ画面にいたらクイズBGM
        if (currentMode === "sound") {
          setBGM("quiz", 0.25);
        } else {
          setBGM("quiz", 1.0);
        }
      } else {
        // それ以外（タイトルや選択画面）はタイトルBGM
        setBGM("title", 1.0);
      }
    }
  },
  { once: true }
);

// すべてのボタンに「ポチッ」の効果音
document.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    seButton.currentTime = 0;
    seButton.play().catch(() => {});
  }
});

// ==============================
// 画面切り替え
// ==============================
function show(id) {
  document.querySelectorAll(".screen").forEach((s) =>
    s.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");
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

// ランダム抽出
const pickRandom = (arr, n = 3) =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);

// ==============================
// 🥕 クイズ1：やさいをきったらどんなかたち？
// ==============================

// 問題表示
function renderQuestion() {
  const q = quizData[current];
  if (!q) return renderResult();

  currentMode = "shape";
  // クイズ1はクイズBGMを普通の音量で
  setBGM("quiz", 1.0);

  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choices = document.getElementById("choices");

  questionText.textContent = q.question || "";
  questionImage.src = q.image || "";
  choices.innerHTML = "";

  const opts = [
    q.choice1_img || q.choice1
      ? { img: q.choice1_img || q.choice1, correct: true }
      : null,
    q.choice2_img || q.choice2
      ? { img: q.choice2_img || q.choice2, correct: false }
      : null,
    q.choice3_img || q.choice3
      ? { img: q.choice3_img || q.choice3, correct: false }
      : null,
  ].filter(Boolean);

  opts.sort(() => Math.random() - 0.5);

  opts.forEach((o) => {
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

// 判定（クイズ1）
function handleAnswer(isCorrect, q) {
  const judgeText = document.getElementById("judge-text");
  judgeText.textContent = isCorrect ? "せいかい！" : "ざんねん！";

  // 効果音
  const se = isCorrect ? seCorrect : seWrong;
  se.currentTime = 0;
  se.play().catch(() => {});

  if (isCorrect) score++;
  show("judge-screen");

  setTimeout(() => showAnswer(q), 1000);
}

// 答えあわせ（クイズ1）
// 👉 BGM は止めない・音量もそのまま
function showAnswer(q) {
  const video = document.getElementById("answer-video");

  video.pause();
  video.src = q.answer_video;
  video.style.display = "block";
  video.muted = false;
  video.currentTime = 0;
  video.play().catch((e) => console.warn("再生エラー:", e));

  const next = document.getElementById("next-btn");
  next.textContent =
    current >= quizData.length - 1 ? "けっかをみる" : "つぎのもんだいへ";

  next.onclick = () => {
    video.pause();
    if (current >= quizData.length - 1) {
      renderResult();
    } else {
      current++;
      renderQuestion();
    }
  };

  show("answer-screen");
}

// ==============================
// 🎵 クイズ2：やさいをきったらどんなおと？
// ==============================

// 問題表示（音だけ＋2択＋文字つき）
function renderQuestionSound() {
  const q = quizData[current];
  if (!q) return renderResult();

  currentMode = "sound";
  // 音クイズ中はクイズBGMを小さく
  setBGM("quiz", 0.05);

  // 問題文と画像
  document.getElementById("question-text").textContent = q.question;
  document.getElementById("question-image").src = q.image;

  const choices = document.getElementById("choices");
  choices.innerHTML = "";

  // 出題時に「音声だけ」再生（映像非表示）
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.currentTime = 0;
  video.muted = false;
  video.style.display = "none"; // 出題時は音だけ
  video.play().catch((e) => console.warn("音声再生エラー:", e));

  // 2択（画像＋文字、左右ランダム）
  const opts = [
    { img: q.choice1_img, text: q.choice1_text, correct: true },
    { img: q.choice2_img, text: q.choice2_text, correct: false },
  ].sort(() => Math.random() - 0.5);

  const container = document.createElement("div");
  container.className = "choice-container";
  container.style.display = "flex";
  container.style.justifyContent = "center";
  container.style.gap = "20px";

  opts.forEach((o) => {
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
      handleAnswerSound(o.correct, q);
    };

    container.appendChild(div);
  });

  choices.appendChild(container);
  show("quiz-screen");
}

// 判定（音クイズ）
function handleAnswerSound(isCorrect, q) {
  const judgeText = document.getElementById("judge-text");
  judgeText.textContent = isCorrect ? "せいかい！" : "ざんねん！";

  const se = isCorrect ? seCorrect : seWrong;
  se.currentTime = 0;
  se.play().catch(() => {});

  if (isCorrect) score++;
  show("judge-screen");

  setTimeout(() => showAnswerSound(q), 1000);
}

// 答えあわせ（音クイズ：動画＋BGM小さめのまま）
function showAnswerSound(q) {
  const video = document.getElementById("answer-video");
  video.pause();
  video.src = q.answer_video;
  video.currentTime = 0;
  video.muted = false;
  video.style.display = "block";

  // 音クイズ中なので、ここでも小さめのまま
  setBGM("quiz", 0.05);

  video.play().catch((e) => console.warn("動画再生エラー:", e));

  const next = document.getElementById("next-btn");
  next.textContent =
    current >= quizData.length - 1 ? "けっかをみる ▶️" : "つぎのもんだいへ ▶️";

  next.onclick = () => {
    video.pause();
    if (current >= quizData.length - 1) {
      renderResult();
    } else {
      current++;
      renderQuestionSound();
    }
  };

  show("answer-screen");
}

// ==============================
// 🎉 結果（クイズ1・2共通）
// ==============================
function renderResult() {
  document.getElementById("score-text").textContent =
    `せいかい：${score} / ${quizData.length}`;

  // リザルト用SE
  seResult.currentTime = 0;
  seResult.play().catch(() => {});

  // BGMはタイトル用に戻す（1本だけなので重ならない）
  setBGM("title", 1.0);

  show("end-screen");
}

// ==============================
// 🎮 イベント登録
// ==============================

document.getElementById("start-btn").onclick = () => {
  // スタートを押した時点でタイトルBGMを鳴らしておく
  setBGM("title", 1.0);
  show("select-screen");
};

document.getElementById("quiz-shape-btn").onclick = async () => {
  try {
    const data = await loadCSV("./data.csv");
    quizData = pickRandom(data, 3);
    current = 0;
    score = 0;
    currentMode = "shape";
    renderQuestion();
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
};

// 音クイズボタン
document.getElementById("quiz-sound-btn").disabled = false;
document.getElementById("quiz-sound-btn").onclick = async () => {
  try {
    const data = await loadCSV("./data_sound.csv");
    quizData = pickRandom(data, 3);
    current = 0;
    score = 0;
    currentMode = "sound";
    renderQuestionSound();
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
};

// 既存：スタートボタン
document.getElementById("start-btn").onclick = () => {
  // スタートを押した時点でタイトルBGMを鳴らしておく
  setBGM("title", 1.0);
  show("select-screen");
};

// ……クイズ1ボタン、クイズ2ボタン、restart-btn などのあとに、これを追加👇

// 🔰 注意画面 → タイトル画面へ
document.getElementById("notice-ok-btn").onclick = () => {
  // 画面をタイトルに切り替え
  show("title-screen");
  // タイトル用BGMをセット（最初のタップなのでここから流れ始める想定）
  setBGM("title", 1.0);
};


// リスタート
document.getElementById("restart-btn").onclick = () => {
  // スコアなどはリセットしておく
  current = 0;
  score = 0;
  quizData = [];
  currentMode = null;

  // タイトル画面に戻す
  show("title-screen");

  // タイトル用BGMをしっかり鳴らす
  setBGM("title", 1.0);
};

