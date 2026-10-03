import type { CSSProperties } from 'react';

type InternationalDonorDatum = {
  country: string;
  region: string;
  count2005: number;
  pmp2005: number;
  count2025: number;
  pmp2025: number;
};

const INTERNATIONAL_DONORS: InternationalDonorDatum[] = [
  { country: 'Argentina', region: 'América Latina', count2005: 407, pmp2005: 10.52, count2025: 955, pmp2025: 20.81 },
  { country: 'Brasil', region: 'América Latina', count2005: 1688, pmp2005: 9.06, count2025: 3983, pmp2025: 18.72 },
  { country: 'Chile', region: 'América Latina', count2005: 134, pmp2005: 8.22, count2025: 203, pmp2025: 10.20 },
  { country: 'Uruguay', region: 'América Latina', count2005: 64, pmp2005: 18.29, count2025: 61, pmp2025: 17.94 },
  { country: 'Estados Unidos', region: 'América del Norte', count2005: 7593, pmp2005: 25.46, count2025: 16553, pmp2025: 47.66 },
  { country: 'España', region: 'Europa', count2005: 1546, pmp2005: 35.87, count2025: 2547, pmp2025: 53.17 },
  { country: 'Francia', region: 'Europa', count2005: 1371, pmp2005: 22.66, count2025: 1915, pmp2025: 28.71 },
  { country: 'Reino Unido', region: 'Europa', count2005: 753, pmp2005: 12.61, count2025: 1441, pmp2025: 20.70 },
  { country: 'Japón', region: 'Asia', count2005: 91, pmp2005: 0.71, count2025: 156, pmp2025: 1.27 },
  { country: 'Corea del Sur', region: 'Asia', count2005: 91, pmp2005: 1.90, count2025: 370, pmp2025: 7.16 },
  { country: 'Australia', region: 'Oceanía', count2005: 204, pmp2005: 10.10, count2025: 557, pmp2025: 20.63 },
  { country: 'Sudáfrica', region: 'África', count2005: 74, pmp2005: 1.56, count2025: 71, pmp2025: 1.10 },
];

const MAX_PMP = 60;
const formatInteger = (value: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value);
const formatPmp = (value: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value);

export default function InternationalComparison() {
  return (
    <section className="international-comparison" aria-labelledby="international-comparison-title">
      <header className="international-comparison-header">
        <div>
          <p className="eyebrow">Una referencia internacional · 2005 y 2025</p>
          <h3 id="international-comparison-title">¿Cómo cambió Argentina frente a otros países?</h3>
        </div>
        <p>
          Argentina pasó de 10,52 a 20,81 donantes fallecidos reales por millón. La comparación muestra
          trayectorias, no posiciones: cada punto representa un año y cada línea une los dos valores del mismo país.
        </p>
      </header>

      <div className="international-selection-note">
        <strong>Por qué estos 12 países</strong>
        <p>
          Es una selección intencional, no un ranking ni una muestra del mundo. Reúne vecinos regionales,
          países de gran escala y referencias de Europa, Asia, Oceanía y África. Todos publican la misma métrica
          para 2005 y 2025, condición necesaria para comparar el cambio sin mezclar años.
        </p>
      </div>

      <div className="international-legend" aria-label="Leyenda de años">
        <span><i className="is-2005" aria-hidden="true" />2005</span>
        <span><i className="is-2025" aria-hidden="true" />2025</span>
        <small>Donantes fallecidos reales por millón de habitantes</small>
      </div>

      <div className="international-axis" aria-hidden="true">
        <span>0</span><span>15</span><span>30</span><span>45</span><span>60 PMH</span>
      </div>

      <ol className="international-list">
        {INTERNATIONAL_DONORS.map((item) => {
          const left2005 = (item.pmp2005 / MAX_PMP) * 100;
          const left2025 = (item.pmp2025 / MAX_PMP) * 100;
          const rangeStart = Math.min(left2005, left2025);
          const rangeWidth = Math.abs(left2025 - left2005);
          const isArgentina = item.country === 'Argentina';
          return (
            <li
              key={item.country}
              className={isArgentina ? 'is-argentina' : undefined}
              aria-label={`${item.country}: ${formatPmp(item.pmp2005)} por millón en 2005 y ${formatPmp(item.pmp2025)} por millón en 2025.`}
            >
              <div className="international-country">
                <strong>{item.country}</strong>
                <span>{item.region}</span>
              </div>
              <div
                className="international-track"
                style={{
                  '--international-start': `${rangeStart}%`,
                  '--international-width': `${rangeWidth}%`,
                  '--international-2005': `${left2005}%`,
                  '--international-2025': `${left2025}%`,
                } as CSSProperties}
                aria-hidden="true"
              >
                <i className="international-grid-line at-25" />
                <i className="international-grid-line at-50" />
                <i className="international-grid-line at-75" />
                <span className="international-range" />
                <span className="international-marker is-2005" />
                <span className="international-marker is-2025" />
              </div>
              <div className="international-values">
                <span><small>2005</small>{formatPmp(item.pmp2005)}</span>
                <span><small>2025</small>{formatPmp(item.pmp2025)}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <details className="international-data-table">
        <summary>Consultar conteos y tasas de los 12 países</summary>
        <div>
          <table>
            <caption>Donantes fallecidos reales (DD): cantidad y tasa por millón de habitantes.</caption>
            <thead><tr><th scope="col">País</th><th scope="col">2005</th><th scope="col">PMH 2005</th><th scope="col">2025</th><th scope="col">PMH 2025</th></tr></thead>
            <tbody>
              {INTERNATIONAL_DONORS.map((item) => (
                <tr key={item.country}>
                  <th scope="row">{item.country}</th>
                  <td>{formatInteger(item.count2005)}</td>
                  <td>{formatPmp(item.pmp2005)}</td>
                  <td>{formatInteger(item.count2025)}</td>
                  <td>{formatPmp(item.pmp2025)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="international-source-note">
        Fuente: Global Observatory on Donation and Transplantation (OMS–ONT), indicador “Actual deceased donors (DD)”.
        Un donante real fallecido es una persona fallecida de quien se recuperó al menos un órgano con fines de trasplante.
        Las tasas usan estimaciones de población de UNFPA. Consulta: 18/09/2026. El observatorio advierte que las cifras
        pueden actualizarse sin aviso; por eso se informa la fecha de consulta. El valor argentino de esta comparación
        puede diferir del publicado por INCUCAI por el denominador internacional armonizado.
        {' '}<a href="https://www.transplant-observatory.org/summary/" target="_blank" rel="noreferrer">Consultar la fuente ↗</a>
      </p>
    </section>
  );
}
