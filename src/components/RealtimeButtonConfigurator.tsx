import React, { useState } from "react";

const GoogleSvg = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
  </svg>
);

export default function RealtimeButtonConfigurator() {
  const defaultClasses =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:w-4 [&_svg]:h-4 [&_svg]:mr-2 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 w-full h-11 mt-6";

  const [label, setLabel] = useState("Entrar com Google");
  const [classes, setClasses] = useState(defaultClasses);
  const [disabled, setDisabled] = useState(false);
  const [fullWidth, setFullWidth] = useState(true);

  const previewClassName = classes + (fullWidth ? "" : " inline-auto w-auto");

  const getButtonHtml = () => {
    // returns HTML string the user can paste
    return `<button class="${classes}" type="button" ${disabled ? "disabled" : ""}>${getSvgString()}${escapeHtml(
      label
    )}</button>`;
  };

  function getSvgString() {
    return `<!-- Google icon -->\n<svg class=\"w-4 h-4 mr-2\" viewBox=\"0 0 24 24\">` +
      `\n  <path d=\"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z\" fill=\"#4285F4\"></path>` +
      `\n  <path d=\"M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z\" fill=\"#34A853\"></path>` +
      `\n  <path d=\"M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z\" fill=\"#FBBC05\"></path>` +
      `\n  <path d=\"M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z\" fill=\"#EA4335\"></path>` +
      `\n</svg>`;
  }

  function escapeHtml(str: string) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  async function copyMarkup() {
    try {
      await navigator.clipboard.writeText(getButtonHtml());
      alert("Markup copiado para a área de transferência");
    } catch (err) {
      alert("Falha ao copiar. Abra as devtools e copie manualmente:\n" + getButtonHtml());
    }
  }

  return (
    <div className="p-4 bg-muted rounded-md">
      <h3 className="text-lg font-semibold mb-3">Configurador de Botão (live)</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Rótulo</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 rounded border"
          />

          <label className="block text-sm font-medium mt-3 mb-1">Classes (Tailwind)</label>
          <textarea
            value={classes}
            onChange={(e) => setClasses(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded border font-mono text-xs"
          />

          <div className="flex items-center gap-3 mt-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
              <span className="text-sm">Disabled</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={fullWidth} onChange={(e) => setFullWidth(e.target.checked)} />
              <span className="text-sm">Width full</span>
            </label>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={copyMarkup} className="px-3 py-2 rounded bg-primary text-white">
              Copiar markup
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Preview</label>
          <div className="p-4 bg-white rounded border">
            <button className={previewClassName} type="button" disabled={disabled} aria-disabled={disabled}>
              <GoogleSvg />
              {label}
            </button>
          </div>

          <label className="block text-sm font-medium mt-3 mb-1">HTML gerado</label>
          <pre className="p-2 rounded bg-neutral-50 text-xs overflow-auto border">{getButtonHtml()}</pre>
        </div>
      </div>
    </div>
  );
}
