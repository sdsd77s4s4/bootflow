import React from 'react';
import RealtimeButtonConfigurator from '@/components/RealtimeButtonConfigurator';

export default function ButtonConfigurator() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Configurador de Botão</h1>
      <p className="mb-4 text-sm text-muted-foreground">Edite classes Tailwind, rótulo e veja o preview em tempo real.</p>
      <RealtimeButtonConfigurator />
    </div>
  );
}
