/* 全体のレイアウト：スマホ縦でも横長っぽく表示 */
body {
  margin: 0;
  padding: 0;
  font-family: "Noto Sans JP", sans-serif;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  overflow: hidden;
}

#quiz-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 2vh;
  box-sizing: border-box;
}

/* 縦画面スマホでも横向きに見えるように強制横長レイアウト */
@media (max-aspect-ratio: 3/4) {
  #quiz-container {
    flex-direction: column;
    transform: rotate(90deg);
    transform-origin: center center;
    width: 100vh;
    height: 100vw;
  }
}

#question-title {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1rem;
}

#question-image {
  width: 40%;
  max-height: 60vh;
  object-fit: contain;
}

#options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-btn {
  font-size: 1.2rem;
  padding: 1rem 2rem;
  border-radius: 8px;
  border: none;
  background-color: #f2f2f2;
  cursor: pointer;
  transition: 0.3s;
}

.option-btn:hover {
  background-color: #ddd;
}

#result {
  text-align: center;
}

#result img {
  width: 40%;
  margin: 1rem auto;
}

#result video {
  width: 60%;
  margin-top: 1rem;
}

/* 常に表示される「次の問題へ」ボタン */
#next-button {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 1000;
}

.hidden {
  display: none;
}
