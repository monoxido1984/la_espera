export default function AllocationExplainer() {
  return (
    <section className="allocation-chapter" id="asignacion" aria-labelledby="allocation-title">
      <header>
        <p className="eyebrow">Pregunta 4 · ¿Por qué se espera?</p>
        <h2 id="allocation-title">Estar en lista no es estar en una fila.</h2>
        <p className="allocation-subtitle">El tiempo transcurrido no alcanza para explicar a quién le corresponde un órgano. Cada proceso reúne un donante, personas compatibles y reglas específicas de asignación.</p>
      </header>
      <ol className="allocation-steps">
        <li><span>01 · La compatibilidad</span><h3>Un órgano no es para cualquiera.</h3><p>En la asignación renal, por ejemplo, intervienen el grupo sanguíneo y la compatibilidad inmunológica. Dos personas que llevan el mismo tiempo esperando pueden encontrarse ante posibilidades diferentes.</p></li>
        <li><span>02 · Las prioridades</span><h3>La antigüedad es una parte.</h3><p>También intervienen criterios clínicos, de edad y territoriales. Las reglas dependen del órgano; no existe una única fila que avance igual para todos.</p></li>
        <li><span>03 · Cada proceso</span><h3>La espera no tiene fecha de llegada.</h3><p>Los tiempos que vimos cuentan lo que ocurrió entre quienes recibieron un trasplante. No indican un puesto ni permiten calcular cuánto le falta a una persona que sigue esperando.</p></li>
      </ol>
      <details className="allocation-example"><summary>La asignación renal como ejemplo</summary><p>El tiempo en diálisis, la edad y la compatibilidad forman parte de los criterios renales. Para ordenar candidatos también hacen falta las categorías prioritarias y la información clínica actualizada de las personas compatibles. Un puntaje aislado no representa un puesto real.</p><a href="https://www.argentina.gob.ar/salud/incucai/pacientes/distribucion-renal" target="_blank" rel="noreferrer">Consultar los criterios oficiales de distribución renal ↗</a></details>
    </section>
  );
}
