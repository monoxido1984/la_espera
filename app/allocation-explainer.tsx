export default function AllocationExplainer() {
  return (
    <section className="allocation-chapter" id="asignacion" aria-labelledby="allocation-title">
      <header>
        <p className="eyebrow">04 · El encuentro</p>
        <h2 id="allocation-title">Estar en lista no es estar en una fila.</h2>
        <p className="allocation-subtitle">El tiempo transcurrido no alcanza para explicar a quién le corresponde un órgano. Cada proceso reúne un donante, personas compatibles y reglas específicas de asignación.</p>
      </header>
      <ol className="allocation-steps">
        <li><span>01 · Compatibilidad</span><h3>Un encuentro posible.</h3><p>En renal intervienen el grupo sanguíneo y la compatibilidad inmunológica. El mismo tiempo de espera puede significar posibilidades diferentes.</p></li>
        <li><span>02 · Prioridades</span><h3>El tiempo es una parte.</h3><p>También cuentan criterios clínicos, de edad y territoriales. Cada órgano tiene sus reglas de asignación.</p></li>
        <li><span>03 · Incertidumbre</span><h3>Sin fecha de llegada.</h3><p>Los tiempos observados cuentan trasplantes que ocurrieron. No indican un puesto ni cuánto le falta a quien sigue esperando.</p></li>
      </ol>
      <details className="allocation-example"><summary>La asignación renal como ejemplo</summary><p>El tiempo en diálisis, la edad y la compatibilidad forman parte de los criterios renales. Para ordenar candidatos también hacen falta las categorías prioritarias y la información clínica actualizada de las personas compatibles. Un puntaje aislado no representa un puesto real.</p><a href="https://www.argentina.gob.ar/salud/incucai/pacientes/distribucion-renal" target="_blank" rel="noreferrer">Consultar los criterios oficiales de distribución renal ↗</a></details>
    </section>
  );
}
