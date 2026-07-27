import { useState, useRef, useEffect, startTransition, memo } from "react";
import { Textarea } from "./controls/Textarea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Modal from "./Modal";
import MarkdownRender from "./MarkdownRender";
import ThinkingSphere from "./thinkingSphere/ThinkingSphere";
import { sendChatMessageWithTools } from "../../services/aiChatService";
import type { ChatMessage, ToolCallConfig } from "../../services/aiChatService";
import { cardRepository } from "../../repositories/CardRepository";
import type { Card } from "../../db/entities";
import type OpenAI from 'openai';
import nixLogo from "../../assets/images/nix-logo.png";
import styles from "./AiChatModal.module.css";

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId?: string;
  cardTopic: string;
  cardContent: string;
  onContentChange?: (topic: string, content: string) => void;
}

const SYSTEM_PROMPT = `You are a helpful Leitnix AI assistant helping the user study a flashcard.

CURRENT CARD TOPIC:
{cardTopic}

CURRENT CARD CONTENT:
{cardContent}

You have two tools:
1. \`get_card_content\` — reads the current card topic and content
2. \`update_card_content\` — updates the card topic and/or content

IMPORTANT: Whenever the user asks you to modify, improve, rewrite, rephrase, fix, or change the card in any way, you MUST use the \`update_card_content\` tool. Do NOT just respond with the edited text — the card will NOT change unless you call the tool.

Steps when asked to edit:
1. Read the current content (or use what's shown above)
2. Make the changes the user requested
 3. Call \`update_card_content\` with the new topic and/or markdownContent
4. Then confirm what you changed

Raw HTML (YouTube iframes, etc.) is allowed in card content.`;

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_card_content",
      description: "Get the current flashcard's full markdown content and topic.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_card_content",
      description: "Update the markdown content and/or topic of the current flashcard. Both parameters are optional — only provided fields will be changed. Raw HTML (YouTube iframe embeds, etc.) is allowed in the markdown.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "New topic/title",
          },
          markdownContent: {
            type: "string",
            description: "New card content in markdown",
          },
        },
      },
    },
  },
];

const ChatMessagesList = memo(function ChatMessagesList({
  messages,
  loading,
}: {
  messages: ChatMessage[];
  loading: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={styles.messagesList}>
      {messages.length === 0 && (
        <div className={styles.emptyState}>
          Ask a question about this card or anything else you'd like help
          with.
        </div>
      )}
      {messages.map((msg, i) => (
        <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
          <div className={styles.messageBubble}>
            {msg.role === "assistant" ? (
              <MarkdownRender markdown={msg.content} isDisableGlobalTranslate isShowTranslationControl={false} isShowReadBadge={false} />
            ) : (
              msg.content
            )}
          </div>
        </div>
      ))}
      {loading && (
        <div className={`${styles.message} ${styles.assistant}`}>
          <div className={styles.messageBubble}>
            <div className={styles.thinkingDots}>
              <span className={styles.dot}><ThinkingSphere size={30} /></span>
              <span className={styles.dot}><ThinkingSphere size={30} /></span>
              <span className={styles.dot}><ThinkingSphere size={30} /></span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default function AiChatModal({
  isOpen,
  onClose,
  cardId,
  cardTopic,
  cardContent,
  onContentChange,
}: AiChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelId, setModelId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cardDataRef = useRef({ topic: cardTopic, content: cardContent });

  useEffect(() => {
    cardDataRef.current = { topic: cardTopic, content: cardContent };
  }, [cardTopic, cardContent]);

  useEffect(() => {
    if (isOpen) {
      import("../../repositories/AiModelRepository").then(
        ({ aiModelRepository }) => {
          aiModelRepository.getAll().then((models) => {
            if (models.length > 0) {
              setModelId(models[0].Id);
            }
          });
        },
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      startTransition(() => {
        setMessages([]);
        setInput("");
        setLoading(false);
      });
    }
  }, [isOpen]);

  const executeTool: ToolCallConfig["executeTool"] = async (name, args) => {
    switch (name) {
      case "get_card_content":
        return JSON.stringify({
          topic: cardDataRef.current.topic,
          markdownContent: cardDataRef.current.content,
        });

      case "update_card_content": {
        const newTopic = (args.topic as string | undefined) ?? cardDataRef.current.topic;
        const newContent = (args.markdownContent as string | undefined) ?? cardDataRef.current.content;

        if (cardId) {
          await cardRepository.update({
            Id: cardId,
            Topic: newTopic,
            MarkdownContent: newContent,
          } as Card);
        }

        cardDataRef.current = { topic: newTopic, content: newContent };
        onContentChange?.(newTopic, newContent);

        return JSON.stringify({ success: true });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !modelId) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const systemPrompt = SYSTEM_PROMPT.replace(
        "{cardTopic}",
        cardDataRef.current.topic,
      ).replace("{cardContent}", cardDataRef.current.content);

      const apiMessages: ChatMessage[] = [
        { role: "user", content: systemPrompt },
        ...updatedMessages,
      ];

      const response = await sendChatMessageWithTools(modelId, apiMessages, {
        tools,
        executeTool,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<img style={{ display: "block", height: "2.5rem", width: "auto" }} src={nixLogo} alt="Nix" />} size="lg" bodyClassName={styles.chatBody}>
      <div className={styles.chatContainer}>
        <ChatMessagesList messages={messages} loading={loading} />

        <div className={styles.inputArea}>
          <Textarea
            ref={inputRef}
            className={styles.chatInput}
            containerClassName={styles.chatInputWrapper}
            value={input}
            onChange={(v) => setInput(v)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows={1}
            disabled={loading || !modelId}
          />
          <button
            className={styles.sendButton}
            onClick={handleSend}
            disabled={loading || !input.trim() || !modelId}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
