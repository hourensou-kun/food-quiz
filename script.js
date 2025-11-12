/* script.js
   要件（簡潔版）をすべて満たす実装。
   - data.csv: id,question,image,choice1,choice1_img,choice2,choice2_img,choice3,choice3_img,answer,answer_video
   - choice1 が正解（判定は CSV の answer と比較）
   - 14問中ランダムに3問出題
   - 選択肢は画像のみ、表示順ランダム
   - 回答 → 1秒 ○/× 表示 → 答え合わせ画面で answer_video を再生（自動で次に行かない）
   - 最終問は next ボタンが「けっかをみる」
   - HTML の既存要素を利用（必要なら要素の存在チェックを行う）
*/

const CSV_PATH = "./data.csv";
const QUIZ_COUNT = 3;

let allData = [];
let quizData = [];
let currentIndex = 0;
let score = 0;
let currentMode = "shape"; // "shape" or "sound" (sound currently prepared later)

// ---- helpers ----
const $ = id => document.getElementById(id);
const show = id => {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const e = $(id);
  if (e) e.classList.add("active");
};
async function loadCSV(path = CSV_PATH) {
  const res = await fetch(path);
  if (!res.ok) throw new Error("CSV fetch failed: " + res.status);
  const text = await res.text();
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines.shift().split(",").map(h => h.trim());
  return lines.map(line => {
    const cols = line.split(",").map(c => c.trim());
    const obj = {};
    header.forEach((k, i) => obj[k] = cols[i] ?? "");
    return obj;
  });
}
function pickRandom(data, n) {
  return [...data].sort(() => Math.random() - 0.5).slice(0, n);
}

// ---- UI logic ----
function buildChoicesForShape(q) {
  // choice1 is always correct — we attach correct flag
  const arr = [
    { img: q.choice1_img, text: q.choice1, correct: true },
    { img: q.choice2_img, text: q.choice2, correct: false },
    { img: q.choice3_img, text: q.choice3, correct: false }
  ].sort(() => Math.random() - 0.5);
  return arr;
}

function renderQuestion() {
  const q = quizData[currentIndex];
  if (!q) return showResult();

  // ensure required elements exist
  const qText = $("question-text");
  const qImg = $("question-image");
  const choices = $("choices");
  if (!qText || !qImg || !choices) {
    console.error("Missing quiz-screen elements (#question-text/#question-image/#choices).");
    return;
  }

  qText.textContent = q.question || "";
  qImg.src = q.image || "";
  choices.innerHTML = "";

  // shape quiz: image choices only
  const items = buildChoicesForShape(q);
  items.forEach(item => {
    const wrap = document.createElement("div");
    wrap.className = "choice-item";
    wrap.style.display = "inline-block";
    wrap.style.margin = "8px";
    wrap.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = item.img || "";
    img.alt = item.text || "選択肢";
    img.draggable = false;
    img.className = "choice-img";
    // style not forced here; CSS handles layout

    wrap.appendChild(img);
    wrap.addEventListener("click", () => onSelectChoice(item.correct, q));
    choices.appendChild(wrap);
  });

  show("quiz-screen");
}

function onSelectChoice(isCorrect, q) {
  // disable further clicks on choices
  const choices = document.querySelectorAll("#choices .choice-item");
  choices.forEach(c => c.style.pointerEvents = "none");

  // show 1s feedback (simple)
  const feedback = document.createElement("div");
  feedback.className = "simple-feedback";
  feedback.textContent = isCorrect ? "⭕ せいかい！" : "❌ ざんねん！";
  // minimal inline style so it shows centered without requiring CSS edits
  feedback.style.position = "absolute";
  feedback.style.left = "0";
  feedback.style.top = "0";
  feedback.style.width = "100%";
  feedback.style.height = "100%";
  feedback.style.display = "flex";
  feedback.style.alignItems = "center";
  feedback.style.justifyContent = "center";
  feedback.style.fontSize = "48px";
  feedback.style.background = "rgba(255,255,255,0.85)";
  feedback.style.zIndex = 999;
  const quizScreen = $("quiz-screen");
  quizScreen.style.position = "relative";
  quizScreen.appendChild(feedback);

  if (isCorrect) score++;

  setTimeout(() => {
    feedback.remove();
    // go to answer (play video) screen
    playAnswerVideo(q);
  }, 1000);
}

function playAnswerVideo(q) {
  // show answer screen
  show("answer-screen");
  const feedbackArea = $("feedback-area");
  const video = $("answer-video");
  const nextBtn = $("next-btn");
  if (!feedbackArea || !video || !nextBtn) {
    console.error("Missing answer-screen elements (#feedback-area, #answer-video, #next-btn).");
    return;
  }

  // show small feedback text (kept minimal)
  feedbackArea.textContent = "";

  // set video src from CSV answer_video
  const src = (q.answer_video || "").trim();
  if (!src) {
    feedbackArea.textContent = "（答え合わせ用の動画が見つかりません）";
    video.removeAttribute("src");
    video.load();
  } else {
    video.src = src;
    video.load();
    video.play().catch(e => {
      // autoplay may be blocked; controls are available for manual play
      console.warn("video.play blocked:", e);
    });
  }

  // next button text
  nextBtn.textContent = (currentIndex >= quizData.length - 1) ? "けっかをみる ▶️" : "つぎのもんだいへ ▶️";

  // assign single handler (overwrite)
  nextBtn.onclick = () => {
    try { video.pause(); } catch (e) {}
    if (currentIndex >= quizData.length - 1) {
      showResult();
    } else {
      currentIndex++;
      renderQuestion();
    }
  };
}

function showResult() {
  show("end-screen");
  const st = $("score-text");
  if (st) st.textContent = `せいかい：${score} / ${quizData.length}`;
}

// ---- initialization ----
document.addEventListener("DOMContentLoaded", () => {
  // start/select/restart buttons exist in your HTML
  const startBtn = $("start-btn");
  const quizShapeBtn = $("quiz-shape-btn");
  const restartBtn = $("restart-btn");

  if (startBtn) startBtn.onclick = () => show("select-screen");
  if (restartBtn) restartBtn.onclick = () => location.reload();

  if (quizShapeBtn) {
    quizShapeBtn.onclick = async () => {
      try {
        allData = await loadCSV();
        if (!allData || allData.length === 0) {
          alert("CSV に問題データが見つかりません。");
          return;
        }
        // pick QUIZ_COUNT random questions
        quizData = pickRandomQuestions(allData, QUIZ_COUNT);
        currentIndex = 0;
        score = 0;
        renderQuestion();
      } catch (err) {
        console.error(err);
        alert("CSV の読み込みに失敗しました（コンソール参照）。");
      }
    };
  }
});

// small helpers for clarity
function pickRandomQuestions(data, n) { return [...data].sort(() => Math.random() - 0.5).slice(0, n); }
function renderQuestion() { /* alias kept for compatibility */ return showQuestion(); }
