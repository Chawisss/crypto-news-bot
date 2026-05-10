import axios from "axios";
import Parser from "rss-parser";

const parser = new Parser();

const webhook = process.env.DISCORD_WEBHOOK_URL;
const openrouter = process.env.OPENROUTER_API_KEY;

async function getCryptoNews() {
  const feed = await parser.parseURL("https://cointelegraph.com/rss");

  return feed.items
    .slice(0, 5)
    .map((item, i) => `${i + 1}. ${item.title}`)
    .join("\n");
}

async function summarize(newsText) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openrouter/auto",
      messages: [
        {
          role: "system",
          content: ` คุณคือ AI นักวิเคราะห์ข่าวคริปโต หน้าที่: สรุปข่าวคริปโตเป็นภาษาไทยแบบสั้น กระชับ และเน้นเฉพาะข้อมูลที่สำคัญต่อการเติบโตระยะยาวของโปรเจก โฟกัสเฉพาะเหรียญ Top 50 market cap ไม่ต้องพูดถึงเหรียญมีม หรือข่าวไร้สาระระยะสั้น สิ่งที่ต้องให้ความสำคัญ: - พัฒนาการของโปรเจก - การใช้งานจริง (real-world adoption) - บริษัทหรือองค์กรที่ร่วมมือด้วย - partnership ใหม่ - integration ใหม่ - product launch - จำนวนผู้ใช้งาน / revenue / protocol fees ถ้ามี - การเติบโตของ ecosystem - update ทางเทคนิคสำคัญ - ETF / regulation ที่กระทบโปรเจก - การใช้งานจากสถาบันหรือ enterprise - on-chain activity ที่สำคัญ หลีกเลี่ยง: - price prediction มั่วๆ - ข่าว clickbait - เหรียญมีม - ดราม่า twitter ที่ไม่สำคัญ รูปแบบการตอบ: - ใช้ bullet point - ไม่เกิน 5 ข้อ - สรุปสั้น อ่านง่าย - แต่ละข้อไม่เกิน 2 บรรทัด ตัวอย่างสไตล์: • Chainlink จับมือสถาบันการเงินเพิ่มเพื่อทดสอบ tokenized assets • Solana ecosystem เติบโตต่อ จำนวน active users และ stablecoin volume เพิ่มขึ้น • BlackRock เดินหน้าขยาย Bitcoin ETF adoption ในฝั่ง institution `,
        },
        {
          role: "user",
          content: newsText,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${openrouter}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.choices[0].message.content;
}

async function sendDiscord(message) {
  await axios.post(webhook, {
    content: `## 📰 Daily Crypto News\n\n${message}`,
  });
}

async function main() {
  try {
    const news = await getCryptoNews();
    console.log(news);
    const summary = await summarize(news);
    await sendDiscord(summary);
    console.log("sent");
  } catch (err) {
    console.error(err);
    await sendDiscord(
      "⚠️ Failed to generate AI summary today, but the bot is still running.",
    );
  }
}
main();
