import http from "node:http";

const PORT = 3001;
const API_KEY = process.env.GROQ_API_KEY;

const headers = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/chat") {
    res.writeHead(404, headers);
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (!API_KEY) {
    res.writeHead(500, headers);
    res.end(JSON.stringify({
      error: "GROQ_API_KEY is not configured."
    }));
    return;
  }

  try {
    let body = "";

    for await (const chunk of req) {
      body += chunk;
    }

    const data = JSON.parse(body);

    const messages = Array.isArray(data.messages)
      ? data.messages
      : [];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content:
                "You are Satona AI, the built-in AI assistant for Satona. Be helpful, friendly, concise, and clear. Do not claim to have capabilities you do not have."
            },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      res.writeHead(response.status, headers);
      res.end(JSON.stringify({
        error:
          result?.error?.message ||
          "Groq returned an error."
      }));
      return;
    }

    const message =
      result?.choices?.[0]?.message?.content ||
      "I couldn't generate a response.";

    res.writeHead(200, headers);
    res.end(JSON.stringify({ message }));
  } catch (error) {
    console.error(error);

    res.writeHead(500, headers);
    res.end(JSON.stringify({
      error: "Satona AI could not process that request."
    }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Satona AI backend running at http://127.0.0.1:${PORT}`);
});
