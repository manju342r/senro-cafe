import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Send, Bot, User, BrainCircuit } from 'lucide-react';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface BattlecardUIProps {
  competitorId: string;
  userId: string;
}

export const BattlecardUI: React.FC<BattlecardUIProps> = ({ competitorId, userId }) => {
  const { recallMemory, saveUserPreference } = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateInitialBattlecard();
  }, [competitorId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateInitialBattlecard = async () => {
    setIsGenerating(true);
    const { competitorContext, userContext } = await recallMemory(competitorId, userId);
    
    const systemPrompt = `You are a strategic B2B competitive intelligence AI.
Generate a comprehensive battlecard for the competitor.
Strategic Evolution Context (last 6 months): ${competitorContext}
User Formatting & Industry Preferences: ${userContext}
Ensure the output aligns strictly with the user's formatting preferences.`;

    const initialMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate the latest strategic battlecard for this competitor based on recent signals.' }
    ];

    await processLLMCall(initialMessages);
  };

  const processLLMCall = async (chatMessages: Message[]) => {
    try {
      setMessages([...chatMessages, { role: 'assistant', content: '...' }]);

      setTimeout(() => {
        const aiResponse = "Here is the synthesized battlecard based on the latest competitive signals and your preference for short, bulleted summaries:\n\n" +
          "**Strengths:**\n- Enterprise pricing optimization\n- Strong new AI feature set\n\n" +
          "**Weaknesses:**\n- Complex onboarding\n- Slow DOM load times detected recently\n\n" +
          "**Strategic Shift:** Moving upmarket to target Enterprise clients.";

        setMessages([...chatMessages, { role: 'assistant', content: aiResponse }]);
        setIsGenerating(false);
      }, 1500);

    } catch (error) {
      console.error("LLM Generation error:", error);
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage = input;
    setInput('');
    setIsGenerating(true);

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    await saveUserPreference(userId, userMessage);
    await processLLMCall(newMessages);
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-line p-4 flex items-center justify-between bg-surface">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-line rounded-md">
            <BrainCircuit className="w-5 h-5 text-content" />
          </div>
          <h2 className="font-semibold text-sm text-content">AI Battlecard Agent</h2>
        </div>
        <div className="text-[10px] uppercase font-mono tracking-wider bg-line border border-line px-2 py-1 rounded text-content">
          Hindsight Active
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-canvas">
        {messages.filter(m => m.role !== 'system').map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-content text-canvas' 
                  : 'bg-surface-hover border border-line-hover text-content'
              }`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`p-4 rounded-xl ${
                msg.role === 'user' 
                  ? 'bg-content text-canvas rounded-tr-none' 
                  : 'bg-surface-hover border border-line text-content rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-surface border-t border-line">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Instruct the agent (e.g., 'Focus on enterprise pricing')"
            className="w-full bg-canvas border border-line text-sm text-content pl-4 pr-12 py-3 rounded-lg focus:outline-none focus:border-content focus:ring-1 focus:ring-content transition-all placeholder:text-muted"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 p-2 bg-brand-emerald text-inverted rounded-md hover:bg-brand-dark disabled:opacity-50 disabled:hover:bg-brand-emerald transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[11px] text-muted mt-2 text-center">
          Memory feedback continuously updates the Hindsight vector profile for this competitor.
        </p>
      </form>
    </div>
  );
};
