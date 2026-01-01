import { PartySocket } from "partysocket";

const host = "agents-starter.202102295.workers.dev";

const ws = new PartySocket({
  host,
  protocol: "wss",
  prefix: "agents",
  party: "chat",
  room: "default"
});

ws.addEventListener("open", () => {
  ws.send(
    JSON.stringify({
      id: "cli-test",
      type: "cf_agent_use_chat_request",
      url: `https://${host}/agents/chat/default`,
      init: {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              id: "1",
              parts: [{ type: "text", text: "Hola, ¿qué puedes hacer?" }]
            }
          ]
        })
      }
    })
  );
});

ws.addEventListener("message", (event) => {
  console.log("[socket]", event.data);
});

ws.addEventListener("error", (event) => {
  console.error("[socket error]", event);
});