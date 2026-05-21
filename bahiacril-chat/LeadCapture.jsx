import React, { useState } from "react";

const Field = ({ label, id, value, onChange, placeholder, type = "text" }) => (
  <div className="bc-field">
    <label className="bc-field-label" htmlFor={id}>{label}</label>
    <input
      id={id}
      type={type}
      className="bc-field-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
    />
  </div>
);

const LeadCapture = ({ onSubmit, onClose }) => {
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [project, setProject] = useState("");
  const [dims, setDims]       = useState("");

  const whatsappNumber = "5571999999999";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const summary = `Nome: ${name}\nWhatsApp: ${phone}\nProjeto: ${project}\nDimensões: ${dims}`;
    const waText = encodeURIComponent(
      `Olá! Vim pelo site da Bahiacril.\n\n${summary}`
    );
    const waURL = `https://wa.me/${whatsappNumber}?text=${waText}`;

    onSubmit({ name, phone, project, dims, waURL, summary });
  };

  const canSubmit = name.trim() && phone.trim();

  return (
    <div className="bc-lead-card" role="region" aria-label="Formulário de pré-orçamento">
      <div className="bc-lead-header">
        <span className="bc-lead-icon" aria-hidden="true">📐</span>
        <span className="bc-lead-title">Pré-Orçamento Bahiacril</span>
        <button
          className="bc-lead-close"
          onClick={onClose}
          aria-label="Fechar formulário"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bc-lead-form" noValidate>
        <Field
          label="Seu nome *"
          id="bc-lead-name"
          value={name}
          onChange={setName}
          placeholder="Como prefere ser chamado(a)?"
        />
        <Field
          label="WhatsApp *"
          id="bc-lead-phone"
          value={phone}
          onChange={setPhone}
          placeholder="(71) 9 0000-0000"
          type="tel"
        />
        <Field
          label="Descreva o projeto"
          id="bc-lead-project"
          value={project}
          onChange={setProject}
          placeholder="Ex: organizador de banheiro com 3 divisórias"
        />
        <Field
          label="Dimensões (L × A × P em cm)"
          id="bc-lead-dims"
          value={dims}
          onChange={setDims}
          placeholder="Ex: 40 × 15 × 10 cm"
        />

        <button
          type="submit"
          className="bc-lead-submit"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
        >
          Enviar para equipe →
        </button>
      </form>
    </div>
  );
};

export default LeadCapture;
