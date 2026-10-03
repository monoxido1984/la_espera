export type MarginDatum = {
  label: string;
  value: number;
  pmh?: number;
  color?: string;
};

export type DonorDatum = MarginDatum & {
  organDonors: number;
  organPmh: number;
  tissueDonors: number;
  tissuePmh: number;
};

export type TransplantTypeDatum = {
  id: string;
  label: string;
  total: number;
  pmh: number;
  province: MarginDatum[];
  sex: MarginDatum[];
  age: MarginDatum[];
};

export type TransplantSnapshot = {
  snapshotDate: string;
  periodLabel: string;
  total: number;
  pmh: number;
  organTotal: number;
  corneaTotal: number;
  tissueTotal: number;
  byType: TransplantTypeDatum[];
  sourceScope: string;
  pmhMethod: string;
};

export type WaitTimeProvinceSnapshot = {
  snapshotDate: string;
  periodLabel: string;
  sourceScope: string;
  byList: Array<{
    id: string;
    national: {
      recipients: number;
      avgMonths: number;
    };
    province: Array<{
      label: string;
      recipients: number;
      avgMonths: number;
    }>;
  }>;
};

export type ProvinceDatum = MarginDatum & {
  stock?: number;
  stockPmh?: number;
};

export type AnnualDatum = {
  year: number;
  totalWait: number;
  renalWait: number;
  renalTx: number;
  renalAvgWaitMonths: number;
  renalMedianWaitMonths: number;
  partial: boolean;
};

export type StoryData = {
  generatedAt: string;
  annual: AnnualDatum[];
  partialAnnual?: AnnualDatum;
  currentWaiting: MarginDatum[];
  currentSnapshot: {
    snapshotDate?: string;
    population?: number;
    totalPmh?: number;
    renalSex: MarginDatum[];
    renalAge: MarginDatum[];
    renalSeniority: MarginDatum[];
    renalProvince?: MarginDatum[];
    byList?: Array<{
      id: string;
      label: string;
      total: number;
      pmh?: number;
      province: MarginDatum[];
      age: MarginDatum[];
      sex: MarginDatum[];
      seniority: MarginDatum[];
      provinceProfiles?: Record<string, {
        age: MarginDatum[];
        sex: MarginDatum[];
      }>;
      seniorityByProvince?: Array<{
        province: string;
        items: MarginDatum[];
      }>;
    }>;
  };
  donorSnapshot?: {
    snapshotDate: string;
    periodLabel: string;
    total: number;
    pmh: number;
    publishedTotal: number;
    foreignTotal: number;
    province: DonorDatum[];
    sourceScope: string;
  };
  province2025Incidence?: Array<{
    province: string;
    stock: number;
    stockPmh: number;
  }>;
  facts: {
    current: {
      fechaConsulta: string;
      total: number;
      masculino: number;
      femenino: number;
    };
    waitClock: {
      avgMonths: number;
      medianMonths: number;
      avgMinutes: number;
      avgDays: number;
      scopeNote: string;
    };
  };
};

export type LensId = 'edad' | 'sexo' | 'territorio';

export const lensLabels: Record<LensId, string> = {
  edad: 'Edad',
  sexo: 'Sexo',
  territorio: 'Territorio',
};

export const formatInteger = (value: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value);

export const formatDecimal = (value: number) =>
  Number.isFinite(value) ? new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value) : 's/d';

export const percentage = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);

export function buildStoryView(data: StoryData) {
  const total = data.facts.current.total || data.currentWaiting.reduce((sum, item) => sum + item.value, 0);
  const renal = data.currentWaiting.find((item) => item.label.toLowerCase() === 'renal')?.value ?? 0;
  const seniority = data.currentSnapshot.renalSeniority;
  const oneYearIndex = seniority.findIndex((item) => item.label.includes('1~2'));
  const atLeastOneYear = seniority
    .slice(oneYearIndex >= 0 ? oneYearIndex : seniority.length)
    .reduce((sum, item) => sum + item.value, 0);

  const currentProvince = data.currentSnapshot.renalProvince;
  const provinces = currentProvince?.length
    ? currentProvince
    : (data.province2025Incidence ?? [])
        .map((item) => ({ label: item.province, value: item.stock }))
        .sort((a, b) => b.value - a.value);

  return {
    total,
    renal,
    renalShare: percentage(renal, total),
    atLeastOneYear,
    atLeastOneYearShare: percentage(atLeastOneYear, renal),
    provinces,
    snapshotDate: data.currentSnapshot.snapshotDate || data.facts.current.fechaConsulta,
  };
}
