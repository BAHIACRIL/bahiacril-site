import React from "react";

const BotAvatar = () => (
  <div
    style={{
      width: 32,
      height: 32,
      minWidth: 32,
      background: "#1E2D40",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg width="18" height="18" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="32" height="32" rx="3" stroke="#E8A98A" strokeWidth="2.2" fill="none" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="Cormorant Garamond, serif" fontSize="18" fontWeight="600" fill="#E8A98A">
        BC
      </text>
    </svg>
  </div>
);

const TypingIndicator = () => (
  <div className="bc-msg bc-msg--bot">
    <BotAvatar />
    <div className="bc-bubble bc-bubble--bot">
      <div className="bc-typing" aria-label="Assistente digitando">
        <span /><span /><span />
      </div>
    </div>
  </div>
);

const ChatMessage = ({ message, isTyping }) => {
  if (isTyping) return <TypingIndicator />;

  const isBot = message.role === "assistant";

  return (
    <div className={`bc-msg ${isBot ? "bc-msg--bot" : "bc-msg--user"}`}>
      {isBot && <BotAvatar />}
      <div className={`bc-bubble ${isBot ? "bc-bubble--bot" : "bc-bubble--user"}`}>
        {message.content}
      </div>
    </div>
  );
};

export default ChatMessage;
