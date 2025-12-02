// ==============================
// やさいクイズ script.js（BGM + 効果音つき）2.2.2
// ==============================

let quizData = [];
let current = 0;
let score = 0;
let lastScreenId = null;  
let lastQuizType = null; // "shape" か "sound" を入れる
let lastGameScreenId = null; // 「ゲームにもどる」用の戻り先
// 答えあわせ表示用：直前の回答を保存
let lastSelectedChoice = null;   // { img, text }
let lastCorrectChoice  = null;   // { img, text }
let lastIsCorrect      = null;   // true / false

let lastShapeChosen = null;   // { img, text }
let lastShapeCorrect = null;  // { img, text }
let lastShapeIsCorrect = null; // true / false




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
const seResult  = new Audio("music/Phrase02-1.mp3");

seCorrect.volume = 0.5;
seWrong.volume = 0.5;
seButton.volume = 0.5;
seResult.volume = 0.5;

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

document.addEventListener("click", (e) => {
  let el = e.target;

  // クリックされた要素から親方向へ探索
  while (el) {
    // onclick がある要素（＝クリックで何かが起こる要素）
    if (typeof el.onclick === "function" || el.hasAttribute("onclick")) {
      // 効果音を鳴らす
      seButton.currentTime = 0;
      seButton.play().catch(() => {});
      break;
    }
    el = el.parentElement;
  }
});





// ==============================
// 画面切り替え
// ==============================
function show(id) {
  // 画面切り替え
  document.querySelectorAll(".screen").forEach((s) =>
    s.classList.remove("active")
  );

  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("active");

  // 画面ごとのBGM
  if (id === "title-screen" || id === "select-screen") {
    // タイトル系画面
    setBGM("title", 0.7);

  } else if (id === "quiz-screen") {
    // クイズ画面
    if (currentMode === "sound") {
      setBGM("quiz", 0); // 音クイズは小さめ
    } else if (currentMode === "shape") {
      setBGM("quiz", 0.7); // 形クイズは普通の音量
    }
  }

  // 🔸 クイズ系の画面では、少し待ってからスクロール位置を強制リセット
  if (id === "quiz-screen" || id === "answer-screen" || id === "judge-screen") {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 80); // 50〜100ms くらいがちょうどよい
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
  setBGM("quiz", 1.0);

  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choices = document.getElementById("choices");

  questionText.textContent = q.question || "";
  questionImage.src = q.image || "";
  choices.innerHTML = "";

  // ★ 形クイズの選択肢（画像＋名前を入れたい場合は choice*_text を使う）
  const opts = [
    q.choice1_img || q.choice1
      ? {
          img: q.choice1_img || q.choice1,
          text: q.choice1_text || "", // ← CSVにあれば名前を表示できる
          correct: true,
        }
      : null,
    q.choice2_img || q.choice2
      ? {
          img: q.choice2_img || q.choice2,
          text: q.choice2_text || "",
          correct: false,
        }
      : null,
    q.choice3_img || q.choice3
      ? {
          img: q.choice3_img || q.choice3,
          text: q.choice3_text || "",
          correct: false,
        }
      : null,
  ].filter(Boolean);

  // 並びをシャッフル
  opts.sort(() => Math.random() - 0.5);

  opts.forEach((o) => {
    const div = document.createElement("div");
    div.className = "choice-item";

    const img = document.createElement("img");
    img.src = o.img;
    img.alt = "せんたくし";
    div.appendChild(img);

    // ★ ここで「あなたが選んだもの」と「正解」を記録する
    div.onclick = () => {
      // 選んだもの
      lastShapeChosen = {
        img: o.img,
        text: o.text || "",
      };

      // 正解（optsの中で correct:true のもの）
      const correctOpt = opts.find((opt) => opt.correct);
      lastShapeCorrect = correctOpt
        ? { img: correctOpt.img, text: correctOpt.text || "" }
        : null;

      lastShapeIsCorrect = o.correct;

      // 元の判定ロジックはそのまま
      handleAnswer(o.correct, q);
    };

    choices.appendChild(div);
  });

  // キャラ表示
  const shapeHelper = document.getElementById("shape-helper");
  const soundHelper = document.getElementById("sound-helper");
  if (shapeHelper) shapeHelper.style.display = "block";
  if (soundHelper) soundHelper.style.display = "none";

  show("quiz-screen");
}



// ---- ○×判定画面（1秒後に自動遷移）----
// ---- ○×判定画面（1秒後に自動遷移）----
function handleAnswer(isCorrect, q) {
  // ★ ここで必ず最新の結果をフラグに入れる！
  lastShapeIsCorrect = isCorrect;

  const judgeImg = document.getElementById("judge-image");
  judgeImg.src = isCorrect
    ? "./image/true_hourensou.png"
    : "./image/false_hourensou.png";

  // 効果音
  const se = isCorrect ? seCorrect : seWrong;
  se.currentTime = 0;
  se.play().catch(() => {});

  if (isCorrect) score++;
  show("judge-screen");

  // 1秒後に答えあわせへ
  setTimeout(() => showAnswer(q), 1500);
}



// ---- 答えあわせ画面（クイズ1）----
// 🔸 クイズ1は動画中もBGMを止めない
function showAnswer(q) {
  const video = document.getElementById("answer-video");

  // 📝 正解・不正解どちらでも使うメッセージ欄
  const commentEl = document.getElementById("answer-comment");
  if (commentEl) commentEl.innerHTML = ""; // いったんリセット

  // 🔽 ここから答えくらべエリアの処理
  const compare     = document.getElementById("answer-compare");
  const chosenImg   = document.getElementById("chosen-image");
  const chosenText  = document.getElementById("chosen-text");
  const correctImg  = document.getElementById("correct-image");
  const correctText = document.getElementById("correct-text");

  // ★ 間違えたときだけ「あなたがえらんだのは／せいかいはこれ！」を表示
  if (
    lastShapeIsCorrect === false &&
    lastShapeChosen &&
    lastShapeCorrect
  ) {
    if (compare) compare.style.display = "flex";

    if (chosenImg)  chosenImg.src          = lastShapeChosen.img  || "";
    if (chosenText) chosenText.textContent = lastShapeChosen.text || "";

    if (correctImg)  correctImg.src          = lastShapeCorrect.img  || "";
    if (correctText) correctText.textContent = lastShapeCorrect.text || "";

    // ❌ 不正解のときは、ここでは特別なメッセージは入れない（必要ならここで書ける）
    if (commentEl) commentEl.innerHTML = "";
  } else {
    // ✅ 正解のときは比べるボックスは消して、
    //    コメントだけ表示する
    if (compare) compare.style.display = "none";

    if (commentEl && lastShapeCorrect) {
      const name = lastShapeCorrect.text || "この<ruby><rb>やさい</rb><rt>やさい</rt></ruby>";
      commentEl.innerHTML =
        `${name}を<ruby><rb>切</rb><rt>き</rt></ruby>ると、` +
        `　こんな<ruby><rb>形</rb><rt>かたち</rt></ruby>をしてるね！`;
    }
  }

  // 🔼 ここまでが答えくらべ & メッセージ
  // 🔽 ここからは元々の showAnswer の処理（動画とボタン）

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

  // ★ 形クイズと同じ 3マスぶんを使う
  // 上2マス → 実際の選択肢 / 下1マス → ダミー（見えない）
  const slots = [...opts, { dummy: true }];

  slots.forEach((o) => {
    const div = document.createElement("div");
    div.className = "choice-item";

    if (o.dummy) {
      // 下のダミー：場所だけ取って見えなくする
      div.style.visibility = "hidden";
      div.style.pointerEvents = "none";
    } else {
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
  handleAnswerSound(o, q);
};

    }

    choices.appendChild(div);
  });

  // ★ 音クイズ用キャラを表示、形クイズ用は消す
  const shapeHelper = document.getElementById("shape-helper");
  const soundHelper = document.getElementById("sound-helper");
  if (shapeHelper) shapeHelper.style.display = "none";
  if (soundHelper) soundHelper.style.display = "block";

  show("quiz-screen");
}



// ---- 音クイズ用：判定＆答えあわせ遷移 ----
function handleAnswerSound(choice, q) {
  const isCorrect = choice.correct;

  // 🌟 直前の回答を保存（音クイズは画像＋テキスト）
  lastSelectedChoice = {
    img: choice.img,
    text: choice.text
  };
  lastCorrectChoice = {
    img: q.choice1_img,
    text: q.choice1_text
  };
  lastIsCorrect = isCorrect;

  const judgeImg = document.getElementById("judge-image");
  judgeImg.src = isCorrect
    ? "./image/true_hourensou.png"
    : "./image/false_hourensou.png";

  const se = isCorrect ? seCorrect : seWrong;
  se.currentTime = 0;
  se.play().catch(() => {});

  if (isCorrect) score++;
  show("judge-screen");

  // 1秒後に答えあわせへ
  setTimeout(() => showAnswerSound(q), 1500);
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

  // 📝 正解・不正解どちらでも使うメッセージ欄
  const commentEl = document.getElementById("answer-comment");
  if (commentEl) commentEl.innerHTML = ""; // いったんリセット

  // 🔍 間違えたときだけ「あなたのこたえ」と「せいかい」を表示
  const compareBox  = document.getElementById("answer-compare");
  const chosenImg   = document.getElementById("chosen-image");
  const chosenText  = document.getElementById("chosen-text");
  const correctImg  = document.getElementById("correct-image");
  const correctText = document.getElementById("correct-text");

  if (
    compareBox && chosenImg && correctImg &&
    lastIsCorrect === false && lastSelectedChoice && lastCorrectChoice
  ) {
    compareBox.style.display = "flex";

    chosenImg.src  = lastSelectedChoice.img || "";
    correctImg.src = lastCorrectChoice.img || "";

    if (chosenText)  chosenText.textContent  = lastSelectedChoice.text || "";
    if (correctText) correctText.textContent = lastCorrectChoice.text || "";

    // ❌ 間違えたときはコメントは空のまま
    if (commentEl) commentEl.innerHTML = "";
  } else if (compareBox) {
    compareBox.style.display = "none";
  }

  // ✅ 正解のときだけ「これは〇〇の音だね！」を表示
  if (commentEl && lastIsCorrect === true && lastCorrectChoice) {
    const name = lastCorrectChoice.text || "この<ruby><rb>やさい</rb><rt>やさい</rt></ruby>";
    commentEl.innerHTML =
      `これは ${name}の <ruby><rb>音</rb><rt>おと</rt></ruby>だね！`;
  }

  const next = document.getElementById("next-btn");
  next.textContent =
    current >= quizData.length - 1 ? "けっかをみる" : "つぎのもんだいへ";

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
  // 元のscore-text（非表示用）
  document.getElementById("score-text").textContent =
    `せいかい：${score} / ${quizData.length}`;

  // 新しいスコアUI書き込み
  document.getElementById("score-total").textContent =
    `${quizData.length}<ruby><rt>門</rt><rt>もん</rt></ruby><ruby><rt>中</rt><rt>ちゅう</rt></ruby>…`;

  document.getElementById("score-number").textContent = score;

  document.getElementById("score-message").textContent =
    score === quizData.length ? "せいかい！パーフェクト！！" :
    score >= 1 ? "せいかい！！" :
    "せいかい！またチャレンジしよう！";

  // SE
  seResult.currentTime = 0;
  seResult.play().catch(() => {});

  // BGM
  currentMode = null;
  setBGM("title", 0.7);

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
    titleEl.textContent = "〜あそびかた〜";
    bodyEl.innerHTML = `
      <p>1. <ruby><rb>問題</rb><rt>もんだい</rt></ruby>がはじまったら、<ruby><rb>音</rb><rt>おと</rt></ruby>をよく きいてね。</p>
      <p>2. ２つのうち、「このたべものの<ruby><rb>音</rb><rt>おと</rt></ruby>だ！」と <ruby><rb>思</rb><rt>おも</rt></ruby>うものをタップしよう。</p>
      <p>3. <ruby><rb>全部</rb><rt>ぜんぶ</rt></ruby>で　3<ruby><rb>問</rb><rt>もん</rt></ruby>といたら、ゲームクリア！</p>
      <p> むずかしさ：★★★</p>
    `;
  } else {
    // 🥦 形クイズの説明（デフォルト）
    titleEl.textContent = "〜あそびかた〜";
    bodyEl.innerHTML = `
      <p>1. <ruby><rb>上</rb><rt>うえ</rt></ruby>の <ruby><rb>写真</rb><rt>しゃしん</rt></ruby>を <ruby><rb>見</rb><rt>み</rt></ruby>て、<ruby><rb>野菜</rb><rt>やさい</rt></ruby>を <ruby><rb>切</rb><rt>き</rt></ruby>ったときの<ruby><rb>形</rb><rt>かたち</rt></ruby>を　かんがえてみよう。</p>
      <p>2. 3つのうち、「これだ！」と <ruby><rb>思</rb><rt>おも</rt></ruby>う <ruby><rb>形</rb><rt>かたち</rt></ruby>を タップしよう。</p>
      <p>3. <ruby><rb>全部</rb><rt>ぜんぶ</rt></ruby>で　3<ruby><rb>問</rb><rt>もん</rt></ruby>といたら、ゲームクリア！</p>
      <p> むずかしさ：★☆☆</p>
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

// クイズ1スタート（形クイズ）
document.getElementById("quiz-shape-btn").onclick = async () => {
  try {
    const data = await loadCSV("./data.csv");
    quizData = pickRandom(data, 3);
    current = 0;
    score = 0;
    currentMode = "shape";
    lastQuizType = "shape";

    // ⭐ ここでカウントダウン → 終わったら renderQuestion()
    startCountdown(renderQuestion);
  } catch (e) {
    alert("CSVを読み込めませんでした。");
    console.error(e);
  }
};

// クイズ2スタート（音クイズ）
document.getElementById("quiz-sound-btn").disabled = false;
document.getElementById("quiz-sound-btn").onclick = async () => {
  try {
    const data = await loadCSV("./data_sound.csv");
    quizData = pickRandom(data, 3);
    current = 0;
    score = 0;
    currentMode = "sound";
    lastQuizType = "sound";

    // ⭐ こっちはカウントダウン → 終わったら renderQuestionSound()
    startCountdown(renderQuestionSound);
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
// 🎬 カウントダウン機能（BGM一時停止つき）
// ==============================
function startCountdown(nextAction) {
  const cdEl = document.getElementById("countdown-number");

  // 🔇 BGM を一時停止（フェードアウトしたければ後で追加可能）
  if (bgm) bgm.pause();

  // カウントダウン開始と同時に mp3 を再生
  const seCountdown = new Audio("music/Countdown03-2.mp3");
  seCountdown.currentTime = 0;
  seCountdown.play().catch(()=>{});

  // 見た目上のカウント表示
  let count = 3;
  show("countdown-screen");
  cdEl.textContent = "3";

  const timer = setInterval(() => {
    count--;

    if (count === 2) {
      cdEl.textContent = "2";
    } else if (count === 1) {
      cdEl.textContent = "1";
    } else if (count === 0) {
      cdEl.textContent = "スタート！";
    } else {
      clearInterval(timer);

      // 🟢 カウントダウン終了 → クイズ開始
      nextAction();

      // 🔊 BGM を現在のモードの設定音量で再開
      if (currentMode === "sound") {
        setBGM("quiz", 0.1);   // 音クイズなら小さめ
      } else if (currentMode === "shape") {
        setBGM("quiz", 1.0);   // 形なら普通
      }
    }
  }, 1000);
}

// ==============================
// 📕 絵本紹介画面（タイトルのボタン）
// ==============================

// タイトル画面の「絵本もあるよ！🥦」ボタン
const bookInfoBtn = document.getElementById("book-info-btn");
if (bookInfoBtn) {
  bookInfoBtn.onclick = () => {
    show("book-screen");
  };
}

// 絵本紹介からタイトルに戻るボタン
const bookBackBtn = document.getElementById("book-back-btn");
if (bookBackBtn) {
  bookBackBtn.onclick = () => {
    show("title-screen");
  };
}


// ==============================
// 📱 端末が横向きのときの警告表示
// ==============================
window.addEventListener("DOMContentLoaded", () => {
  const rotateWarning = document.getElementById("rotate-warning");
  if (!rotateWarning) return; // 念のため保険

  function handleOrientation() {
    const isMobileWidth = window.innerWidth <= 900;
    const isLandscape   = window.innerWidth > window.innerHeight;

    // スマホサイズ ＋ 横向き のときだけ表示
    if (isMobileWidth && isLandscape) {
      rotateWarning.style.display = "flex";
    } else {
      rotateWarning.style.display = "none";
    }
  }

  // 初回＆画面サイズ変更・回転のたびにチェック
  handleOrientation();
  window.addEventListener("resize", handleOrientation);
  window.addEventListener("orientationchange", handleOrientation);
});
