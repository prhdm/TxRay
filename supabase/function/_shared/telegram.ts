// Shared Telegram utility functions for edge functions
// supabase/functions/_shared/telegram.ts

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
}

interface TelegramResponse {
  ok: boolean;
  result?: any;
  error_code?: number;
  description?: string;
}

export class TelegramBot {
  private botToken: string;
  private groupId: string;

  constructor() {
    this.botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
    this.groupId = Deno.env.get("TELEGRAM_GROUP_ID") || "";
  }

  private async sendMessage(message: TelegramMessage): Promise<TelegramResponse> {
    if (!this.botToken || !this.groupId) {
      console.warn("Telegram bot not configured - skipping message");
      return { ok: false, description: "Telegram not configured" };
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to send Telegram message:", error);
      return { ok: false, description: String(error) };
    }
  }

  async sendAlert(message: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<TelegramResponse> {
    return this.sendMessage({
      chat_id: this.groupId,
      text: message,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    });
  }

  async sendNewUserAlert(walletAddress: string, userId: string): Promise<TelegramResponse> {
    const message = `
🆕 <b>New User Connected</b>

👤 <b>Wallet:</b> <code>${walletAddress}</code>
🆔 <b>User ID:</b> <code>${userId}</code>
⏰ <b>Time:</b> ${new Date().toISOString()}
🔗 <b>Network:</b> Taiko Hekla

Welcome to TxRay! 🎉
    `.trim();

    return this.sendAlert(message);
  }

  async sendIndexerUpdateAlert(
    fromBlock: number, 
    toBlock: number, 
    transactionsProcessed: number,
    duration?: number
  ): Promise<TelegramResponse> {
    const blockDiff = toBlock - fromBlock;
    const durationText = duration ? `⏱️ <b>Duration:</b> ${duration}ms` : '';
    
    const message = `
📊 <b>Indexer Update</b>

🔄 <b>Blocks Processed:</b> ${blockDiff.toLocaleString()}
📈 <b>From Block:</b> ${fromBlock.toLocaleString()}
📈 <b>To Block:</b> ${toBlock.toLocaleString()}
💼 <b>Transactions:</b> ${transactionsProcessed.toLocaleString()}
${durationText}
⏰ <b>Time:</b> ${new Date().toISOString()}
    `.trim();

    return this.sendAlert(message);
  }

  async sendErrorAlert(
    error: string, 
    context: string, 
    additionalInfo?: Record<string, any>
  ): Promise<TelegramResponse> {
    const infoText = additionalInfo 
      ? Object.entries(additionalInfo)
          .map(([key, value]) => `• <b>${key}:</b> ${value}`)
          .join('\n')
      : '';

    const message = `
🚨 <b>Error Alert</b>

❌ <b>Error:</b> <code>${error}</code>
📍 <b>Context:</b> ${context}
${infoText ? `\n📋 <b>Details:</b>\n${infoText}` : ''}
⏰ <b>Time:</b> ${new Date().toISOString()}
    `.trim();

    return this.sendAlert(message);
  }

  async sendSystemAlert(message: string): Promise<TelegramResponse> {
    const formattedMessage = `
🔧 <b>System Alert</b>

${message}

⏰ <b>Time:</b> ${new Date().toISOString()}
    `.trim();

    return this.sendAlert(formattedMessage);
  }
}

// Helper function to check if Telegram is configured
export function isTelegramConfigured(): boolean {
  return !!(Deno.env.get("TELEGRAM_BOT_TOKEN") && Deno.env.get("TELEGRAM_GROUP_ID"));
}

// Helper function to safely send Telegram messages (won't throw errors)
export async function safeTelegramAlert(
  message: string, 
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<void> {
  try {
    const bot = new TelegramBot();
    await bot.sendAlert(message, parseMode);
  } catch (error) {
    console.error("Telegram alert failed:", error);
    // Don't throw - we don't want Telegram failures to break the main functionality
  }
}
