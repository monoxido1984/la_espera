// Editorial labels only: source list identifiers and statistical categories stay intact.
const names: Record<string,string> = {
  RENAL:'Riñón', HEPATICA:'Hígado', CARDIACA:'Corazón', PULMONAR:'Pulmón',
  RENOPANCREATICA:'Riñón y páncreas', HEPATORRENAL:'Hígado y riñón', HEPATORENAL:'Hígado y riñón',
  CARDIORRENAL:'Corazón y riñón', CARDIORENAL:'Corazón y riñón', CARDIOPULMONAR:'Corazón y pulmón',
  CARDIOHEPATICA:'Corazón e hígado', HEPATOPANCREATICA:'Hígado y páncreas',
  HEPATOINTESTINAL:'Hígado e intestino', PANCREATICA:'Páncreas', INTESTINAL:'Intestino',
  PANCREOINTESTINAL:'Páncreas e intestino', CORNEAS:'Córneas', ESCLERAS:'Escleras',
};
export const organLabel=(id:string,fallback:string)=>names[id]??fallback;
