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
          background: #0a0f0a;
          border: 2px solid #00e676;
          box-shadow: 0 0 18px rgba(0,230,118,0.45), 0 4px 20px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
          z-index: 9999;
          outline: none;
        }
        .fca-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 0 28px rgba(0,230,118,0.65), 0 6px 28px rgba(0,0,0,0.5);
        }
        .fca-fab:active { transform: scale(0.95); }

        /* pulsing ring */
        .fca-fab::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px solid rgba(0,230,118,0.4);
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
          width: 360px;
          height: 460px;
          border-radius: 20px;
          background: #070d07;
          border: 1px solid rgba(0,230,118,0.25);
          box-shadow:
            0 0 0 1px rgba(0,230,118,0.08),
            0 24px 64px rgba(0,0,0,0.7),
            0 0 60px rgba(0,230,118,0.06) inset;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 9998;
          transform-origin: bottom right;
        }

        .fca-panel-enter {
          animation: fca-open 0.42s cubic-bezier(.22,1,.36,1) forwards;
        }
        @keyframes fca-open {
          from { opacity: 0; transform: scale(0.8) translateY(22px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .fca-panel-exit {
          animation: fca-close 0.26s cubic-bezier(.55,0,.1,1) forwards;
        }
        @keyframes fca-close {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to   { opacity: 0; transform: scale(0.86) translateY(16px); }
        }

        /* ── HEADER ── */
        .fca-header {
          padding: 14px 16px 13px;
          background: linear-gradient(135deg, rgba(0,230,118,0.10) 0%, rgba(0,180,90,0.06) 100%);
          border-bottom: 1px solid rgba(0,230,118,0.15);
          display: flex;
          align-items: center;
          gap: 11px;
          flex-shrink: 0;
        }
        .fca-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          background: #0a1a0e;
          border: 1.5px solid rgba(0,230,118,0.4);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 17px;
          box-shadow: 0 0 12px rgba(0,230,118,0.2);
        }
        .fca-header-text { flex: 1; }
        .fca-header-title {
          color: #e8fff2;
          font-weight: 600; font-size: 13.5px;
          letter-spacing: -0.01em;
        }
        .fca-header-sub {
          color: rgba(0,230,118,0.6);
          font-size: 11px; margin-top: 2px;
          display: flex; align-items: center; gap: 5px;
        }
        .fca-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00e676; box-shadow: 0 0 6px #00e676;
          animation: fca-blink 2s ease-in-out infinite;
        }
        @keyframes fca-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

        .fca-close-btn {
          width: 28px; height: 28px; border-radius: 8px;
          border: 1px solid rgba(0,230,118,0.15);
          background: rgba(0,230,118,0.05);
          color: rgba(0,230,118,0.6);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .fca-close-btn:hover {
          background: rgba(0,230,118,0.12);
          color: #00e676;
        }

        /* ── COMING SOON BODY ── */
        .fca-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          gap: 18px;
          position: relative;
          overflow: hidden;
        }

        /* subtle background glow blob */
        .fca-body::before {
          content: '';
          position: absolute;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .fca-badge {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 99px;
          background: rgba(0,230,118,0.08);
          border: 1px solid rgba(0,230,118,0.25);
          font-size: 11.5px; font-weight: 500;
          color: #00e676; letter-spacing: 0.02em;
          animation: fca-bubble-in 0.5s 0.1s cubic-bezier(.22,1,.36,1) both;
        }
        .fca-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00e676; box-shadow: 0 0 5px #00e676;
        }

        .fca-coming-soon-title {
          font-size: 38px; font-weight: 700;
          line-height: 1.1; text-align: center;
          letter-spacing: -0.03em;
          animation: fca-bubble-in 0.5s 0.2s cubic-bezier(.22,1,.36,1) both;
        }
        .fca-coming-soon-title span:first-child { color: #e8fff2; }
        .fca-coming-soon-title span:last-child  { color: #00e676; }

        .fca-coming-soon-desc {
          font-size: 13px; line-height: 1.65;
          color: rgba(180,220,195,0.55);
          text-align: center; max-width: 270px;
          animation: fca-bubble-in 0.5s 0.3s cubic-bezier(.22,1,.36,1) both;
        }

        /* animated dashes under the title */
        .fca-dashes {
          display: flex; gap: 6px;
          animation: fca-bubble-in 0.5s 0.4s both;
        }
        .fca-dash {
          height: 3px; border-radius: 3px;
          background: #00e676;
          animation: fca-dash-pulse 2s ease-in-out infinite;
        }
        .fca-dash:nth-child(1) { width: 28px; animation-delay: 0s; }
        .fca-dash:nth-child(2) { width: 14px; animation-delay: 0.3s; }
        .fca-dash:nth-child(3) { width: 20px; animation-delay: 0.6s; }
        @keyframes fca-dash-pulse {
          0%, 100% { opacity: 0.3; transform: scaleX(1); }
          50% { opacity: 1; transform: scaleX(1.15); }
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
                <span>Coming </span>
                <span>Soon</span>
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
              <path d="M4 4l12 12M16 4L4 16" stroke="#00e676" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.03 2 11c0 2.63 1.18 5 3.08 6.67L4 22l4.55-1.51C9.62 20.82 10.79 21 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z" fill="#00e676"/>
              <circle cx="8.5" cy="11" r="1.2" fill="#070d07"/>
              <circle cx="12" cy="11" r="1.2" fill="#070d07"/>
              <circle cx="15.5" cy="11" r="1.2" fill="#070d07"/>
            </svg>
          )}
        </button>
      </div>
    </>
  );
}


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
//           background: #FF6B00;
//           border: 3px solid #ffffff;
//           box-shadow: 0 4px 20px rgba(255,107,0,0.5), 0 2px 8px rgba(0,0,0,0.12);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
//           z-index: 9999;
//           outline: none;
//         }
//         .fca-fab:hover {
//           transform: scale(1.1);
//           box-shadow: 0 6px 28px rgba(255,107,0,0.65), 0 2px 8px rgba(0,0,0,0.12);
//         }
//         .fca-fab:active { transform: scale(0.95); }

//         /* pulsing ring */
//         .fca-fab::before {
//           content: '';
//           position: absolute;
//           inset: -5px;
//           border-radius: 50%;
//           border: 2px solid rgba(255,107,0,0.4);
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
//           width: 400px;
//           height: 520px;
//           border-radius: 22px;
//           background: #ffffff;
//           border: 1px solid rgba(0,0,0,0.08);
//           box-shadow: 0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(255,107,0,0.08);
//           display: flex;
//           flex-direction: column;
//           overflow: hidden;
//           z-index: 9998;
//           transform-origin: bottom right;
//         }

//         .fca-panel-enter { animation: fca-open 0.42s cubic-bezier(.22,1,.36,1) forwards; }
//         @keyframes fca-open {
//           from { opacity: 0; transform: scale(0.8) translateY(22px); }
//           to   { opacity: 1; transform: scale(1) translateY(0); }
//         }
//         .fca-panel-exit { animation: fca-close 0.26s cubic-bezier(.55,0,.1,1) forwards; }
//         @keyframes fca-close {
//           from { opacity: 1; transform: scale(1) translateY(0); }
//           to   { opacity: 0; transform: scale(0.86) translateY(16px); }
//         }

//         /* ── HEADER ── */
//         .fca-header {
//           padding: 16px 18px 15px;
//           background: #FF6B00;
//           display: flex;
//           align-items: center;
//           gap: 12px;
//           flex-shrink: 0;
//         }
//         .fca-avatar {
//           width: 40px; height: 40px; border-radius: 12px;
//           background: rgba(255,255,255,0.18);
//           border: 1.5px solid rgba(255,255,255,0.3);
//           display: flex; align-items: center; justify-content: center;
//           flex-shrink: 0; font-size: 19px;
//         }
//         .fca-header-text { flex: 1; }
//         .fca-header-title {
//           color: #ffffff;
//           font-weight: 600; font-size: 14px;
//           letter-spacing: -0.01em;
//         }
//         .fca-header-sub {
//           color: rgba(255,255,255,0.72);
//           font-size: 11.5px; margin-top: 2px;
//           display: flex; align-items: center; gap: 5px;
//         }
//         .fca-status-dot {
//           width: 6px; height: 6px; border-radius: 50%;
//           background: #fff;
//           animation: fca-blink 2s ease-in-out infinite;
//         }
//         @keyframes fca-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

//         .fca-close-btn {
//           width: 30px; height: 30px; border-radius: 9px;
//           border: 1.5px solid rgba(255,255,255,0.3);
//           background: rgba(255,255,255,0.15);
//           color: rgba(255,255,255,0.9);
//           cursor: pointer;
//           display: flex; align-items: center; justify-content: center;
//           transition: background 0.15s;
//           flex-shrink: 0;
//         }
//         .fca-close-btn:hover { background: rgba(255,255,255,0.28); }

//         /* ── COMING SOON BODY ── */
//         .fca-body {
//           flex: 1;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           padding: 36px 28px;
//           gap: 20px;
//           position: relative;
//           overflow: hidden;
//           background: #ffffff;
//         }

//         /* very subtle orange glow in center */
//         .fca-body::before {
//           content: '';
//           position: absolute;
//           width: 280px; height: 280px;
//           border-radius: 50%;
//           background: radial-gradient(circle, rgba(255,107,0,0.05) 0%, transparent 70%);
//           top: 50%; left: 50%;
//           transform: translate(-50%, -50%);
//           pointer-events: none;
//         }

//         /* badge: dark pill so orange text reads clearly */
//         .fca-badge {
//           display: flex; align-items: center; gap: 8px;
//           padding: 7px 16px; border-radius: 99px;
//           background: #1a1a1a;
//           border: 1px solid rgba(255,107,0,0.3);
//           font-size: 11.5px; font-weight: 500;
//           color: #FF6B00; letter-spacing: 0.02em;
//           animation: fca-bubble-in 0.5s 0.1s cubic-bezier(.22,1,.36,1) both;
//           position: relative; z-index: 1;
//         }
//         .fca-badge-dot {
//           width: 6px; height: 6px; border-radius: 50%;
//           background: #FF6B00;
//           flex-shrink: 0;
//         }

//         /* title: near-black + orange — clearly separated */
//         .fca-coming-soon-title {
//           font-size: 44px; font-weight: 700;
//           line-height: 1.08; text-align: center;
//           letter-spacing: -0.03em;
//           animation: fca-bubble-in 0.5s 0.2s cubic-bezier(.22,1,.36,1) both;
//           position: relative; z-index: 1;
//         }
//         .fca-title-dark   { color: #111111; }
//         .fca-title-orange { color: #FF6B00; }

//         /* dashes */
//         .fca-dashes {
//           display: flex; gap: 6px;
//           animation: fca-bubble-in 0.5s 0.3s both;
//           position: relative; z-index: 1;
//         }
//         .fca-dash {
//           height: 3px; border-radius: 3px;
//           background: #FF6B00;
//           animation: fca-dash-pulse 2s ease-in-out infinite;
//         }
//         .fca-dash:nth-child(1) { width: 28px; animation-delay: 0s; }
//         .fca-dash:nth-child(2) { width: 14px; animation-delay: 0.3s; }
//         .fca-dash:nth-child(3) { width: 20px; animation-delay: 0.6s; }
//         @keyframes fca-dash-pulse {
//           0%, 100% { opacity: 0.3; transform: scaleX(1); }
//           50% { opacity: 1; transform: scaleX(1.15); }
//         }

//         /* desc: clear gray on white — fully readable */
//         .fca-coming-soon-desc {
//           font-size: 13.5px; line-height: 1.7;
//           color: #888888;
//           text-align: center; max-width: 290px;
//           animation: fca-bubble-in 0.5s 0.4s cubic-bezier(.22,1,.36,1) both;
//           position: relative; z-index: 1;
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
//                 <span className="fca-title-dark">Coming </span>
//                 <span className="fca-title-orange">Soon</span>
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
//               <path d="M4 4l12 12M16 4L4 16" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
//             </svg>
//           ) : (
//             <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
//               <path d="M12 2C6.48 2 2 6.03 2 11c0 2.63 1.18 5 3.08 6.67L4 22l4.55-1.51C9.62 20.82 10.79 21 12 21c5.52 0 10-4.03 10-9s-4.48-9-10-9z" fill="white"/>
//               <circle cx="8.5" cy="11" r="1.2" fill="#FF6B00"/>
//               <circle cx="12" cy="11" r="1.2" fill="#FF6B00"/>
//               <circle cx="15.5" cy="11" r="1.2" fill="#FF6B00"/>
//             </svg>
//           )}
//         </button>
//       </div>
//     </>
//   );
// }