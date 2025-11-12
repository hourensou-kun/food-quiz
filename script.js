function showQuestion() {
  const q = quizData[currentQuestion];
  if (!q) return showResult();

  // 🔸ここを追加（要素が存在しないときは再構築する）
  const quizScreen = document.getElementById("quiz-screen");
  if (!document.getElementById("question-text")) {
    quizScreen.innerHTML = `
      <h2 id="question-text"></h2>
      <img id="question-image" src="" alt="クイズ画像" />
      <div id="choices"></div>
    `;
  }

  const questionText = document.getElementById("question-text");
  const questionImage = document.getElementById("question-image");
  const choicesDiv = document.getElementById("choices");

  questionText.textContent = q.question;
  questionImage.src = q.image;
  choicesDiv.innerHTML = "";

  const choices = [
    { img: q.choice1_img, correct: true },
    { img: q.choice2_img, correct: false },
    { img: q.choice3_img, correct: false }
  ].sort(() => Math.random() - 0.5);

  choices.forEach(c => {
    const div = document.createElement("div");
    div.classList.add("choice-item");

    const img = document.createElement("img");
    img.src = c.img;
    img.alt = c.text;

    const label = document.createElement("p");
    label.textContent = c.text || ""; // textがundefined対策

    div.appendChild(img);
    div.appendChild(label);
    div.addEventListener("click", () => handleAnswer(c.correct, q));
    choicesDiv.appendChild(div);
  });

  showScreen("quiz-screen");
}
