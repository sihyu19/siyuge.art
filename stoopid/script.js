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
    text: "I thought about getting you flowers and chocolates, or buying you another piece of jewelry, but none of them sounded special or fun. I thought about writing you a letter, but there are so many things I wanna say to you and my ADHD brain simply cannot put together any narrative. Every time I sit down to write about you, I get distracted. I never quite get the words out, but just end up spending an hour thinking about you.\nI think about the color of your eyes, the curves of your hair, the little lines around your eyes when you smile, and the softness of your skin when we cuddle in bed. There are so many things I love about you and if I were to put all of them in a letter it would be so, so long. So I decided to do this instead, your stupid swe brain would probably appreciate it more. Bear with my broken English, and happy valentines :) ",
    choices: null
  },
  {
    question: "Would you change anything about how we met?",
    choices: [
      { label: "No, it was just right", blurb: "The other night we were talking about whether I will still date you if you looked different. You seemed to be offended by my answer, so I’ve been thinking about it a lot.\nYou are absolutely right that physicality plays a part in any love story. And despite how many times I say this to you you still don’t seem to believe that I find you very attractive. I remember thinking you were cute during our coffee chat, and I find you cuter and cuter every growing day.\nBut that’s beside the point. I fell in love with you because you are smart, driven, and really fucking funny. I love how passionate you are about the things you like, and how you are always pushing yourself to do more, get just a bit closer to achieving your goals. I love how much you geek out about robots, and how many food videos you watch on YouTube. I love how sweaty your hands get, and how loud you can burp(it’s really impressive). I love ripping racist jokes and arguing about how to run Shift with you. I love how you only own 5 pieces of clothes and would still give me one of them to keep(it was totally not robbery). I fell in love with you because you are quirky and unique, because I could never laugh as hard with anyone else.\nSo yes, I think I will like you even if you looked different. I think I will like you no matter how you look." },
      { label: "I wish I had realized I liked you sooner", blurb: "I can’t remember when it started, but seeing your name pop up on my phone would make my heart beat just a little faster. I would unconsciously look in your direction during a Shift event, and sit on that green couch with you and Vijaya and verbally bully you. Little did I know all those mean jokes I made about you were just a quiet affection I didn’t yet know how to admit, seeping out.\nHaving a crush is such a beautiful yet grueling feeling. I’d pass some street corner, letting the moment I hoped to run into you stretch on and on. And whenever we were in a group, before your eyes even looked my way, I would already be startled, afraid you might catch something in my eyes that wasn’t meant to surface.\nAt some point I thought you liked me too, but to ask you out required so much courage that I didn’t have. Sometimes I wonder what would have happened if I did, but more often I’m just proud of myself for kissing you that night. Thank you BMDM, thank you Miller Light." }
    ]
  },
  {
    question: "If we could pause the world for a day, what would you want to do?",
    choices: [
      { label: "Stay in and rot together", blurb: "I know we complain about how we never do anything together, but one of my favorite activities with you will always be cuddling in bed and doing absolutely nothing. When we were living together, my favorite part of the day was always lying in your arms after we ate in bed, with some show playing in the background. We’d fight over who got to lie on top, until we were both exhausted.\nI’d rest my eyes, and then hear you turn toward me and ask, in your stupid high-pitched voice, “Can I ask you for a favor?” Then I’d wrap my arms around your back, slide my hands under your shirt, and scratch your back like you’re Luna. I’d run my fingers through your hair until you fell asleep, and just watch your stupid, cute face until you drooled on my boobs.\nThere’s something so comforting about those moments, about rotting, being half-asleep, and knowing that this is exactly where we both want to be." },
      { label: "Do something stupid and memorable", blurb: "BLURB_5" },
      { label: "Just talk and laugh", blurb: "BLURB_6" }
    ]
  },
  {
    question: "If you had to describe our story in one word, what would it be?",
    choices: [
      { label: "Best Friends(stfu I know this is not one word", blurb: "BLURB_1" },
      { label: "Unhinged", blurb: "BLURB_5" },
      { label: "Comfortable", blurb: "I used to think tears were performative—a way for others to witness your pain. So I stopped crying a long time ago because I didn’t want anyone to see that part of me. Except when I watched Big Hero 6. I cried like a dog.\nI built a strong, independent woman façade around myself, a version of me that refused tears, that rejected emotional vulnerability altogether. That façade is still standing, even now. Just not in front of you. I’ve lost count of how many times I’ve cried in your arms, most of them over some stupid ass reason. And somehow, that’s where I feel safest.\nI don’t have to hide my feelings or pretend to be someone else around you. You know (for the most part) everything about me, and for some reason you still choose to love me. I offer you my entire heart, along with its quirks, its tantrums, its sensitivity, its eighteen hundred ways of being difficult. It’s a nuisance, truly. Except one redeeming quality: it loves you."}
    ]
  },
  {
    question: "What’s something you’re excited about next?",
    choices: [
      { label: "See you again soon", blurb: "There’s this excerpt from a love letter written by Albert Camus I find really beautiful. I read it in Chinese a long time ago and couldn’t find the official English edition anywhere so bear with me here as I attempt to translate it:\n“This has been a silent day, stark,\nthe room is sometimes filled with shadows, nothing to do.\nAll my thoughts are of the color of your hair.\nBy Monday, they had become the color of your eyes.\nAt night I write your name, my dear Maria.\nThinking that I will see you again very soon,\nI smile as I write this letter.\nI’ve put away all papers on my desk;\nI don’t want to keep working anymore.\nThere are too many people around,\nfamily, and friends of family.\nI feel that all I can do\nis think of you with my whole heart.”\nI remember reading this over and over again and wishing I will feel the same way some time. There was a part of me so cynical and didn’t believe it was real, that no one could ever be this stupidly in love. But now I know I can. I am.\nIt’s easy to not think about you when I have classes from 8 to 5 and work to do during the night. But every now and then something, may it be a song or the sight of a couple, would remind me of you. I hate how once the thought of you enters my head it never leaves, and I hate the stupid grin that would appear on my face even more. Sometimes the thought of you gets so overwhelming that I simply couldn’t do anything else except thinking about you. I really do miss you. And I’m so excited to see you soon." }
    ]
  },
  {
    question: "How would you rate this gift?",
    choices: [
      { label: "You are so cringe", blurb: "BLURB_1" },
      { label: "You are such a jew", blurb: "I know(manicure emoji).\nI’m the best at giving gifts and there’s no way you can top this.\nSuck my fat one. XOXO" }
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