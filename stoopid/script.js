const textEl = document.getElementById("text");
const choicesEl = document.getElementById("choices");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");
let lastQuestionIndex = null;

function typeText(text, speed = 1, callback) {
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
    text: "WASSUP BABY(in Serge’s voice)! I thought about getting you flowers and chocolates, or buying you another piece of jewelry, but none of them sounded special or fun. I thought about writing you a letter, but there are so many things I wanna say to you and my ADHD brain simply cannot put together any narrative. Every time I sit down to write about you, I get distracted. I never quite get the words out, but just end up spending an hour thinking about you.\n\nI think about the curves of your hair, the way you smell, the little lines around your eyes when you smile, and the softness of your skin when we cuddle in bed. There are so many things I love about you and if I were to put all of them in a letter it would be so, so long. So I decided to do this instead, your stupid swe brain would probably appreciate it more. Bear with my broken English, and happy valentines :) ",
    choices: null
  },
  {
    question: "First of all, how are you today?",
    choices: [
      { label: "Great now that I've seen this", blurb: "BLURB_1" },
      { label: "Could be better", blurb: "BLURB_2" },
      { label: "I miss you", blurb: "Awwww I miss you too. I will literally see you so soon tho you wouldn’t even realize I was gone :P\n\nAs I’m writing this right now I’m sitting in M36 with a creamy gingerbread cold brew. I forgot to tell them to add less syrup so it’s extremely sweet. You would’ve probably enjoyed it more. And before you even start—I am NOT calling you fat. I do NOT think you are obese and I swear to god if you say that shit to me one more time I will send you oreos. Do not mess with me.\n\nAnyways, this started as a fun little idea but I ended up really getting into it. This is my first time doing anything like this so you better appreciate it and hold back your constructive criticism." },
    ]
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
      { label: "Go out and explore", blurb: "Here’s my proposition:\n\n10:37 PM — wake up\nA game of Connections followed by the Mini and pimps. We say we’ll get up in five minutes. We don’t. We watch some YouTube videos and I get impatient and make you go into the shower(maybe with me).\n\n12:44 PM — brunch & mimosas\nWe finally leave the house. I say I’m not that hungry but you know I am lying. We split a lot of food and even more mimosas. We people-watch.\n\n2:22 PM — museum / art gallery\nWe go to a museum and I spend way too much time in some rooms. You get mad at me for taking photos and I flip you off. We disagree about one piece of art and never resolve it.\n\n4:56 PM — happy hour\nWe rush to a bar and order some cheap drinks. We sit outside if possible. I get tipsy, turn really red, and try to hold your hand under the table.\n\n6:18 PM — sunset at the beach\nWe try to get to the beach before sunset. We are probably late and just end up walking on the beach in the dark. We talk about how we’ve only been out for 5 hours and somehow hungry again. You call yourself obese and I beat your ass.\n\n8:02 PM — cook dinner together(kind of)\nWe drink more. I bother you when you cook and you kick me out of the kitchen. I volunteer to cut things and wash dishes. I suggest we eat on the couch so we(you) don’t fall asleep right after.\n\n9:30 PM — you know exactly what happens here\n\n? — cuddles and movie\nWe start watching some movie and fall asleep while your head’s still on my boobs. We wake up in the middle of the night, put your laptop away, and go back to bed without saying a word. " }
    ]
  },
  {
    question: "If you had to describe our story in one word, what would it be?",
    choices: [
      { label: "Best Friends(stfu I know this is not one word", blurb: "BLURB_1" },
      { label: "Unhinged", blurb: "BLURB_5" },
      { label: "Comfortable", blurb: "I used to think tears were performative—a way for others to witness your pain. So I stopped crying a long time ago because I didn’t want anyone to see that part of me. Except when I watched Big Hero 6. I cried like a dog.\nI built a strong, independent woman façade around myself, a version of me that refused tears, that rejected emotional vulnerability altogether. That façade is still standing, even now. Just not in front of you. I’ve lost count of how many times I’ve cried in your arms, most of them over some stupid ass reason. And somehow, that’s where I feel safest.\nI don’t have to hide my feelings or pretend to be someone else around you. You know (for the most part) everything about me, and for some reason you still choose to love me. I offer you my entire heart, along with its quirks, its tantrums, its sensitivity, its eighteen hundred ways of being difficult. It’s a nuisance, truly. Except one redeeming quality: it loves you." }
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
  backBtn.classList.add("hidden");

  const scene = scenes[sceneIndex];

  if (scene.text) {
    typeText(scene.text, 1, () => {
      nextBtn.classList.remove("hidden");
    });
  } else {
    typeText(scene.question, 1, () => {
      scene.choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.textContent = choice.label;

        btn.onclick = () => {
          lastQuestionIndex = sceneIndex;
          choicesEl.innerHTML = "";

          typeText(choice.blurb, 30, () => {
            nextBtn.classList.remove("hidden");
            backBtn.classList.remove("hidden");
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

backBtn.onclick = () => {
  sceneIndex = lastQuestionIndex;
  lastQuestionIndex = null;
  backBtn.classList.add("hidden");
  nextBtn.classList.add("hidden");
  renderScene();
};

renderScene();