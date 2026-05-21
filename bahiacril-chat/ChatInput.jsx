import React, { useRef, useEffect } from "react";

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22 2L11 13" stroke="#E8A98A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#E8A98A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChatInput = ({ value, onChange, onSend, disabled }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollH = textareaRef.current.scrollHeight;
      // max 4 lines ≈ 92px
      textareaRef.current.style.height = Math.min(scrollH, 92) + "px";
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div className="bc-input-row">
      <textarea
        ref={textareaRef}
        className="bc-textarea"
        placeholder="Digite sua mensagem..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        aria-label="Mensagem para o assistente Bahiacril"
      />
      <button
        className="bc-send-btn"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Enviar mensagem"
      >
        <SendIcon />
      </button>
    </div>
  );
};

export default ChatInput;
