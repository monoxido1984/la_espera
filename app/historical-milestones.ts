export type Milestone = {
  id: string;
  year: number;
  type: string;
  title: string;
  body: string;
  reading: string;
  sources: Array<{ label: string; href: string }>;
};

export const MILESTONES: Milestone[] = [
  {
    id: 'law-26066',
    year: 2005,
    type: 'Ley nacional',
    title: 'Ley 26.066: donante presunto',
    body: 'Modificó la Ley 24.193 y estableció la ablación en personas capaces mayores de 18 años que no hubieran dejado constancia expresa de oposición. Fue sancionada el 30 de noviembre de 2005 y publicada el 22 de diciembre.',
    reading: 'Es el punto de partida normativo de esta serie. El marcador no atribuye a la ley los cambios posteriores: permite leerlos dentro de su contexto regulatorio.',
    sources: [
      { label: 'Ley 26.066', href: 'https://www.argentina.gob.ar/normativa/nacional/ley-26066-112375' },
    ],
  },
  {
    id: 'awareness-hospital',
    year: 2013,
    type: 'Ley y estrategia hospitalaria',
    title: 'Conciencia pública y Hospital Donante',
    body: 'La Ley 26.845 promovió acciones educativas sobre la relevancia social de la donación. Ese mismo año, la Resolución 229/13 plasmó la estrategia Hospital Donante para involucrar a los equipos hospitalarios en la procuración.',
    reading: 'Son dos intervenciones distintas —una educativa y otra organizativa— reunidas en un mismo año. No deben leerse como una única política ni como causa directa de la variación anual.',
    sources: [
      { label: 'Ley 26.845', href: 'https://www.argentina.gob.ar/normativa/nacional/ley-26845-211064' },
      { label: 'Estrategias INCUCAI', href: 'https://www.argentina.gob.ar/salud/incucai/comunidad-hospitalaria/estrategias-y-programas' },
    ],
  },
  {
    id: 'ley-justina',
    year: 2018,
    type: 'Ley nacional',
    title: 'Ley 27.447, conocida como Ley Justina',
    body: 'Entró en vigencia el 3 de agosto de 2018. Reguló la obtención y utilización de órganos, tejidos y células, mantuvo el principio de donante presunto e incorporó servicios de procuración en establecimientos con terapia intensiva.',
    reading: 'El aumento de donantes continúa en 2019. La cercanía temporal es visible, pero la gráfica no separa el efecto de la ley de otros cambios institucionales o sociales.',
    sources: [
      { label: 'Nueva Ley de Donación y Trasplante', href: 'https://www.argentina.gob.ar/salud/incucai/nueva-ley-de-doncacion-y-trasplante' },
    ],
  },
  {
    id: 'pandemic',
    year: 2020,
    type: 'Contexto sanitario',
    title: 'Pandemia de COVID-19',
    body: 'La Memoria 2020 del INCUCAI documenta el impacto de la pandemia sobre la donación y el trasplante. También registra protocolos y medidas para sostener la operatividad del sistema durante la emergencia.',
    reading: 'La caída de donantes en 2020 coincide con este contexto excepcional. Existe respaldo institucional para vincular la disrupción con la pandemia, sin reducir toda la variación a una sola causa.',
    sources: [
      { label: 'Memoria INCUCAI 2020', href: 'https://www.argentina.gob.ar/sites/default/files/bancos/2021-12/memoria-incucai-2020.pdf' },
    ],
  },
  {
    id: 'procurar',
    year: 2022,
    type: 'Programa nacional',
    title: 'Programa PROCURAR',
    body: 'Aprobado por la Resolución 3685/22, promovió Unidades Hospitalarias de Procuración de Órganos y Tejidos con asistencia técnica y financiera para establecimientos seleccionados.',
    reading: 'El programa profundiza el modelo intrahospitalario. La recuperación posterior se muestra como evolución observada, no como una estimación del impacto del programa.',
    sources: [
      { label: 'Programa PROCURAR', href: 'https://www.argentina.gob.ar/salud/incucai/comunidad-hospitalaria/programa-procurar' },
    ],
  },
];
