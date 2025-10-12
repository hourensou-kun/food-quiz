let quizData = [];
let current = 0;
const MAX = 3;
const videoEl = document.getElementById("result-video");

async function loadCSV() {
  try {
    const res = await fetch("data.csv");
    if (!res.ok) throw new Error("CSVが見つかりませんでした");
    const text = await res.text();
    const rows = text.split("\n").slice(1);
    quizData = rows
      .filter(r => r.trim() !== "")
      .map(r => {
        const c = r.split(",");
        return {
          question: c[1],
          image: c[2],
          choice1: c[3],
          choice1_img: c[4],
          choice2: c[5],
          choice2_img: c[6],
          choice3: c[7],
          choice3_img: c[8],
          answer: parseInt(c[9]),
          answer_video: c[10]?.trim()
        };
      });
    quizData = quizData.sort(() => Math.random() - 0.5).slice(0, MAX);
  } catch (err) {
    alert("クイズデータの読み込みに失敗しました。\n\n" + err.message);
    console.error(err);
  }
}

function showScreen(id) {
  document
    .querySelectorAll("#title-screen, #quiz-screen, #result-screen, #end-screen")
    .forEach(el => (el.style.display = "none"));
  document.getElementById(id).style.display = "block";
}

function stopVideo() {
  videoEl.pause();
  videoEl.currentTime = 0;
  videoEl.removeAttribute("src");
  videoEl.load();
}

async function startGame() {
  await loadCSV();
  if (quizData.length === 0) return;
  current = 0;
  showQuestion();
  showScreen("quiz-screen");
}

function showQuestion() {
  stopVideo();
  const q = quizData[current];
  document.getElementById("question-text").textContent = q.question;
  document.getElementById("question-image").src = q.image;

  const choices = [
    { img: q.choice1_img, text: q.choice1, index: 1 },
    { img: q.choice2_img, text: q.choice2, index: 2 },
    { img: q.choice3_img, text: q.choice3, index: 3 }
  ].sort(() => Math.random() - 0.5);

  const container = document.getElementById("choices-container");
  container.innerHTML = "";
  choices.forEach(c => {
    const div = document.createElement("div");
    div.className = "choice";
    const img = document.createElement("img");
    img.src = c.img;
    img.onclick = () => checkAnswer(c.index, c.text);
    div.appendChild(img);
    container.appendChild(div);
  });
}

function checkAnswer(choice, choiceText) {
  stopVideo();
  const q = quizData[current];
  showScreen("result-screen");

  const resultText = document.getElementById("result-text");
  const selectedText = document.getElementById("selected-text");
  const answerText = document.getElementById("answer-text");
  const correctImg = document.getElementById("correct-image");
  const video = document.getElementById("result-video");
  const nextBtn = document.getElementById("next-btn");

  nextBtn.style.display = "inline-block";
  correctImg.style.display = "none";
  video.style.display = "none";
  answerText.textContent = "";
  selectedText.textContent = "";

  const correctSrc = [q.choice1_img, q.choice2_img, q.choice3_img][q.answer - 1];
  const correctName = [q.choice1, q.choice2, q.choice3][q.answer - 1];

  if (choice === q.answer) {
    resultText.textContent = "⭕ せいかい！";
    resultText.style.color = "#ff6b6b";
  } else {
    resultText.textContent = "❌ ざんねん！";
    resultText.style.color = "#555";
  }

  selectedText.textContent = `あなたがえらんだのは「${choiceText}」`;
  answerText.textContent = `せいかいは「${correctName}」`;
  correctImg.src = correctSrc;
  correctImg.style.display = "block";

  if (q.answer_video) {
    video.src = q.answer_video;
    video.style.display = "block";
    video.play();
  }
}

function nextQuestion() {
  stopVideo();
  current++;
  if (current < quizData.length) {
    showScreen("quiz-screen");
    showQuestion();
  } else {
    showScreen("end-screen");
  }
}

function restartGame() {
  stopVideo();
  current = 0;
  showScreen("title-screen");
}

showScreen("title-screen");
