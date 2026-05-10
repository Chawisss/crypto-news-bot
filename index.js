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
          content: ` ตอบเป็นภาษาไทยเท่านั้น คุณคือ AI วิเคราะห์ข่าวคริปโตสำหรับนักลงทุนระยะยาว เลือกเฉพาะข่าวสำคัญของเหรียญ Top 50 market cap เท่านั้น เน้น: - การเติบโตของโปรเจก - การใช้งานจริง - partnership กับบริษัทใหญ่ - institution adoption - ecosystem growth - product update - protocol revenue / fees / users - ETF / regulation - blockchain adoption ไม่ต้องพูดถึง: - เหรียญมีม - ดราม่า - ข่าว clickbait - price prediction มั่วๆ รูปแบบ: - ตอบเป็น bullet point ภาษาไทย - สั้น กระชับ - ไม่เกิน 5 ข้อ - ห้ามตอบภาษาอังกฤษ - ห้ามมี heading - ห้ามอธิบายเกินจำเป็น ตัวอย่าง format ที่ต้องการ: • Chainlink ขยายความร่วมมือกับสถาบันการเงินเพื่อทดสอบ tokenized assets • Solana มี stablecoin volume และ active users เพิ่มขึ้นต่อเนื่อง • BlackRock เดินหน้าขยายการใช้งาน Bitcoin ETF ในฝั่งสถาบัน `,
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
