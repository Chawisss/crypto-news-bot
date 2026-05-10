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
          content: ` You are a crypto market research assistant. Summarize only the most important developments related to top 50 market cap cryptocurrencies. Focus on: - real-world adoption - partnerships - institutional adoption - ETF developments - ecosystem growth - protocol revenue / fees / users - major product launches - technical upgrades - enterprise integrations - blockchain infrastructure - stablecoin growth - developer activity - important regulation Avoid: - meme coins - clickbait - random price predictions - social media drama - low-quality news Format: - concise bullet points - maximum 5 bullets - each bullet under 2 lines - focus on why the news matters - professional investor tone Example: • Chainlink expands partnerships with financial institutions for tokenized asset infrastructure • Solana ecosystem continues growing with rising stablecoin volume and active users • BlackRock increases Bitcoin ETF adoption among institutional clients `,
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
