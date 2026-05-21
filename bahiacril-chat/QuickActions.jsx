import React from "react";

const actions = [
  { id: "catalog",   emoji: "🛍",  label: "Ver Catálogo" },
  { id: "custom",    emoji: "📐",  label: "Projeto Sob Medida" },
  { id: "help",      emoji: "💡",  label: "Me ajude a escolher" },
  { id: "architect", emoji: "🏢",  label: "Sou arquiteto/designer" },
];

const QuickActions = ({ onSelect }) => (
  <div className="bc-quick-actions" role="group" aria-label="Ações rápidas">
    {actions.map((a) => (
      <button
        key={a.id}
        className="bc-quick-btn"
        onClick={() => onSelect(a.label)}
        aria-label={a.label}
      >
        <span aria-hidden="true">{a.emoji}</span> {a.label}
      </button>
    ))}
  </div>
);

export default QuickActions;
