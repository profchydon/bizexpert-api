import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Business, User, WhatsappIdentity } from "@prisma/client";
import { AnalyticsService } from "../analytics/analytics.service";
import { InventoryService } from "../inventory/inventory.service";
import { PendingActionsService } from "../pending-actions/pending-actions.service";
import { PrismaService } from "../prisma/prisma.service";
import { executeAiTool } from "./ai-execute";
import { runAiFallback } from "./ai-fallback";
import { sanitizeChatHistory, type ChatTurn } from "./ai-history";
import {
  OPENROUTER_DEFAULT_MODEL,
  resolveOpenRouterConfig,
} from "./openrouter.client";
import { runOpenRouterToolLoop } from "./openrouter.loop";
import type { ChatMessage, OpenRouterConfig } from "./openrouter.types";
import { stripEmojis } from "./strip-emojis";
import { AI_TOOLS } from "./ai-tools";

type ChatInput = {
  user: User;
  business: Business;
  identity: WhatsappIdentity;
  messageText: string;
  history?: ChatTurn[];
  channel: "whatsapp" | "dashboard";
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private config: OpenRouterConfig | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly analyticsService: AnalyticsService,
    private readonly pendingActionsService: PendingActionsService,
    private readonly inventoryService: InventoryService,
    private readonly prisma: PrismaService,
  ) {
    this.config = resolveOpenRouterConfig(
      this.configService.get<string>("OPENROUTER_API_KEY"),
      this.configService.get<string>("APP_URL"),
    );
    if (!this.config) {
      this.logger.warn(
        "OPENROUTER_API_KEY not set — AI features will use fallback mode",
      );
    }
  }

  async handleWhatsAppMessage(
    user: User,
    business: Business,
    _phone: string,
    messageText: string,
    identity: WhatsappIdentity,
  ): Promise<string> {
    return this.handleChatMessage({
      user,
      business,
      identity,
      messageText,
      channel: "whatsapp",
    });
  }

  async handleChatMessage(input: ChatInput): Promise<string> {
    const ctx = {
      user: input.user,
      business: input.business,
      identity: input.identity,
    };
    if (!this.config) {
      return stripEmojis(
        await runAiFallback(input.messageText, ctx, this.analyticsService),
      );
    }

    const locations = await this.prisma.location.findMany({
      where: { businessId: input.business.id, isActive: true },
    });
    const surface =
      input.channel === "dashboard" ? "the dashboard chat" : "WhatsApp";
    const systemPrompt = [
      `You are the BizExpert AI assistant for *${input.business.name}*.`,
      `You help the user manage inventory and sales through ${surface}.`,
      `User: ${input.user.name}`,
      `Locations: ${locations.map((l) => `${l.name} (${l.type})`).join(", ")}`,
      `Currency: Nigerian Naira (₦).`,
      `For read queries, call the appropriate analytics tool and format the result in markdown (headings, bold, lists).`,
      `Do not use emojis.`,
      `For write operations (sale, stock receipt, transfer), ALWAYS preview first — never execute without explicit user confirmation.`,
      `If the user sends "CONFIRM [ID]" or similar, call confirm_pending_action with the ID.`,
      `If location is ambiguous, ask for clarification.`,
      `Keep responses concise. Use ₦ for currency.`,
    ].join("\n");

    const history = sanitizeChatHistory(input.history);
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map((turn) => ({ role: turn.role, content: turn.content })),
      { role: "user", content: input.messageText },
    ];
    const model = this.configService.get<string>(
      "OPENROUTER_MODEL",
      OPENROUTER_DEFAULT_MODEL,
    );
    const deps = {
      analyticsService: this.analyticsService,
      pendingActionsService: this.pendingActionsService,
      inventoryService: this.inventoryService,
      logger: this.logger,
    };
    const finalResponse = await runOpenRouterToolLoop({
      config: this.config,
      model,
      messages,
      tools: AI_TOOLS,
      execute: (name, args) => executeAiTool(name, args, ctx, deps),
    });

    return stripEmojis(finalResponse);
  }
}
