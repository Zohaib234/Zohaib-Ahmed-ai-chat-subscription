import Logger from "../utils/logger.js";

interface OpenAIResponse {
  answer: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Mock OpenAI client - simulates API response with delay
 */
class OpenAIClient {
  private logger: Logger;
  private minDelay: number;
  private maxDelay: number;

  /**
   * Constructor
   * @param logger Logger instance
   * @param minDelay Minimum delay in ms (default 500)
   * @param maxDelay Maximum delay in ms (default 2000)
   */
  constructor(logger: Logger, minDelay = 500, maxDelay = 2000) {
    this.logger = logger.child("OpenAIClient");
    this.minDelay = minDelay;
    this.maxDelay = maxDelay;
  }

  /**
   * Simulate delay
   * @returns Promise that resolves after random delay
   */
  private async simulateDelay(): Promise<void> {
    const delay = Math.floor(Math.random() * (this.maxDelay - this.minDelay + 1)) + this.minDelay;
    this.logger.debug(`Simulating OpenAI API delay: ${delay}ms`);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Calculate mock tokens based on text length
   * @param text Text to calculate tokens for
   * @returns Estimated token count
   */
  private calculateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate mock response based on question
   * @param question User question
   * @returns Mock response
   */
  private generateMockResponse(question: string): string {
    const responses = [
      `Based on your question about "${question.slice(0, 50)}...", I can provide the following insights: This is a simulated response from the AI system. In a production environment, this would be a real response from OpenAI's API.`,
      `Thank you for your question. Here's my analysis: The topic you've asked about is quite interesting. As an AI assistant, I would typically provide detailed information about "${question.slice(0, 30)}..." but this is a mock response.`,
      `I've analyzed your query regarding "${question.slice(0, 40)}...". Here are my thoughts: This simulated response demonstrates how the chat system handles AI interactions while tracking usage and subscriptions.`,
      `Great question! Let me help you with "${question.slice(0, 35)}...". In this mock environment, I'm simulating what a real AI response would look like, complete with token tracking and quota management.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Send message to mock OpenAI API
   * @param question User question
   * @returns Mock OpenAI response with tokens
   */
  async sendMessage(question: string): Promise<OpenAIResponse> {
    this.logger.info("Sending message to OpenAI (mocked)", {
      questionLength: question.length
    });

    // Simulate API delay
    await this.simulateDelay();

    const answer = this.generateMockResponse(question);
    const promptTokens = this.calculateTokens(question);
    const completionTokens = this.calculateTokens(answer);
    const totalTokens = promptTokens + completionTokens;

    this.logger.info("OpenAI response received (mocked)", {
      promptTokens,
      completionTokens,
      totalTokens
    });

    return {
      answer,
      promptTokens,
      completionTokens,
      totalTokens
    };
  }
}

export default OpenAIClient;
