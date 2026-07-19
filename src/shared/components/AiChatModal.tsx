import { useState, useRef, useEffect, startTransition } from "react";
import { Textarea } from "./controls/Textarea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Modal from "./Modal";
import MarkdownRender from "./MarkdownRender";
import ThinkingSphere from "./thinkingSphere/ThinkingSphere";
import { sendChatMessage } from "../../services/aiChatService";
import type { ChatMessage } from "../../services/aiChatService";
import styles from "./AiChatModal.module.css";

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardTopic: string;
  cardContent: string;
}

const SYSTEM_PROMPT = `You are a helpful Leitnix AI. The user is studying the following flashcard content:

<card_topic>
{cardTopic}
</card_topic>

<card_content>
{cardContent}
</card_content>

You can answer questions about this card content, help explain concepts further, provide examples, or answer any other questions the user might have. Keep your answers clear and educational.`;

export default function AiChatModal({
  isOpen,
  onClose,
  cardTopic,
  cardContent,
}: AiChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelId, setModelId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      startTransition(() => {
        setMessages([]);
        setInput("");
        setLoading(false);
      });
    }
  }, [isOpen]);

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
        cardTopic,
      ).replace("{cardContent}", cardContent);

      const apiMessages: ChatMessage[] = [
        { role: "user", content: systemPrompt },
        ...updatedMessages,
      ];

      const response = await sendChatMessage(modelId, apiMessages);
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
    <Modal isOpen={isOpen} onClose={onClose} title="Leitnix AI" size="lg" bodyClassName={styles.chatBody}>
      <div className={styles.chatContainer}>
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
                  <MarkdownRender markdown={msg.content} />
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
