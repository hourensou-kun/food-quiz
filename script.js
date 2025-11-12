// ==============================
// やさいクイズ script.js（完全分離画面タイプ）
// ==============================

let quizData = [];
let current = 0;
let score = 0;

// ---- 画面切り替え ----
function show(id) {
  // まず全画面を完全に隠す（保険で style.display も使う）
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.remove("active");
    s.setAttribute("aria-hidden", "true");
    s.style.display = "none";
  });

  // すべての video は一旦停止（画面またぎの音漏れ防止）
  document.querySelectorAll("video").forEach(v => {
    try { v.pause(); v.currentTime = 0; } catch (_) {}
  });

  // 対象だけ表示
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("active");
    el.setAttribute("aria-hidden", "false");
    el.style.display = ""; // CSSの .screen.active に任せる
    // 画面を確実にトップへ
    window.scrollTo({ top: 0, behavior: "instant" });
  }
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
// 答えクリック時
function handleAnswer(isCorrect, q) {
  const video = document.getElementById("answer-video");
  const nextBtn = document.getElementById("next-btn");
  const feedbackArea = document.getElementById("feedback-area");

  // ○×メッセージ
  feedbackArea.textContent = isCorrect ? "せいかい！🎉" : "ざんねん！💦";

  // スコア加算
  if (isCorrect) score++;

  // 動画を設定して音付きで再生
  video.src = q.answer_video;
  video.muted = false;          // 🔈 音を出す
  video.volume = 1.0;           // 🔊 最大音量
  video.currentTime = 0;
  video.play().catch(err => {
    console.warn("自動再生できませんでした:", err);
    feedbackArea.textContent += "（再生ボタンを押してね）";
  });

  showScreen("answer-screen");

  // 最後の問題なら「けっかをみる」
  nextBtn.textContent = currentQuestion >= quizData.length - 1
    ? "けっかをみる "
    : "つぎのもんだいへ ";

  nextBtn.onclick = () => {
    if (currentQuestion >= quizData.length - 1) {
      showResult();
    } else {
      currentQuestion++;
      showQuestion();
    }
  };
}


// ---- 答えあわせ画面 ----
function showAnswer(q) {
  const video = document.getElementById("answer-video");
  video.src = q.answer_video;
  video.currentTime = 0;
  video.play().catch(e => console.warn("再生エラー:", e));

  const next = document.getElementById("next-btn");
  next.textContent = current >= quizData.length - 1 ? "けっかをみる ▶️" : "つぎのもんだいへ ▶️";

  next.onclick = () => {
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
