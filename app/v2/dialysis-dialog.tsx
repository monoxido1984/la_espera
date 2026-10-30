'use client';
import { useEffect, useRef } from 'react';
import dialysis from '../dialysis-population-2025.generated.json';
import {decimal,integer} from './universe-model';
import {DAYS_PER_YEAR} from './time-scale-model';

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
        <span>Foco renal · El tiempo en diálisis</span>
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
        <h3 id="v2-dialysis-modal-title">Esperar, antes de esperar.</h3>
        <p className="v2-dialysis-population"><strong>{integer(dialysis.count)}</strong><span>personas en diálisis al cierre de 2025</span></p>
        <p className="v2-dialysis-lead">
          Esta población es distinta de la lista renal seleccionada. El cálculo traduce un escenario anual de tratamiento a horas; no mide cuánto esperó cada paciente.
        </p>

        <div className="v2-dialysis-time-card">
          <h4>¿Cuánto tiempo de vida absorbe el tratamiento?</h4>
          <p>
            Un escenario ilustrativo de hemodiálisis de 3 sesiones semanales de 4 horas, durante 52 semanas, supone 624 horas al año conectada al equipo: 26 días completos. No incluye traslados ni tiempo de recuperación.
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

        <p className="v2-dialysis-collective"><strong>Del tiempo de una persona al conjunto</strong><br/>624 horas × {integer(dialysis.count)} personas = {integer(624*dialysis.count)} horas-persona. Equivalen a unos <strong>{decimal(624*dialysis.count/24/DAYS_PER_YEAR/100)} siglos</strong> en sesiones dentro de un año ilustrativo; no son siglos de espera clínica observada.</p>
        <p className="v2-dialysis-footer">
          Fuente: CRESI (SINTRA · INCUCAI), prevalencia en diálisis (Total IRCT) al 31/12/2025. Las 3 sesiones semanales de 4 horas son un supuesto del escenario, no una media estimada con estos registros.
        </p>
      </div>
    </dialog>
  );
}
