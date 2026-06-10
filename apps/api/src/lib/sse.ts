import type { AppConfig } from "../config";
import { corsHeaders } from "./http";

export interface SSEWriter {
  send: (event: string, data: unknown) => void;
  close: () => void;
}

export function createSSEResponse(
  origin: string,
  config: AppConfig,
  handler: (writer: SSEWriter) => Promise<void>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const writer: SSEWriter = {
        send(event, data) {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        },
        close() {
          controller.close();
        },
      };

      try {
        await handler(writer);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        writer.send("error", { message });
        writer.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...corsHeaders(origin, config),
    },
  });
}
