'use client';
import { useEffect, useRef } from 'react';

export default function DialysisDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      id="dialog-dialisis"
      className="v2-dialysis-dialog"
      aria-labelledby="v2-dialysis-modal-title"
      onCancel={onClose}
      onClose={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="v2-dialysis-bar">
        <span>Contexto renal · La espera durante la espera</span>
        <button
          type="button"
          className="v2-dialysis-close-btn"
          onClick={onClose}
          aria-label="Cerrar ventana de diálisis"
        >
          Volver a la lista de espera renal <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div className="v2-dialysis-body">
        <h3 id="v2-dialysis-modal-title">31.431 personas en diálisis</h3>
        <p className="v2-dialysis-lead">
          Estar en lista de espera renal —o aguardar los estudios pre-trasplante para ingresar a ella— implica, en la enorme mayoría de los casos, sostener la vida mediante diálisis. Al cierre de 2025, 31.431 pacientes recibían tratamiento crónico en Argentina: más de cinco veces el tamaño de la lista de espera renal activa.
        </p>

        <div className="v2-dialysis-time-card">
          <h4>¿Cuánto tiempo de vida absorbe el tratamiento?</h4>
          <p>
            En un esquema estándar de hemodiálisis (3 sesiones por semana de 4 horas cada una, durante las 52 semanas del año), una persona pasa 624 horas anuales conectada al equipo, sin contar los traslados ni el tiempo de recuperación física tras cada sesión. Equivalen a 26 días completos del año dedicados exclusivamente a filtrar la sangre.
          </p>
          <div className="v2-dialysis-metrics-row">
            <div className="v2-dialysis-metric-box">
              <strong>156</strong>
              <span>sesiones al año</span>
            </div>
            <div className="v2-dialysis-metric-box">
              <strong>624 h</strong>
              <span>conectada al equipo</span>
            </div>
            <div className="v2-dialysis-metric-box">
              <strong>26 días</strong>
              <span>completos de vida</span>
            </div>
          </div>
        </div>

        <p className="v2-dialysis-footer">
          Fuente: CRESI (SINTRA · INCUCAI), prevalencia en diálisis (Total IRCT) al 31/12/2025. Podés filtrar esta población por provincia.
        </p>
      </div>
    </dialog>
  );
}
