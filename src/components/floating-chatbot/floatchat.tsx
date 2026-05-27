// 'use client';

// import { useState, useRef, useEffect, useCallback } from "react";

// interface Message {
//   id: string;
//   role: "user" | "assistant";
//   content: string;
//   timestamp: Date;
// }

// const QUICK_ACTIONS = [
//   { label: "📊 Analyze My Data", prompt: "Can you help me analyze my data?" },
//   { label: "💡 Get Suggestions", prompt: "Give me some suggestions to improve." },
//   { label: "🔍 Search Help", prompt: "How do I search effectively?" },
//   { label: "⚙️ Settings Guide", prompt: "Walk me through the settings." },
// ];

// const WELCOME_MESSAGE: Message = {
//   id: "welcome",
//   role: "assistant",
//   content: "Hey there! 👋 I'm your AI assistant. Ask me anything or pick a quick action below to get started.",
//   timestamp: new Date(),
// };

// export default function FloatingChatAssistant() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [isAnimating, setIsAnimating] = useState(false);
//   const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [showActions, setShowActions] = useState(true);
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const inputRef = useRef<HTMLInputElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const handleOpen = () => {
//     setIsOpen(true);
//     setIsAnimating(true);
//     setTimeout(() => setIsAnimating(false), 600);
//     setTimeout(() => inputRef.current?.focus(), 650);
//   };

//   const handleClose = () => {
//     setIsAnimating(true);
//     setTimeout(() => {
//       setIsOpen(false);
//       setIsAnimating(false);
//     }, 300);
//   };

// //   const sendMessage = useCallback(async (text: string) => {
// //   if (!text.trim() || isLoading) return;
// //   setShowActions(false);

// //   const userMsg: Message = {
// //     id: Date.now().toString(),
// //     role: "user",
// //     content: text.trim(),
// //     timestamp: new Date(),
// //   };
// //   setMessages((prev) => [...prev, userMsg]);
// //   setInput("");
// //   setIsLoading(true);

// //   try {
// //     const history = [...messages, userMsg].map((m) => ({
// //       role: m.role,
// //       content: m.content,
// //     }));

// //     // ✅ Sirf yeh POST request — Anthropic hata diya
// //     const response = await fetch("http://127.0.0.1:8000/ask", {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({ messages: history }),
// //     });

// //     const data = await response.json();

// //     // ✅ JSON parse karo — { reply: "..." } expect kar rahe hain
// //     const replyText = data?.reply ?? "Sorry, I couldn't process that. Please try again.";

// //     setMessages((prev) => [
// //       ...prev,
// //       {
// //         id: (Date.now() + 1).toString(),
// //         role: "assistant",
// //         content: replyText,
// //         timestamp: new Date(),
// //       },
// //     ]);
// //   } catch {
// //     setMessages((prev) => [
// //       ...prev,
// //       {
// //         id: (Date.now() + 1).toString(),
// //         role: "assistant",
// //         content: "Oops! Something went wrong. Please check your connection and try again.",
// //         timestamp: new Date(),
// //       },
// //     ]);
// //   } finally {
// //     setIsLoading(false);
// //   }
// // }, [messages, isLoading]);

// const sendMessage = async (text?: string) => {
//   const query = text ?? input;

//   if (!query.trim() || isLoading) return;

//   setShowActions(false);

//   // user message add
//   const userMsg: Message = {
//     id: Date.now().toString(),
//     role: "user",
//     content: query,
//     timestamp: new Date(),
//   };

//   setMessages(prev => [...prev, userMsg]);
//   setInput("");
//   setIsLoading(true);

//   try {
//     const response = await fetch("http://localhost:8000/ask", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         query: query
//       }),
//     });

//     const data = await response.json();

//     const reply =
//       typeof data === "string"
//         ? data
//         : data?.reply || "No response";

//     // assistant message append
//     setMessages(prev => [
//       ...prev,
//       {
//         id: (Date.now() + 1).toString(),
//         role: "assistant",
//         content: reply,
//         timestamp: new Date(),
//       },
//     ]);

//   } catch {
//     setMessages(prev => [
//       ...prev,
//       {
//         id: (Date.now() + 1).toString(),
//         role: "assistant",
//         content: "Error",
//         timestamp: new Date(),
//       },
//     ]);
//   } finally {
//     setIsLoading(false);
//   }
// };

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage(input);
//     }
//   };

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

//         .fca-root * { box-sizing: border-box; font-family: 'Sora', sans-serif; }

//         .fca-fab {
//           position: fixed;
//           bottom: 28px;
//           right: 28px;
//           width: 68px;
//           height: 68px;
//           border-radius: 50px;
//           border: none;
//           cursor: none;
//           background: linear-gradient(135deg, #6ee7f7 0%, #818cf8 50%, #c084fc 100%);
//           box-shadow: 0 4px 24px rgba(129,140,248,0.45), 0 1px 4px rgba(0,0,0,0.18);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
//           z-index: 9999;
//           outline: none;
//         }
//         .fca-fab:hover {
//           transform: scale(1.08) rotate(-4deg);
//           box-shadow: 0 8px 32px rgba(129,140,248,0.55);
//         }
//         .fca-fab:active { transform: scale(0.95); }
//         .fca-fab svg { transition: transform 0.3s; }

//         .fca-fab::before {
//           content: '';
//           position: absolute;
//           inset: -4px;
//           border-radius: 50px;
//           background: linear-gradient(135deg, #6ee7f7, #818cf8, #c084fc);
//           opacity: 0;
//           animation: fca-pulse 2.8s ease-in-out infinite;
//           z-index: -1;
//         }
//         @keyframes fca-pulse {
//           0%, 100% { opacity: 0; transform: scale(1); }
//           50% { opacity: 0.35; transform: scale(1.18); }
//         }

//         .fca-panel {
//           position: fixed;
//           bottom: 96px;
//           right: 28px;
//           width: 500px;
//           height: 600px;
//           border-radius: 24px;
//           background: #0f1117;
//           border: 1px solid rgba(255,255,255,0.08);
//           box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(110,231,247,0.06);
//           display: flex;
//           flex-direction: column;
//           overflow: hidden;
//           z-index: 9998;
//           transform-origin: bottom right;
//         }

//         .fca-panel-enter {
//           animation: fca-open 0.45s cubic-bezier(.22,1,.36,1) forwards;
//         }
//         @keyframes fca-open {
//           from { opacity: 0; transform: scale(0.82) translateY(20px); }
//           to   { opacity: 1; transform: scale(1) translateY(0); }
//         }
//         .fca-panel-exit {
//           animation: fca-close 0.28s cubic-bezier(.55,0,.1,1) forwards;
//         }
//         @keyframes fca-close {
//           from { opacity: 1; transform: scale(1) translateY(0); }
//           to   { opacity: 0; transform: scale(0.88) translateY(14px); }
//         }

//         .fca-header {
//           padding: 16px 18px 14px;
//           background: linear-gradient(135deg, rgba(110,231,247,0.12) 0%, rgba(129,140,248,0.10) 50%, rgba(192,132,252,0.08) 100%);
//           border-bottom: 1px solid rgba(255,255,255,0.06);
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           flex-shrink: 0;
//         }
//         .fca-avatar {
//           width: 38px; height: 38px; border-radius: 12px;
//           background: linear-gradient(135deg, #6ee7f7, #818cf8);
//           display: flex; align-items: center; justify-content: center;
//           flex-shrink: 0; font-size: 18px;
//         }
//         .fca-header-text { flex: 1; }
//         .fca-header-title { color: #f0f4ff; font-weight: 600; font-size: 14px; line-height: 1.2; letter-spacing: -0.01em; }
//         .fca-header-sub { color: rgba(160,174,220,0.7); font-size: 11.5px; margin-top: 1px; display: flex; align-items: center; gap: 5px; }
//         .fca-status-dot {
//           width: 6px; height: 6px; border-radius: 50%;
//           background: #4ade80; box-shadow: 0 0 6px #4ade80;
//           animation: fca-blink 2s ease-in-out infinite;
//         }
//         @keyframes fca-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
//         .fca-close-btn {
//           width: 30px; height: 30px; border-radius: 9px;
//           border: 1px solid rgba(255,255,255,0.08);
//           background: rgba(255,255,255,0.05);
//           color: rgba(160,174,220,0.8);
//           cursor: none;
//           display: flex; align-items: center; justify-content: center;
//           transition: background 0.15s, color 0.15s; flex-shrink: 0;
//         }
//         .fca-close-btn:hover { background: rgba(255,255,255,0.1); color: #f0f4ff; }

//         .fca-messages {
//           flex: 1; overflow-y: auto;
//           padding: 14px 14px 8px;
//           display: flex; flex-direction: column; gap: 10px;
//           scrollbar-width: thin;
//           scrollbar-color: rgba(129,140,248,0.25) transparent;
//         }
//         .fca-messages::-webkit-scrollbar { width: 4px; }
//         .fca-messages::-webkit-scrollbar-thumb { background: rgba(129,140,248,0.3); border-radius: 4px; }

//         .fca-bubble-row {
//           display: flex; gap: 8px;
//           animation: fca-bubble-in 0.3s cubic-bezier(.22,1,.36,1) both;
//         }
//         @keyframes fca-bubble-in {
//           from { opacity: 0; transform: translateY(10px) scale(0.97); }
//           to   { opacity: 1; transform: translateY(0) scale(1); }
//         }
//         .fca-bubble-row.user { flex-direction: row-reverse; }
//         .fca-bubble-avatar {
//           width: 28px; height: 28px; border-radius: 9px;
//           display: flex; align-items: center; justify-content: center;
//           font-size: 13px; flex-shrink: 0; margin-top: 2px;
//         }
//         .fca-bubble-avatar.ai { background: linear-gradient(135deg, #6ee7f7, #818cf8); }
//         .fca-bubble-avatar.user-av { background: rgba(255,255,255,0.08); }
//         .fca-bubble {
//           max-width: 78%; padding: 9px 13px; border-radius: 14px;
//           font-size: 13px; line-height: 1.55; letter-spacing: 0.01em;
//         }
//         .fca-bubble.ai {
//           background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.07);
//           color: #d6e0ff; border-bottom-left-radius: 4px;
//         }
//         .fca-bubble.user {
//           background: linear-gradient(135deg, rgba(110,231,247,0.18), rgba(129,140,248,0.22));
//           border: 1px solid rgba(129,140,248,0.25);
//           color: #e8eeff; border-bottom-right-radius: 4px;
//         }

//         .fca-actions { padding: 6px 14px 4px; display: flex; flex-direction: column; gap: 6px; animation: fca-bubble-in 0.35s 0.15s both; }
//         .fca-actions-label { font-size: 10.5px; color: rgba(129,140,248,0.7); font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 2px; }
//         .fca-action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
//         .fca-action-btn {
//           padding: 8px 10px; border-radius: 10px;
//           border: 1px solid rgba(255,255,255,0.08);
//           background: rgba(255,255,255,0.04);
//           color: rgba(200,215,255,0.85);
//           font-size: 12px; font-family: 'Sora', sans-serif; font-weight: 500;
//           cursor: none; text-align: left;
//           transition: background 0.15s, border-color 0.15s, transform 0.15s;
//           line-height: 1.3;
//         }
//         .fca-action-btn:hover {
//           background: rgba(129,140,248,0.12);
//           border-color: rgba(129,140,248,0.3);
//           transform: translateY(-1px);
//         }

//         .fca-typing {
//           display: flex; align-items: center; gap: 4px;
//           padding: 10px 13px;
//           background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.07);
//           border-radius: 14px; border-bottom-left-radius: 4px; width: fit-content;
//         }
//         .fca-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(129,140,248,0.7); animation: fca-typing-dot 1.2s ease-in-out infinite; }
//         .fca-dot:nth-child(2) { animation-delay: 0.2s; }
//         .fca-dot:nth-child(3) { animation-delay: 0.4s; }
//         @keyframes fca-typing-dot {
//           0%, 80%, 100% { transform: scale(1); opacity: 0.5; }
//           40% { transform: scale(1.4); opacity: 1; }
//         }

//         .fca-input-area {
//           padding: 10px 14px 14px;
//           border-top: 1px solid rgba(255,255,255,0.06);
//           display: flex; gap: 8px; align-items: center;
//           flex-shrink: 0; background: rgba(255,255,255,0.02);
//         }
//         .fca-input {
//           flex: 1; background: rgba(255,255,255,0.06);
//           border: 1px solid rgba(255,255,255,0.09); border-radius: 12px;
//           padding: 9px 13px; color: #e0e8ff; font-size: 13px;
//           font-family: 'Sora', sans-serif; outline: none;
//           transition: border-color 0.2s, background 0.2s; caret-color: #818cf8;
//         }
//         .fca-input::placeholder { color: rgba(130,145,200,0.5); }
//         .fca-input:focus { border-color: rgba(129,140,248,0.4); background: rgba(255,255,255,0.08); }
//         .fca-send-btn {
//           width: 36px; height: 36px; border-radius: 11px; border: none;
//           background: linear-gradient(135deg, #818cf8, #c084fc);
//           color: white; cursor: none;
//           display: flex; align-items: center; justify-content: center;
//           transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
//           flex-shrink: 0; box-shadow: 0 2px 12px rgba(129,140,248,0.35);
//         }
//         .fca-send-btn:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 4px 18px rgba(129,140,248,0.5); }
//         .fca-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
//       `}</style>

//       <div className="fca-root">
//         {(isOpen || isAnimating) && (
//           <div
//             className={`fca-panel ${
//               isOpen && !isAnimating ? "" : isOpen ? "fca-panel-enter" : "fca-panel-exit"
//             }`}
//           >
//             <div className="fca-header">
//               <div className="fca-avatar">✦</div>
//               <div className="fca-header-text">
//                 <div className="fca-header-title">AI Assistant</div>
//                 <div className="fca-header-sub">
//                   <span className="fca-status-dot" />
//                   Online · Ready to help
//                 </div>
//               </div>
//               {/* close button — cursor-target so the crosshair snaps to it */}
//               <button className="fca-close-btn cursor-target" onClick={handleClose} aria-label="Close">
//                 <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
//                   <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
//                 </svg>
//               </button>
//             </div>

//             <div className="fca-messages">
//               {messages.map((msg) => (
//                 <div key={msg.id} className={`fca-bubble-row ${msg.role === "user" ? "user" : ""}`}>
//                   <div className={`fca-bubble-avatar ${msg.role === "user" ? "user-av" : "ai"}`}>
//                     {msg.role === "user" ? "🧑" : "✦"}
//                   </div>
//                   <div className={`fca-bubble ${msg.role === "user" ? "user" : "ai"}`}>
//                     {msg.content}
//                   </div>
//                 </div>
//               ))}

//               {isLoading && (
//                 <div className="fca-bubble-row">
//                   <div className="fca-bubble-avatar ai">✦</div>
//                   <div className="fca-typing">
//                     <div className="fca-dot" />
//                     <div className="fca-dot" />
//                     <div className="fca-dot" />
//                   </div>
//                 </div>
//               )}
//               <div ref={messagesEndRef} />
//             </div>

//             {showActions && (
//               <div className="fca-actions">
//                 <div className="fca-actions-label">Quick Actions</div>
//                 <div className="fca-action-grid">
//                   {QUICK_ACTIONS.map((a) => (
//                     <button
//                       key={a.label}
//                       className="fca-action-btn cursor-target"
//                       onClick={() => sendMessage(a.prompt)}
//                     >
//                       {a.label}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             <div className="fca-input-area">
//               <input
//                 ref={inputRef}
//                 className="fca-input"
//                 placeholder="Ask me anything…"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 disabled={isLoading}
//               />
//               <button
//                 className="fca-send-btn cursor-target"
//                 onClick={() => sendMessage()}
//                 disabled={!input.trim() || isLoading}
//                 aria-label="Send"
//               >
//                 <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//                   <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="white"/>
//                 </svg>
//               </button>
//             </div>
//           </div>
//         )}

//         {/* FAB — cursor-target so the crosshair snaps to the button */}
//         <button
//           className="fca-fab cursor-target"
//           onClick={isOpen ? handleClose : handleOpen}
//           aria-label="Open AI Assistant"
//         >
//           {isOpen ? (
//             <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
//               <path d="M4 4l12 12M16 4L4 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
//             </svg>
//           ) : (
//             <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
//               <path d="M12 2C6.48 2 2 6.03 2 11c0 2.63 1.18 5 3.08 6.67L4 22l4.55-1.51C9.62 20.82 10.79 21 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z" fill="white"/>
//               <circle cx="8.5" cy="11" r="1.2" fill="#0f1117"/>
//               <circle cx="12" cy="11" r="1.2" fill="#0f1117"/>
//               <circle cx="15.5" cy="11" r="1.2" fill="#0f1117"/>
//             </svg>
//           )}
//         </button>
//       </div>
//     </>
//   );
// }

// 'use client';

// import { useState } from "react";

// export default function FloatingChatAssistant() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [isAnimating, setIsAnimating] = useState(false);

//   const handleOpen = () => {
//     setIsOpen(true);
//     setIsAnimating(true);
//     setTimeout(() => setIsAnimating(false), 600);
//   };

//   const handleClose = () => {
//     setIsAnimating(true);
//     setTimeout(() => {
//       setIsOpen(false);
//       setIsAnimating(false);
//     }, 300);
//   };

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

//         .fca-root * { box-sizing: border-box; font-family: 'Sora', sans-serif; }

//         /* ── FAB ── */
//         .fca-fab {
//           position: fixed;
//           bottom: 28px;
//           right: 28px;
//           width: 62px;
//           height: 62px;
//           border-radius: 50%;
//           border: none;
//           cursor: pointer;
//           background: #0a0f0a;
//           border: 2px solid #00e676;
//           box-shadow: 0 0 18px rgba(0,230,118,0.45), 0 4px 20px rgba(0,0,0,0.5);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
//           z-index: 9999;
//           outline: none;
//         }
//         .fca-fab:hover {
//           transform: scale(1.1);
//           box-shadow: 0 0 28px rgba(0,230,118,0.65), 0 6px 28px rgba(0,0,0,0.5);
//         }
//         .fca-fab:active { transform: scale(0.95); }

//         /* pulsing ring */
//         .fca-fab::before {
//           content: '';
//           position: absolute;
//           inset: -5px;
//           border-radius: 50%;
//           border: 2px solid rgba(0,230,118,0.4);
//           opacity: 0;
//           animation: fca-pulse 2.5s ease-in-out infinite;
//         }
//         @keyframes fca-pulse {
//           0%, 100% { opacity: 0; transform: scale(1); }
//           50% { opacity: 1; transform: scale(1.22); }
//         }

//         /* ── PANEL ── */
//         .fca-panel {
//           position: fixed;
//           bottom: 104px;
//           right: 28px;
//           width: 360px;
//           height: 460px;
//           border-radius: 20px;
//           background: #070d07;
//           border: 1px solid rgba(0,230,118,0.25);
//           box-shadow:
//             0 0 0 1px rgba(0,230,118,0.08),
//             0 24px 64px rgba(0,0,0,0.7),
//             0 0 60px rgba(0,230,118,0.06) inset;
//           display: flex;
//           flex-direction: column;
//           overflow: hidden;
//           z-index: 9998;
//           transform-origin: bottom right;
//         }

//         .fca-panel-enter {
//           animation: fca-open 0.42s cubic-bezier(.22,1,.36,1) forwards;
//         }
//         @keyframes fca-open {
//           from { opacity: 0; transform: scale(0.8) translateY(22px); }
//           to   { opacity: 1; transform: scale(1) translateY(0); }
//         }
//         .fca-panel-exit {
//           animation: fca-close 0.26s cubic-bezier(.55,0,.1,1) forwards;
//         }
//         @keyframes fca-close {
//           from { opacity: 1; transform: scale(1) translateY(0); }
//           to   { opacity: 0; transform: scale(0.86) translateY(16px); }
//         }

//         /* ── HEADER ── */
//         .fca-header {
//           padding: 14px 16px 13px;
//           background: linear-gradient(135deg, rgba(0,230,118,0.10) 0%, rgba(0,180,90,0.06) 100%);
//           border-bottom: 1px solid rgba(0,230,118,0.15);
//           display: flex;
//           align-items: center;
//           gap: 11px;
//           flex-shrink: 0;
//         }
//         .fca-avatar {
//           width: 36px; height: 36px; border-radius: 10px;
//           background: #0a1a0e;
//           border: 1.5px solid rgba(0,230,118,0.4);
//           display: flex; align-items: center; justify-content: center;
//           flex-shrink: 0; font-size: 17px;
//           box-shadow: 0 0 12px rgba(0,230,118,0.2);
//         }
//         .fca-header-text { flex: 1; }
//         .fca-header-title {
//           color: #e8fff2;
//           font-weight: 600; font-size: 13.5px;
//           letter-spacing: -0.01em;
//         }
//         .fca-header-sub {
//           color: rgba(0,230,118,0.6);
//           font-size: 11px; margin-top: 2px;
//           display: flex; align-items: center; gap: 5px;
//         }
//         .fca-status-dot {
//           width: 6px; height: 6px; border-radius: 50%;
//           background: #00e676; box-shadow: 0 0 6px #00e676;
//           animation: fca-blink 2s ease-in-out infinite;
//         }
//         @keyframes fca-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

//         .fca-close-btn {
//           width: 28px; height: 28px; border-radius: 8px;
//           border: 1px solid rgba(0,230,118,0.15);
//           background: rgba(0,230,118,0.05);
//           color: rgba(0,230,118,0.6);
//           cursor: pointer;
//           display: flex; align-items: center; justify-content: center;
//           transition: background 0.15s, color 0.15s;
//           flex-shrink: 0;
//         }
//         .fca-close-btn:hover {
//           background: rgba(0,230,118,0.12);
//           color: #00e676;
//         }

//         /* ── COMING SOON BODY ── */
//         .fca-body {
//           flex: 1;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           padding: 32px 24px;
//           gap: 18px;
//           position: relative;
//           overflow: hidden;
//         }

//         /* subtle background glow blob */
//         .fca-body::before {
//           content: '';
//           position: absolute;
//           width: 240px; height: 240px;
//           border-radius: 50%;
//           background: radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%);
//           top: 50%; left: 50%;
//           transform: translate(-50%, -50%);
//           pointer-events: none;
//         }

//         .fca-badge {
//           display: flex; align-items: center; gap: 7px;
//           padding: 6px 14px; border-radius: 99px;
//           background: rgba(0,230,118,0.08);
//           border: 1px solid rgba(0,230,118,0.25);
//           font-size: 11.5px; font-weight: 500;
//           color: #00e676; letter-spacing: 0.02em;
//           animation: fca-bubble-in 0.5s 0.1s cubic-bezier(.22,1,.36,1) both;
//         }
//         .fca-badge-dot {
//           width: 6px; height: 6px; border-radius: 50%;
//           background: #00e676; box-shadow: 0 0 5px #00e676;
//         }

//         .fca-coming-soon-title {
//           font-size: 38px; font-weight: 700;
//           line-height: 1.1; text-align: center;
//           letter-spacing: -0.03em;
//           animation: fca-bubble-in 0.5s 0.2s cubic-bezier(.22,1,.36,1) both;
//         }
//         .fca-coming-soon-title span:first-child { color: #e8fff2; }
//         .fca-coming-soon-title span:last-child  { color: #00e676; }

//         .fca-coming-soon-desc {
//           font-size: 13px; line-height: 1.65;
//           color: rgba(180,220,195,0.55);
//           text-align: center; max-width: 270px;
//           animation: fca-bubble-in 0.5s 0.3s cubic-bezier(.22,1,.36,1) both;
//         }

//         /* animated dashes under the title */
//         .fca-dashes {
//           display: flex; gap: 6px;
//           animation: fca-bubble-in 0.5s 0.4s both;
//         }
//         .fca-dash {
//           height: 3px; border-radius: 3px;
//           background: #00e676;
//           animation: fca-dash-pulse 2s ease-in-out infinite;
//         }
//         .fca-dash:nth-child(1) { width: 28px; animation-delay: 0s; }
//         .fca-dash:nth-child(2) { width: 14px; animation-delay: 0.3s; }
//         .fca-dash:nth-child(3) { width: 20px; animation-delay: 0.6s; }
//         @keyframes fca-dash-pulse {
//           0%, 100% { opacity: 0.3; transform: scaleX(1); }
//           50% { opacity: 1; transform: scaleX(1.15); }
//         }

//         @keyframes fca-bubble-in {
//           from { opacity: 0; transform: translateY(14px) scale(0.96); }
//           to   { opacity: 1; transform: translateY(0) scale(1); }
//         }
//       `}</style>

//       <div className="fca-root">
//         {(isOpen || isAnimating) && (
//           <div
//             className={`fca-panel ${
//               isOpen && !isAnimating ? "" : isOpen ? "fca-panel-enter" : "fca-panel-exit"
//             }`}
//           >
//             {/* Header */}
//             <div className="fca-header">
//               <div className="fca-avatar">🔧</div>
//               <div className="fca-header-text">
//                 <div className="fca-header-title">AI Assistant</div>
//                 <div className="fca-header-sub">
//                   <span className="fca-status-dot" />
//                   Online · Ready to help
//                 </div>
//               </div>
//               <button className="fca-close-btn" onClick={handleClose} aria-label="Close">
//                 <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
//                   <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
//                 </svg>
//               </button>
//             </div>

//             {/* Coming Soon Body */}
//             <div className="fca-body">
//               <div className="fca-badge">
//                 <span className="fca-badge-dot" />
//                 We're building something great
//               </div>

//               <div className="fca-coming-soon-title">
//                 <span>Coming </span>
//                 <span>Soon</span>
//               </div>

//               <div className="fca-dashes">
//                 <div className="fca-dash" />
//                 <div className="fca-dash" />
//                 <div className="fca-dash" />
//               </div>

//               <p className="fca-coming-soon-desc">
//                 This feature is under construction. We're working hard to bring you the best repair experience in Nagpur. Stay tuned!
//               </p>
//             </div>
//           </div>
//         )}

//         {/* FAB */}
//         <button
//           className="fca-fab"
//           onClick={isOpen ? handleClose : handleOpen}
//           aria-label="Open AI Assistant"
//         >
//           {isOpen ? (
//             <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
//               <path d="M4 4l12 12M16 4L4 16" stroke="#00e676" strokeWidth="2.2" strokeLinecap="round"/>
//             </svg>
//           ) : (
//             <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
//               <path d="M12 2C6.48 2 2 6.03 2 11c0 2.63 1.18 5 3.08 6.67L4 22l4.55-1.51C9.62 20.82 10.79 21 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z" fill="#00e676"/>
//               <circle cx="8.5" cy="11" r="1.2" fill="#070d07"/>
//               <circle cx="12" cy="11" r="1.2" fill="#070d07"/>
//               <circle cx="15.5" cy="11" r="1.2" fill="#070d07"/>
//             </svg>
//           )}
//         </button>
//       </div>
//     </>
//   );
// }


'use client';

import { useState } from "react";

export default function FloatingChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

        .fca-root * { box-sizing: border-box; font-family: 'Sora', sans-serif; }

        /* ── FAB ── */
        .fca-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          width: 62px;
          height: 62px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          background: #FF6B00;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 20px rgba(255,107,0,0.5), 0 2px 8px rgba(0,0,0,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
          z-index: 9999;
          outline: none;
        }
        .fca-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 28px rgba(255,107,0,0.65), 0 2px 8px rgba(0,0,0,0.12);
        }
        .fca-fab:active { transform: scale(0.95); }

        /* pulsing ring */
        .fca-fab::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px solid rgba(255,107,0,0.4);
          opacity: 0;
          animation: fca-pulse 2.5s ease-in-out infinite;
        }
        @keyframes fca-pulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.22); }
        }

        /* ── PANEL ── */
        .fca-panel {
          position: fixed;
          bottom: 104px;
          right: 28px;
          width: 400px;
          height: 520px;
          border-radius: 22px;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(255,107,0,0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 9998;
          transform-origin: bottom right;
        }

        .fca-panel-enter { animation: fca-open 0.42s cubic-bezier(.22,1,.36,1) forwards; }
        @keyframes fca-open {
          from { opacity: 0; transform: scale(0.8) translateY(22px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .fca-panel-exit { animation: fca-close 0.26s cubic-bezier(.55,0,.1,1) forwards; }
        @keyframes fca-close {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to   { opacity: 0; transform: scale(0.86) translateY(16px); }
        }

        /* ── HEADER ── */
        .fca-header {
          padding: 16px 18px 15px;
          background: #FF6B00;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .fca-avatar {
          width: 40px; height: 40px; border-radius: 12px;
          background: rgba(255,255,255,0.18);
          border: 1.5px solid rgba(255,255,255,0.3);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 19px;
        }
        .fca-header-text { flex: 1; }
        .fca-header-title {
          color: #ffffff;
          font-weight: 600; font-size: 14px;
          letter-spacing: -0.01em;
        }
        .fca-header-sub {
          color: rgba(255,255,255,0.72);
          font-size: 11.5px; margin-top: 2px;
          display: flex; align-items: center; gap: 5px;
        }
        .fca-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #fff;
          animation: fca-blink 2s ease-in-out infinite;
        }
        @keyframes fca-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

        .fca-close-btn {
          width: 30px; height: 30px; border-radius: 9px;
          border: 1.5px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.9);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .fca-close-btn:hover { background: rgba(255,255,255,0.28); }

        /* ── COMING SOON BODY ── */
        .fca-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 28px;
          gap: 20px;
          position: relative;
          overflow: hidden;
          background: #ffffff;
        }

        /* very subtle orange glow in center */
        .fca-body::before {
          content: '';
          position: absolute;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        /* badge: dark pill so orange text reads clearly */
        .fca-badge {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 16px; border-radius: 99px;
          background: #1a1a1a;
          border: 1px solid rgba(255,107,0,0.3);
          font-size: 11.5px; font-weight: 500;
          color: #FF6B00; letter-spacing: 0.02em;
          animation: fca-bubble-in 0.5s 0.1s cubic-bezier(.22,1,.36,1) both;
          position: relative; z-index: 1;
        }
        .fca-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #FF6B00;
          flex-shrink: 0;
        }

        /* title: near-black + orange — clearly separated */
        .fca-coming-soon-title {
          font-size: 44px; font-weight: 700;
          line-height: 1.08; text-align: center;
          letter-spacing: -0.03em;
          animation: fca-bubble-in 0.5s 0.2s cubic-bezier(.22,1,.36,1) both;
          position: relative; z-index: 1;
        }
        .fca-title-dark   { color: #111111; }
        .fca-title-orange { color: #FF6B00; }

        /* dashes */
        .fca-dashes {
          display: flex; gap: 6px;
          animation: fca-bubble-in 0.5s 0.3s both;
          position: relative; z-index: 1;
        }
        .fca-dash {
          height: 3px; border-radius: 3px;
          background: #FF6B00;
          animation: fca-dash-pulse 2s ease-in-out infinite;
        }
        .fca-dash:nth-child(1) { width: 28px; animation-delay: 0s; }
        .fca-dash:nth-child(2) { width: 14px; animation-delay: 0.3s; }
        .fca-dash:nth-child(3) { width: 20px; animation-delay: 0.6s; }
        @keyframes fca-dash-pulse {
          0%, 100% { opacity: 0.3; transform: scaleX(1); }
          50% { opacity: 1; transform: scaleX(1.15); }
        }

        /* desc: clear gray on white — fully readable */
        .fca-coming-soon-desc {
          font-size: 13.5px; line-height: 1.7;
          color: #888888;
          text-align: center; max-width: 290px;
          animation: fca-bubble-in 0.5s 0.4s cubic-bezier(.22,1,.36,1) both;
          position: relative; z-index: 1;
        }

        @keyframes fca-bubble-in {
          from { opacity: 0; transform: translateY(14px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="fca-root">
        {(isOpen || isAnimating) && (
          <div
            className={`fca-panel ${
              isOpen && !isAnimating ? "" : isOpen ? "fca-panel-enter" : "fca-panel-exit"
            }`}
          >
            {/* Header */}
            <div className="fca-header">
              <div className="fca-avatar">🔧</div>
              <div className="fca-header-text">
                <div className="fca-header-title">AI Assistant</div>
                <div className="fca-header-sub">
                  <span className="fca-status-dot" />
                  Online · Ready to help
                </div>
              </div>
              <button className="fca-close-btn" onClick={handleClose} aria-label="Close">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Coming Soon Body */}
            <div className="fca-body">
              <div className="fca-badge">
                <span className="fca-badge-dot" />
                We're building something great
              </div>

              <div className="fca-coming-soon-title">
                <span className="fca-title-dark">Coming </span>
                <span className="fca-title-orange">Soon</span>
              </div>

              <div className="fca-dashes">
                <div className="fca-dash" />
                <div className="fca-dash" />
                <div className="fca-dash" />
              </div>

              <p className="fca-coming-soon-desc">
                This feature is under construction. We're working hard to bring you the best repair experience in Nagpur. Stay tuned!
              </p>
            </div>
          </div>
        )}

        {/* FAB */}
        <button
          className="fca-fab"
          onClick={isOpen ? handleClose : handleOpen}
          aria-label="Open AI Assistant"
        >
          {isOpen ? (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.03 2 11c0 2.63 1.18 5 3.08 6.67L4 22l4.55-1.51C9.62 20.82 10.79 21 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z" fill="white"/>
              <circle cx="8.5" cy="11" r="1.2" fill="#FF6B00"/>
              <circle cx="12" cy="11" r="1.2" fill="#FF6B00"/>
              <circle cx="15.5" cy="11" r="1.2" fill="#FF6B00"/>
            </svg>
          )}
        </button>
      </div>
    </>
  );
}