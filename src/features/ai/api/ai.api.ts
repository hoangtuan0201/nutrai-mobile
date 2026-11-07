import { apiClient } from '../../../lib/api';
import {
  AiAssistantContextResponse,
  ConversationSummary,
  SendChatMessagePayload,
  SendChatResponse,
} from '../types';

export const aiApi = {
  /**
   * Fetch today's nutrition context card data + active conversation history
   */
  async getAssistantContext(): Promise<AiAssistantContextResponse> {
    const response = await apiClient.get<AiAssistantContextResponse>('/ai/assistant/context');
    return response.data;
  },

  /**
   * Send a chat message to NutraAI Nutrition Assistant (Hybrid Direct Context + Tool Calling)
   */
  async sendChatMessage(payload: SendChatMessagePayload): Promise<SendChatResponse> {
    const response = await apiClient.post<SendChatResponse>('/ai/assistant/chat', payload);
    return response.data;
  },

  /**
   * Start a fresh conversation session
   */
  async startNewConversation(): Promise<AiAssistantContextResponse> {
    const response = await apiClient.post<AiAssistantContextResponse>(
      '/ai/assistant/conversations/new',
    );
    return response.data;
  },

  /**
   * List past conversations for the History drawer
   */
  async listConversations(): Promise<ConversationSummary[]> {
    const response = await apiClient.get<ConversationSummary[]>('/ai/assistant/conversations');
    return response.data;
  },

  /**
   * Re-open a past conversation (becomes the active session)
   */
  async openConversation(conversationId: string): Promise<AiAssistantContextResponse> {
    const response = await apiClient.get<AiAssistantContextResponse>(
      `/ai/assistant/conversations/${conversationId}`,
    );
    return response.data;
  },
};
