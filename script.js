// ==============================
// やさいクイズ script.js（BGM + 効果音つき）1.2
// ==============================

let quizData = [];
let current = 0;
let score = 0;
let lastScreenId = null;  
let lastQuizType = null; // "shape" か "sound" を入れる
let lastGameScreenId = null; // 「ゲームにもどる」用の戻り先



// 「形」クイズか「音」クイズか（BGM音量調整用）
let currentMode = null; // "shape" or "sound"

// ==============================
// 🎵 BGM & 効果音
// ==============================

// BGMは1本だけ使う
const bgm = new Audio();
bgm.loop = true;

// どのBGMを鳴らしているか
const BGM_FILES = {
  title: "music/Tekuteku_Aruko-1(Marimba).mp3",   // タイトル・セレクト用
  quiz:  "music/Dotabata_Panic-1(Fast).mp3",      // クイズ中用
};
let currentBgmType = null;

// 効果音
const seCorrect = new Audio("music/Quiz-Ding_Dong05-4(Slow-Short).mp3");
const seWrong   = new Audio("music/Short_Accent10-1(Low).mp3");
const seButton  = new Audio("music/Inspiration03-1(High).mp3");
const seResult  = new Audio("music/Quiz-Results01-1.mp3");

/**
 * BGMを切り替えて再生する
 * @param {"title"|"quiz"|null} type
 * @param {number} volume 0〜1
 */
function setBGM(type, volume = 0.5) {
  if (!type) {
    bgm.pause();
    currentBgmType = null;
    return;
  }

  const src = BGM_FILES[type];
  if (!src) return;

  // 曲が違うときだけsrc入れ替え
  if (!bgm.src.includes(src)) {
    bgm.src = src;
    currentBgmType = type;
  }

  bgm.volume = volume;

  bgm
    .play()
    .catch((e) => {
      console.warn("BGM再生エラー:", e);
    });
}

// すべてのボタンに「ポチッ」SEをつける
document.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    seButton.currentTime = 0;
    seButton.play().catch(() => {});
  }
});

// 形クイズ
document.getElementById("quiz-shape-btn").onclick = async () => {
  lastQuizType = "shape";
  // ここから先は今までの処理のまま
  const data = await loadCSV("./data.csv");
  quizData = pickRandom(data, 3);
  current = 0;
  score = 0;
 startCountdown(renderQuestion);

};

// 音クイズ
document.getElementById("quiz-sound-btn").onclick = async () => {
  lastQuizType = "sound";
  const data = await loadCSV("./data_sound.csv");
  quizData = pickRandom(data, 3);
  current = 0;
  score = 0;
startCountdown(renderQuestionSound);

};


// ==============================
// 画面切り替え
// ==============================
function show(id) {
  document.querySelectorAll(".screen").forEach((s) =>
    s.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");

  // 画面ごとのBGM（保険でここでも制御しておく）
  if (id === "title-screen" || id === "select-screen") {
    // タイトル系画面
    setBGM("title", 1.0);
  } else if (id === "quiz-screen") {
    // クイズ画面
    if (currentMode === "sound") {
      setBGM("quiz", 0.1); // 音クイズは小さめ
    } else if (currentMode === "shape") {
      setBGM("quiz", 1.0); // 形クイズは普通の音量
    }
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
// 🥕 クイズ1：やさいをきったらどんなかたち？
// ==============================

// ---- 問題表示 ----
function renderQuestion() {
  const q = quizData[current];
  if (!q) return renderResult();

  currentMode = "shape";
  // クイズ用BGM（普通の音量）
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

// ---- ○×判定画面（1秒後に自動遷移）----
function handleAnswer(isCorrect, q) {
  const judgeText = document.getElementById("judge-text");
  judgeText.textContent = isCorrect ? "せいかい！" : "ざんねん！";

  // 効果音
  const se = isCorrect ? seCorrect : seWrong;
  se.currentTime = 0;
  se.play().catch(() => {});

  if (isCorrect) score++;
  show("judge-screen");

  // 1秒後に答えあわせへ
  setTimeout(() => showAnswer(q), 1000);
}

// ---- 答えあわせ画面（クイズ1）----
// 🔸 クイズ1は動画中もBGMを止めない
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

// ---- 音クイズ用：問題表示（音だけ再生＋2択＋文字つき）----
function renderQuestionSound() {
  const q = quizData[current];
  if (!q) return renderResult();

  currentMode = "sound";
  // クイズ用BGM（小さめ）
  setBGM("quiz", 0.1);

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
  video.play().catch((e) => console.warn("音声再生エラー:", e));

  // 2択（画像＋文字、左右ランダム）
  const opts = [
    { img: q.choice1_img, text: q.choice1_text, correct: true },
    { img: q.choice2_img, text: q.choice2_text, correct: false },
  ].sort(() => Math.random() - 0.5);

  // コンテナ生成
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

  const se = isCorrect ? seCorrect : seWrong;
  se.currentTime = 0;
  se.play().catch(() => {});

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
  video.play().catch((e) => console.warn("動画再生エラー:", e));

  // 音クイズ中はこの画面でも小さいBGMのまま
  setBGM("quiz", 0.1);

  const next = document.getElementById("next-btn");
  next.textContent =
    current >= quizData.length - 1 ? "けっかをみる ▶️" : "つぎのもんだいへ ▶️";

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

// ==============================
// 🎉 結果表示（クイズ1・2共通）
// ==============================
function renderResult() {
  document.getElementById(
    "score-text"
  ).textContent = `せいかい：${score} / ${quizData.length}`;

  // リザルトSE
  seResult.currentTime = 0;
  seResult.play().catch(() => {});

  // BGMはタイトル用に戻す
  currentMode = null;
  setBGM("title", 1.0);

  show("end-screen");
}

// ==============================
// 📘 チュートリアルを開く
// ==============================
function openTutorial(forcedType) {
  // 直前の画面を記録（戻るときに使う）
  const active = document.querySelector(".screen.active");
  if (active) {
    lastScreenId = active.id;
  }

  // どのクイズの説明を出すか決める
  const type = forcedType || currentMode || lastQuizType || "shape";

  const titleEl = document.getElementById("tutorial-title");
  const bodyEl  = document.getElementById("tutorial-body");

  if (!titleEl || !bodyEl) {
    console.warn("tutorial-title / tutorial-body が見つかりません");
    show("tutorial-screen");
    return;
  }

  if (type === "sound") {
    // 🎵 音クイズの説明
    titleEl.textContent = "やさいをきったらどんなおと？ のあそびかた";
    bodyEl.innerHTML = `
      <p>1. おとが なったら、どちらの たべものを きっている おとか よく きいてね。</p>
      <p>2. ２つのうち、「これだ！」と おもった ほうを タップしよう。</p>
      <p>3. ぜんぶで　3もんといたら、ゲームクリア！</p>
    `;
  } else {
    // 🥦 形クイズの説明（デフォルト）
    titleEl.textContent = "やさいをきったらどんなかたち？ のあそびかた";
    bodyEl.innerHTML = `
      <p>1. うえの しゃしんを みて、やさいを きったときのかたちを　かんがえてみよう。</p>
      <p>3. 3つのうち、「これだ！」と おもった かたちを タップして こたえよう。</p>
      <p>3. ぜんぶで　3もんといたら、ゲームクリア！</p>
    `;
  }

  show("tutorial-screen");
}



// ==============================
// 🎮 イベント登録
// ==============================

// 🔰 注意画面 → タイトル画面へ
// （ここで必ずタイトルBGMを鳴らす）
document.getElementById("notice-ok-btn").onclick = () => {
  show("title-screen");
  currentMode = null;
  setBGM("title", 1.0);
};

// タイトル → クイズ選択
document.getElementById("start-btn").onclick = () => {
  show("select-screen");
  currentMode = null;
  setBGM("title", 1.0);
};

// クイズ1スタート
document.getElementById("quiz-shape-btn").onclick = async () => {
  try {
    const data = await loadCSV("./data.csv");
    quizData = pickRandom(data, 3);
    current = 0;
    score = 0;
    currentMode = "shape";
    lastQuizType = "shape";   // ★これを追加
    renderQuestion();
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
};


// クイズ2スタート
document.getElementById("quiz-sound-btn").disabled = false;
document.getElementById("quiz-sound-btn").onclick = async () => {
  try {
    const data = await loadCSV("./data_sound.csv");
    quizData = pickRandom(data, 3);
    current = 0;
    score = 0;
    currentMode = "sound";
    lastQuizType = "sound";   // ★これを追加
    renderQuestionSound();
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
};


// はじめにもどる → タイトル画面 & タイトルBGM
document.getElementById("restart-btn").onclick = () => {
  current = 0;
  score = 0;
  quizData = [];
  currentMode = null;

  show("title-screen");
  setBGM("title", 1.0);
};

// ==============================
// 🎫 クレジット画面
// ==============================

document.getElementById("credit-btn").onclick = () => {
  show("credit-screen");
  // タイトル画面と同じBGMを維持
  setBGM("title", 1.0);
};

document.getElementById("credit-back-btn").onclick = () => {
  show("title-screen");
  setBGM("title", 1.0);
};

// ==============================
// 🔙 クイズ選択画面 → タイトルへ戻る
// ==============================
document.getElementById("back-btn").onclick = () => {
  show("title-screen");
  // タイトルのBGMを再生（強制ON）
  setBGM("title", 1.0);
};
// ==============================
// 📂 メニュー関連
// ==============================

const menuBtn = document.getElementById("menu-btn");
const menuBackGameBtn = document.getElementById("menu-back-game-btn");
const menuToTitleBtn = document.getElementById("menu-to-title-btn");
const menuToTutorialBtn = document.getElementById("menu-to-tutorial-btn");
const tutorialBackMenuBtn = document.getElementById("tutorial-back-menu-btn");

// 今表示している画面を調べるヘルパー
function getActiveScreenId() {
  const active = document.querySelector(".screen.active");
  return active ? active.id : null;
}

// メニューをひらく
if (menuBtn) {
  menuBtn.onclick = () => {
    // ひらく前の「ゲーム画面」を覚えておく
    lastGameScreenId = getActiveScreenId() || "quiz-screen";
    show("menu-screen");
  };
}


// 「ゲームにもどる」
if (menuBackGameBtn) {
  menuBackGameBtn.onclick = () => {
    if (lastGameScreenId) {
      show(lastGameScreenId);      // メニューを開く前のゲーム画面へ
    } else {
      show("quiz-screen");         // 念のための保険
    }
  };
}


// 「タイトルへ」 → 注意画面を飛ばしてタイトルへ
if (menuToTitleBtn) {
  menuToTitleBtn.onclick = () => {

    // 🔸 BGMを最初に戻す
    if (bgm) {
      bgm.pause();
      bgm.currentTime = 0;
      bgm.volume = 0.5; // 標準音量に戻す
      bgm.play().catch(()=>{});
    }

    // 🔸 クイズ状態をリセット
    quizData = [];
    current = 0;
    score = 0;

    // 🔸 タイトル画面へ（注意画面には戻らない）
    show("title-screen");
  };
}


// 「あそびかた」 → チュートリアル画面へ
if (menuToTutorialBtn) {
  menuToTutorialBtn.onclick = () => {
    // ひらく前の画面を記録（ふつうは menu-screen）
    const active = document.querySelector(".screen.active");
    if (active) {
      lastScreenId = active.id;
    } else {
      lastScreenId = "menu-screen";
    }

    // 今プレイ中のクイズ（currentMode）に合わせてチュートリアル表示
    openTutorial();
  };
}


// チュートリアルの「メニューにもどる」
if (tutorialBackMenuBtn) {
  tutorialBackMenuBtn.onclick = () => {
    // さっき覚えた画面に戻る
    if (lastScreenId) {
      show(lastScreenId);
    } else {
      show("menu-screen"); // 保険
    }
  };
}


// 問題選択画面からのチュートリアル
document.getElementById("tutorial-shape-btn").onclick = () => {
  openTutorial("shape");
};

document.getElementById("tutorial-sound-btn").onclick = () => {
  openTutorial("sound");
};

// ==============================
// 🎬 カウントダウン機能
// ==============================

function startCountdown(nextAction) {
  let count = 3;
  const cdEl = document.getElementById("countdown-number");

  show("countdown-screen");
  cdEl.textContent = count;

  const timer = setInterval(() => {
    count--;
    if (count >= 1) {
      cdEl.textContent = count;
    } else if (count === 0) {
      cdEl.textContent = "スタート！";
    } else {
      clearInterval(timer);
      nextAction();  // ← クイズ開始
    }
  }, 900);
}

