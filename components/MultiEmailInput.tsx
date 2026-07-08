'use client';

import { useState } from 'react';

interface MultiEmailInputProps {
  correos: string[];
  onChange: (correos: string[]) => void;
}

export function MultiEmailInput({ correos, onChange }: MultiEmailInputProps) {
  const [input, setInput] = useState('');

  const agregarCorreo = () => {
    if (input.trim() && input.includes('@')) {
      onChange([...correos, input.trim()]);
      setInput('');
    }
  };

  const eliminarCorreo = (index: number) => {
    onChange(correos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Mi correo</label>
      <div className="flex gap-2 mb-2">
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && agregarCorreo()}
          placeholder="correo@empresa.com"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <button
          onClick={agregarCorreo}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          +
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {correos.map((correo, idx) => (
          <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1">
            {correo}
            <button onClick={() => eliminarCorreo(idx)} className="text-red-500 font-bold">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}