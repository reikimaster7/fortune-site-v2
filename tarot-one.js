
"use strict";

// 大アルカナ22枚（既存の3枚引きと同じID）
const tarotCards = [
  "愚者", "魔術師", "女教皇", "女帝",
  "皇帝", "法王", "恋人", "戦車",
  "力", "隠者", "運命の輪", "正義",
  "吊るされた男", "死神", "節制", "悪魔",
  "塔", "星", "月", "太陽", "審判", "世界"
];

// カテゴリーとSupabaseのID
const categoryIds = {
  "恋愛": 1,
  "仕事": 3,
  "人生全般": 8,
  "スピリチュアル": 9
};

// HTML要素
const drawBtn = document.getElementById("drawBtn");
const categorySelect = document.getElementById("categorySelect");
const resultSection = document.getElementById("resultSection");
const cardResults = document.getElementById("cardResults");
const readingResult = document.getElementById("readingResult");

// 画像ファイル名
const imageNames = [
  "fool", "magician", "high_priestess", "empress",
  "emperor", "hierophant", "lovers", "chariot",
  "strength", "hermit", "wheel", "justice",
  "hanged_man", "death", "temperance", "devil",
  "tower", "star", "moon", "sun", "judgement", "world"
];

function getCardImage(id) {
  const number = String(id + 1).padStart(2, "0");
  return `images/major_${number}_${imageNames[id]}.png`;
}

// カードを1枚引く
function drawOneCard() {
  const id = Math.floor(Math.random() * tarotCards.length);

  return {
    id,
    name: tarotCards[id],
    isReversed: Math.random() < 0.5
  };
}

// カードを表示してめくる
function displayCard(card) {
  cardResults.replaceChildren();

  const cardElement = document.createElement("div");
  cardElement.className = "tarot-card";

  const flip = document.createElement("div");
  flip.className = "card-flip";

  const inner = document.createElement("div");
  inner.className = "card-flip-inner";

  const back = document.createElement("div");
  back.className = "card-face card-back";

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

  const name = document.createElement("p");
  name.textContent =
    `${card.name}（${card.isReversed ? "逆位置" : "正位置"}）`;

  name.style.visibility = "hidden";

  cardElement.append(flip, name);
  cardResults.appendChild(cardElement);

  // 1.2秒後にカードをめくる
  setTimeout(() => {
    flip.classList.add("is-flipped");
    name.style.visibility = "visible";
  }, 1200);
}

// Supabaseから1枚分の鑑定文を取得
async function getOneCardReading(categoryId, card) {
  const params = new URLSearchParams({
    select: "meaning_text",
    category_id: `eq.${categoryId}`,
    card_id: `eq.${card.id}`,
    is_reversed: `eq.${card.isReversed}`
  });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/tarot_card_meanings?${params}`,
    {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `Supabase取得エラー: ${response.status} ${await response.text()}`
    );
  }

  const rows = await response.json();

  if (rows.length !== 1) {
    throw new Error(
      `鑑定文が1件ではありません（取得件数: ${rows.length}）`
    );
  }

  return rows[0].meaning_text;
}

// 鑑定文を表示

function displayReading(card, meaning) {
  readingResult.replaceChildren();

  const section = document.createElement("section");
  section.className = "reading-part";

  // 鑑定結果の見出し
  const heading = document.createElement("h3");
  heading.textContent = "✦ 今のあなたへのメッセージ ✦";

  // 鑑定文章
  const paragraph = document.createElement("p");
  paragraph.className = "reading-message";
  paragraph.textContent = meaning;

  section.append(heading, paragraph);
  readingResult.appendChild(section);
}


// ボタンクリック
drawBtn.addEventListener("click", async () => {
  const categoryId = categoryIds[categorySelect.value];

  if (!categoryId) {
    alert("占いカテゴリーを選択してください");
    return;
  }

  const card = drawOneCard();

  drawBtn.disabled = true;
  drawBtn.textContent = "🔮 カードが運命を導いています…";

  resultSection.hidden = false;
  readingResult.replaceChildren();
  readingResult.style.display = "none";

  displayCard(card);

  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  try {
    // データ取得とカード演出の両方を待つ
    const [meaning] = await Promise.all([
      getOneCardReading(categoryId, card),
      new Promise(resolve => setTimeout(resolve, 2300))
    ]);

    displayReading(card, meaning);
    readingResult.style.display = "block";

    readingResult.classList.remove("reading-appear");
    void readingResult.offsetWidth;
    readingResult.classList.add("reading-appear");

    setTimeout(() => {
      readingResult.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 300);

  } catch (error) {
    console.error("1枚引き鑑定エラー:", error);

    readingResult.textContent =
      "鑑定結果を取得できませんでした。接続設定を確認してください。";

    readingResult.style.display = "block";

  } finally {
    drawBtn.disabled = false;
    drawBtn.textContent = "🃏 カードを1枚引く";
  }
});
