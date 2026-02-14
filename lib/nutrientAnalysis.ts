import { ISoilValues, IDeficiency } from '@/models/SoilScan';

// Crop-specific ideal nutrient standards
export const CROP_STANDARDS: Record<string, ISoilValues> = {
  Wheat: {
    N: 280,  // kg/ha
    P: 60,   // kg/ha
    K: 140,  // kg/ha
    OC: 0.75, // %
    pH: 6.5,
  },
  Rice: {
    N: 120,
    P: 60,
    K: 60,
    OC: 0.8,
    pH: 6.0,
  },
  Cotton: {
    N: 120,
    P: 60,
    K: 60,
    OC: 0.75,
    pH: 6.5,
  },
  Maize: {
    N: 150,
    P: 75,
    K: 75,
    OC: 0.75,
    pH: 6.0,
  },
};

// Analyze soil values against ideal standards
export function analyzeSoilHealth(
  soilValues: ISoilValues,
  crop: string
): IDeficiency[] {
  const idealValues = CROP_STANDARDS[crop];
  if (!idealValues) {
    throw new Error('Invalid crop selection');
  }

  const deficiencies: IDeficiency[] = [];

  // Analyze Nitrogen
  const nDeficiency = ((idealValues.N - soilValues.N) / idealValues.N) * 100;
  if (nDeficiency > 0) {
    deficiencies.push({
      nutrient: 'Nitrogen',
      status: nDeficiency > 40 ? 'Critical' : 'Low',
      deficiency: Math.round(nDeficiency),
    });
  } else {
    deficiencies.push({
      nutrient: 'Nitrogen',
      status: 'Optimal',
      deficiency: 0,
    });
  }

  // Analyze Phosphorus
  const pDeficiency = ((idealValues.P - soilValues.P) / idealValues.P) * 100;
  if (pDeficiency > 0) {
    deficiencies.push({
      nutrient: 'Phosphorus',
      status: pDeficiency > 40 ? 'Critical' : 'Low',
      deficiency: Math.round(pDeficiency),
    });
  } else {
    deficiencies.push({
      nutrient: 'Phosphorus',
      status: 'Optimal',
      deficiency: 0,
    });
  }

  // Analyze Potassium
  const kDeficiency = ((idealValues.K - soilValues.K) / idealValues.K) * 100;
  if (kDeficiency > 0) {
    deficiencies.push({
      nutrient: 'Potassium',
      status: kDeficiency > 40 ? 'Critical' : 'Low',
      deficiency: Math.round(kDeficiency),
    });
  } else {
    deficiencies.push({
      nutrient: 'Potassium',
      status: 'Optimal',
      deficiency: 0,
    });
  }

  // Analyze Organic Carbon
  const ocDeficiency = ((idealValues.OC - soilValues.OC) / idealValues.OC) * 100;
  if (ocDeficiency > 0) {
    deficiencies.push({
      nutrient: 'Organic Carbon',
      status: ocDeficiency > 40 ? 'Critical' : 'Low',
      deficiency: Math.round(ocDeficiency),
    });
  } else {
    deficiencies.push({
      nutrient: 'Organic Carbon',
      status: 'Optimal',
      deficiency: 0,
    });
  }

  // Analyze pH
  const pHDiff = Math.abs(idealValues.pH - soilValues.pH);
  if (pHDiff > 0.5) {
    deficiencies.push({
      nutrient: 'pH',
      status: pHDiff > 1.5 ? 'Critical' : 'Low',
      deficiency: Math.round(pHDiff * 10),
    });
  } else {
    deficiencies.push({
      nutrient: 'pH',
      status: 'Optimal',
      deficiency: 0,
    });
  }

  // Sort by deficiency severity
  return deficiencies.sort((a, b) => b.deficiency - a.deficiency);
}
