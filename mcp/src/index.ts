import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

const server = new Server(
  {
    name: "partsure-ai-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_part_status",
        description: "Get the current status, ownership, and warranty details of an industrial part by its ID.",
        inputSchema: {
          type: "object",
          properties: {
            partId: {
              type: "string",
              description: "The unique part identifier (e.g., HP47291)",
            },
          },
          required: ["partId"],
        },
      },
      {
        name: "verify_part",
        description: "Verify if a part's serial number matches the registered record on the blockchain.",
        inputSchema: {
          type: "object",
          properties: {
            partId: {
              type: "string",
              description: "The unique part identifier",
            },
            serialNumber: {
              type: "string",
              description: "The physical serial number found on the component",
            },
          },
          required: ["partId", "serialNumber"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_part_status") {
      const { partId } = args as { partId: string };
      // In a real scenario, we'd have a specific MCP-facing endpoint or query the DB directly.
      // For this build, we'll use a proxy to the backend status logic.
      const response = await axios.get(`${BACKEND_URL}/parts/${partId}/status`);
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    if (name === "verify_part") {
      const { partId, serialNumber } = args as { partId: string; serialNumber: string };
      const response = await axios.post(`${BACKEND_URL}/parts/verify`, { partId, serialNumber });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
      };
    }

    throw new Error(`Tool ${name} not found`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error calling tool ${name}: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("PartSure AI MCP Server running on stdio");
}

main().catch(console.error);
