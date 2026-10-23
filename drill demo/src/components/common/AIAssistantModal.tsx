import React, { useState } from 'react';
import { useDisaster } from '../../state/DisasterContext';
import { Bot, Send, X, Sparkles, AlertCircle, HelpCircle, Shield, LifeBuoy } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AIAssistantModal: React.FC = () => {
  const { isAiAssistantOpen, setIsAiAssistantOpen } = useDisaster();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Namaste! I am your DisasterShield AI Preparedness Assistant. How can I assist you with safety protocols, shelter finding, or reporting emergencies today?',
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickPills = [
    'How do I report a flash flood?',
    'What should be in an emergency kit?',
    'How do I find a relief shelter?',
    'How do I purify drinking water?',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (lower.includes('report') || lower.includes('emergency')) {
        reply =
          'To report an emergency, switch to the Citizen Portal and click "Report an Emergency". Provide the exact location, type of incident (e.g. Flash Flood, Trapped Persons), and severity. Your report enters the Authority Verification Queue immediately.';
      } else if (lower.includes('kit') || lower.includes('checklist') || lower.includes('preparedness')) {
        reply =
          'Essential Indian disaster preparedness kit items include:\n• 3 days of potable water (3L/person/day)\n• Non-perishable food (parched rice, jaggery, biscuits)\n• Torch with extra batteries and power bank\n• Waterproof pouch for Aadhaar/property papers\n• Emergency whistle and First Aid Kit.';
      } else if (lower.includes('shelter') || lower.includes('safe')) {
        reply =
          'Visit the "Find Safe Shelter" action card under Citizen Portal. You will see registered model schools, community halls, and indoor stadiums along with their live occupancy, facilities, and contact details.';
      } else if (lower.includes('water') || lower.includes('purif')) {
        reply =
          'During flood conditions, water sources are frequently contaminated. Boil all water vigorously for at least 10 minutes. If boiling is impossible, use chlorine purification tablets (halazone) or filter through a clean cloth followed by certified alum sedimentation.';
      } else if (lower.includes('authority') || lower.includes('verify')) {
        reply =
          'Authority personnel use the Verification Queue to review community-submitted incidents before confirming them as official disaster coordinates. This prevents misinformation and duplicate deployment.';
      } else {
        reply =
          'I am here to guide you through disaster preparedness, evacuation procedures, and platform navigation. Remember: For life-threatening emergencies requiring immediate NDRF, SDRF, or Police rescue, please dial 112 directly.';
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Bottom-Right Entry Point Button */}
      <button
        onClick={() => setIsAiAssistantOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 bg-[#1B4332] hover:bg-[#245740] text-white px-4 py-2.5 rounded-full shadow-xl border border-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 group"
        aria-label="Ask DisasterShield AI"
      >
        <div className="relative">
          <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-300 ring-2 ring-[#1B4332]" />
        </div>
        <div className="text-left hidden sm:block">
          <span className="block text-xs font-bold leading-tight">Ask DisasterShield AI</span>
          <span className="block text-[10px] text-emerald-200/80">Safety & Platform Guide</span>
        </div>
      </button>

      {/* Assistant Modal / Dialog */}
      {isAiAssistantOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg h-[580px] max-h-[90vh] shadow-2xl border border-emerald-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="bg-[#1B4332] px-4 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">DisasterShield AI Assistant</h3>
                    <span className="text-[10px] bg-emerald-800 border border-emerald-700 text-emerald-200 px-1.5 py-0.2 rounded font-mono">
                      Safe Guide
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80">Preparedness, Navigation & Safety Protocols</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiAssistantOpen(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Disclaimer Banner */}
            <div className="bg-amber-50 px-3.5 py-2 border-b border-amber-200 flex items-center gap-2 text-[11px] text-amber-900">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>Notice:</strong> This AI assistant provides informational guidance only. In immediate danger, call <strong>112</strong>.
              </span>
            </div>

            {/* Message History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[#1B4332] text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs whitespace-pre-line'
                    }`}
                  >
                    {m.text}
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        m.sender === 'user' ? 'text-emerald-200/70' : 'text-slate-400'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Question Pills */}
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px]">
              {quickPills.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(pill)}
                  className="whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 px-2.5 py-1 rounded-full text-[11px] transition"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about disaster safety, shelters, or reporting..."
                className="flex-1 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden transition"
              />
              <button
                onClick={() => handleSend()}
                className="bg-[#1B4332] hover:bg-[#245740] text-white px-3.5 py-2 rounded-xl flex items-center justify-center transition shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
