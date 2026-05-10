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
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [
        {
          role: "system",
          content:
            "Summarize these crypto news headlines briefly focusing on important market-moving developments involving major cryptocurrencies. Ignore meme coins.",
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
  const news = await getCryptoNews();

  console.log(news);

  const summary = await summarize(news);

  await sendDiscord(summary);

  console.log("sent");
}

main();
