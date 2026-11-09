
"use strict";

// 大アルカナ22枚
const tarotCards = [
  "愚者", "魔術師", "女教皇", "女帝",
  "皇帝", "法王", "恋人", "戦車",
  "力", "隠者", "運命の輪", "正義",
  "吊るされた男", "死神", "節制", "悪魔",
  "塔", "星", "月", "太陽", "審判", "世界"
];

const positions = ["過去", "現在", "未来"];

const drawBtn = document.getElementById("drawBtn");
const categorySelect = document.getElementById("categorySelect");
const resultSection = document.getElementById("resultSection");
const cardResults = document.getElementById("cardResults");
const readingResult = document.getElementById("readingResult");

// カードを3枚引く
function drawThreeCards() {
  const deck = tarotCards.map((name, id) => ({
    id,
    name
  }));

  // Fisher-Yates シャッフル
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.slice(0, 3).map((card, index) => ({
    ...card,
    position: positions[index],
    isReversed: Math.random() < 0.5
  }));
}

// カード画像のパス
function getCardImage(id) {
  const number = String(id + 1).padStart(2, "0");
  return `images/major_${number}_${getImageName(id)}.png`;
}

function getImageName(id) {
  const names = [
    "fool", "magician", "high_priestess", "empress",
    "emperor", "hierophant", "lovers", "chariot",
    "strength", "hermit", "wheel", "justice",
    "hanged_man", "death", "temperance", "devil",
    "tower", "star", "moon", "sun", "judgement", "world"
  ];

  return names[id];
}



/* カードを順番にめくって表示 */
function displayCards(cards) {
  cardResults.innerHTML = "";

  cards.forEach((card, index) => {
    const cardElement = document.createElement("div");
    cardElement.className = "tarot-card";

    // 過去・現在・未来
    const title = document.createElement("h3");
    title.textContent = card.position;

    // カードを回転させるための外枠
    const flip = document.createElement("div");
    flip.className = "card-flip";

    const inner = document.createElement("div");
    inner.className = "card-flip-inner";

    // カードの裏面
    const back = document.createElement("div");
    back.className = "card-face card-back";

    // カードの表面
    const front = document.createElement("div");
    front.className = "card-face card-front";

    const img = document.createElement("img");
    img.src = getCardImage(card.id);
    img.alt = card.name;

    if (card.isReversed) {
      img.classList.add("reversed");
    }

    front.appendChild(img);
    inner.append(back, front);
    flip.appendChild(inner);

    // カード名
    const name = document.createElement("p");
    name.textContent =
      `${card.name}（${card.isReversed ? "逆位置" : "正位置"}）`;

    // めくれるまではカード名を隠す
    name.style.visibility = "hidden";

    cardElement.append(title, flip, name);
    cardResults.appendChild(cardElement);

    // 過去 → 現在 → 未来の順にめくる
    const delay = 1200 + index * 1200;

    setTimeout(() => {
      flip.classList.add("is-flipped");
      name.style.visibility = "visible";
    }, delay);
  });
}


// ボタンをクリックしたとき


drawBtn.addEventListener("click", async () => {
  if (!categorySelect.value) {
    alert("占いカテゴリーを選択してください");
    return;
  }

  // 登録順とカテゴリーIDを対応させる

const categoryIds = {
  "恋愛": 1,
  "仕事": 3,
  "人生全般": 8,
  "スピリチュアル": 9
};



  const categoryId = categoryIds[categorySelect.value];
 

  const cards = drawThreeCards();


//総合メッセージテスト用（あとで戻すこと）
  //const cards = [
  //{
  //  id: 0,
  //  name: "愚者",
  //  position: "過去",
  //  isReversed: false
  //},
  //{
  //  id: 1,
  //  name: "魔術師",
  //  position: "現在",
  //  isReversed: false
  //},
  //{
  //  id: 2,
  //  name: "女教皇",
  //  position: "未来",
  //  isReversed: false
  //}
//];



  drawBtn.disabled = true;
  drawBtn.textContent = "🔮 カードが運命を導いています…";
  resultSection.hidden = false;

  // カードを表示する
  displayCards(cards);

  // 鑑定結果は最初は隠しておく
  readingResult.textContent = "";
  readingResult.style.display = "none";

  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  try {
    // Supabaseから鑑定結果を取得
    const readingPromise = getTarotReading(categoryId, cards);

    // 3枚目がめくれ終わるまで待つ
    const animationPromise = new Promise(resolve => {
      setTimeout(resolve, 4700);
    });

    // 鑑定結果の取得とアニメーションの両方を待つ
    const [reading] = await Promise.all([
      readingPromise,
      animationPromise
    ]);

    // 鑑定結果を表示
    displayReading(reading, cards);
    readingResult.style.display = "block";

    // 表示アニメーションを再実行
    readingResult.classList.remove("reading-appear");
    void readingResult.offsetWidth;
    readingResult.classList.add("reading-appear");


    // 鑑定結果の位置までゆっくりスクロール
    setTimeout(() => {
      readingResult.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 300);




  } catch (error) {
    console.error("鑑定取得エラー:", error);

    readingResult.textContent =
      "鑑定結果を取得できませんでした。接続設定を確認してください。";

    readingResult.style.display = "block";

  } finally {
  drawBtn.disabled = false;
  drawBtn.textContent = "🔮 カードを引く";
}
});



async function getTarotReading(categoryId, cards) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/get_tarot_reading_v2`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY
      },
      body: JSON.stringify({
        p_category_id: categoryId,
        p_card1_id: cards[0].id,
        p_card1_reversed: cards[0].isReversed,
        p_card2_id: cards[1].id,
        p_card2_reversed: cards[1].isReversed,
        p_card3_id: cards[2].id,
        p_card3_reversed: cards[2].isReversed
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}



/* ===================================
   STEP 10：鑑定結果を3つに分ける
=================================== */


function displayReading(reading, cards) {

  //デバッグ　console.log("displayReadingに渡されたreading:", reading);

  // Supabaseから取得した文章を分割
  //const parts = reading.split(/【(過去|現在|未来)】/);

  //const individualReading = reading.split("【総合メッセージ】")[0];

  //const parts = individualReading.split(/【(過去|現在|未来)】/);


// 特別メッセージを分離
const spiritualMarker = "✨ 魂からの特別なメッセージ ✨";

const spiritualIndex = reading.indexOf(spiritualMarker);

let spiritualText = "";

if (spiritualIndex !== -1) {
  spiritualText = reading
    .slice(spiritualIndex + spiritualMarker.length)
    .trim();
}

// 特別メッセージを除いた鑑定文
const readingWithoutSpiritual =
  spiritualIndex !== -1
    ? reading.slice(0, spiritualIndex)
    : reading;

// 総合メッセージを除いた個別鑑定文
const individualReading =
  readingWithoutSpiritual.split("【総合メッセージ】")[0];

const parts =
  individualReading.split(/【(過去|現在|未来)】/);




  const messages = {};

  for (let i = 1; i < parts.length; i += 2) {
    messages[parts[i]] = parts[i + 1].trim();
  }

  // 総合メッセージを個別鑑定から分離
  const summaryMarker = "【総合メッセージ】";
  const summaryIndex = reading.indexOf(summaryMarker);

  let summaryText = "";

  if (summaryIndex !== -1) {
    summaryText = reading
      .slice(summaryIndex + summaryMarker.length)
      .trim();
  }


  // 表示領域を初期化
  readingResult.replaceChildren();

  // 過去・現在・未来の順番で表示
  ["過去", "現在", "未来"].forEach((position, index) => {
    const card = cards[index];

    const section = document.createElement("section");
    section.className = "reading-part";

    const heading = document.createElement("h3");
    heading.textContent = `✦ ${position}のメッセージ`;

    // カード画像と文章を横に並べるための枠
    const content = document.createElement("div");
    content.className = "reading-part-content";

    // カード情報
    const cardInfo = document.createElement("div");
    cardInfo.className = "reading-card-info";

    const img = document.createElement("img");
    img.src = getCardImage(card.id);
    img.alt = card.name;

    if (card.isReversed) {
      img.classList.add("reversed");
    }

    const name = document.createElement("p");
    name.textContent =
      `${card.name}（${card.isReversed ? "逆位置" : "正位置"}）`;

    cardInfo.append(img, name);

    // 鑑定文章
    const paragraph = document.createElement("p");
    paragraph.className = "reading-message";
    paragraph.textContent = messages[position] || "";

    content.append(cardInfo, paragraph);
    section.append(heading, content);

    readingResult.appendChild(section);
  });

  // 総合メッセージがある場合は一番下に追加
  if (summaryText) {
    const summarySection = document.createElement("section");
    summarySection.className = "reading-part reading-summary";

    const summaryHeading = document.createElement("h3");
    summaryHeading.textContent =
      "✦ 3枚のカードから導く総合メッセージ ✦";

    const summaryParagraph = document.createElement("p");
    summaryParagraph.className = "reading-message";
    summaryParagraph.textContent = summaryText;

    summarySection.append(summaryHeading, summaryParagraph);
    readingResult.appendChild(summarySection);
  }


// スピリチュアル専用：魂からの特別なメッセージ
if (spiritualText) {
  const spiritualSection = document.createElement("section");
  spiritualSection.className = "reading-part reading-spiritual";

  const spiritualHeading = document.createElement("h3");
  spiritualHeading.textContent =
    "✨ 魂からの特別なメッセージ ✨";

  const spiritualParagraph = document.createElement("p");
  spiritualParagraph.className = "reading-message";
  spiritualParagraph.textContent = spiritualText;

  spiritualSection.append(
    spiritualHeading,
    spiritualParagraph
  );

  readingResult.appendChild(spiritualSection);
}




}

