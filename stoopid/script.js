const textEl = document.getElementById("text");
const choicesEl = document.getElementById("choices");
const nextBtn = document.getElementById("nextBtn");

function typeText(text, speed = 10, callback) {
  textEl.innerHTML = "";
  let i = 0;

  const interval = setInterval(() => {
    textEl.innerHTML += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      if (callback) callback();
    }
  }, speed);
}

const scenes = [
  {
    text: "I thought about getting you flowers and chocolates, or buying you another piece of jewelry, but none of them sounded special or fun. I thought about writing you a letter, but there are so many things I wanna say to you and my ADHD brain simply cannot put together any narrative that feels natural or fluent. I sit down by my desk, and all I can think about is the color of your eyes, the curves of your hair, the little lines around your eyes when you smile, and the softness of your skin when we cuddle in bed. There are so many things I love about you and if I were to put all of them in a letter it would be so, so long. So I decided to do this instead, your stupid swe brain would probably appreciate it more. Happy valentines :)",
    choices: null
  },
  {
    question: "Would you change anything about the first day we met?",
    choices: [
      { label: "No, it was perfect chaos", blurb: "BLURB_1" },
      { label: "I’d want more time", blurb: "BLURB_2" },
      { label: "I’d be less awkward (maybe)", blurb: "BLURB_3" }
    ]
  },
  {
    question: "If we could pause the world for a day, what would you want to do?",
    choices: [
      { label: "Stay in and rot together", blurb: "BLURB_4" },
      { label: "Do something stupid and memorable", blurb: "BLURB_5" },
      { label: "Just talk and laugh", blurb: "BLURB_6" }
    ]
  }
];

let sceneIndex = 0;

function renderScene() {
  choicesEl.innerHTML = "";
  nextBtn.classList.add("hidden");

  const scene = scenes[sceneIndex];

  if (scene.text) {
    typeText(scene.text, 10, () => {
      nextBtn.classList.remove("hidden");
    });
  } else {
    typeText(scene.question, 10, () => {
      scene.choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.textContent = choice.label;

        btn.onclick = () => {
          choicesEl.innerHTML = "";
          typeText(choice.blurb, 10, () => {
            nextBtn.classList.remove("hidden");
          });
        };

        choicesEl.appendChild(btn);
      });
    });
  }
}

nextBtn.onclick = () => {
  sceneIndex++;
  if (sceneIndex < scenes.length) {
    renderScene();
  } else {
    typeText("Happy Valentine’s Day ❤️");
    nextBtn.classList.add("hidden");
  }
};

renderScene();