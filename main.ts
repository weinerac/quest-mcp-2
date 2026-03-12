import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createQuestServer } from "./src/server-core.js";

async function startStdioServer(): Promise<void> {
  const server = createQuestServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("Quest Apartment Hotels MCP server listening on stdio");
}

function startHttpServer(): void {
  const host = process.env.HOST ?? "127.0.0.1";
  const app = createMcpExpressApp({ host });

  app.get("/", (_req: any, res: any) => {
    res.json({
      status: "ok",
      service: "Quest Apartment Hotels MCP Server",
      endpoint: "/mcp",
      transport: "streamable-http",
    });
  });

  app.post("/mcp", async (req: any, res: any) => {
    const server = createQuestServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Failed to handle MCP request", error);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", (_req: any, res: any) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  });

  app.delete("/mcp", (_req: any, res: any) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  });

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, host, (error?: Error) => {
    if (error) {
      throw error;
    }

    console.log(`Quest Apartment Hotels MCP server listening on http://${host}:${port}/mcp`);
  });
}

if (process.argv.includes("--stdio")) {
  startStdioServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  startHttpServer();
}
