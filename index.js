import axios from "axios";

const webhook = process.env.DISCORD_WEBHOOK_URL;
const openrouter = process.env.OPENROUTER_API_KEY;

async function getCryptoNews() {
  const news = await axios.get(
    "https://min-api.cryptocompare.com/data/v2/news/?lang=EN"
  );

  return news.data.Data.slice(0, 5)
    .map((n, i) => `${i + 1}. ${n.title}`)
    .join("\n");
}

async function summarize(newsText) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        {
          role: "system",
          content:
            "You are a crypto news analyst. Summarize briefly focusing only on important market-moving events about major cryptocurrencies. Exclude meme coins."
        },
        {
          role: "user",
          content: newsText
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${openrouter}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.choices[0].message.content;
}

async function sendDiscord(message) {
  await axios.post(webhook, {
    content: `## 📰 Daily Crypto News\n\n${message}`
  });
}

async function main() {
  const news = await getCryptoNews();
  const summary = await summarize(news);

  await sendDiscord(summary);

  console.log("sent");
}

main();
