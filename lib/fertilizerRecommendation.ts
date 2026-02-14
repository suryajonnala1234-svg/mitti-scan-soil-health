import { ISoilValues, IDeficiency, IRecommendation } from '@/models/SoilScan';
import { CROP_STANDARDS } from './nutrientAnalysis';

// Fertilizer product database
interface FertilizerProduct {
  name: string;
  nutrient: string;
  npkRatio: { N?: number; P?: number; K?: number };
  pricePerBag: number; // in INR
  bagWeight: number;   // in kg
  unit: string;
}

const FERTILIZER_PRODUCTS: FertilizerProduct[] = [
  {
    name: 'Neem Coated Urea',
    nutrient: 'Nitrogen',
    npkRatio: { N: 46 },
    pricePerBag: 300,
    bagWeight: 50,
    unit: 'bags',
  },
  {
    name: 'Single Super Phosphate (SSP)',
    nutrient: 'Phosphorus',
    npkRatio: { P: 16 },
    pricePerBag: 400,
    bagWeight: 50,
    unit: 'bags',
  },
  {
    name: 'Muriate of Potash (MOP)',
    nutrient: 'Potassium',
    npkRatio: { K: 60 },
    pricePerBag: 1200,
    bagWeight: 50,
    unit: 'bags',
  },
  {
    name: 'Vermicompost',
    nutrient: 'Organic Carbon',
    npkRatio: {},
    pricePerBag: 250,
    bagWeight: 40,
    unit: 'bags',
  },
  {
    name: 'Agricultural Lime',
    nutrient: 'pH',
    npkRatio: {},
    pricePerBag: 200,
    bagWeight: 50,
    unit: 'bags',
  },
];

// Calculate fertilizer requirements
export function calculateFertilizerRecommendations(
  soilValues: ISoilValues,
  crop: string,
  farmSize: number, // in acres
  deficiencies: IDeficiency[]
): IRecommendation[] {
  const recommendations: IRecommendation[] = [];
  const idealValues = CROP_STANDARDS[crop];

  // Convert acres to hectares (1 acre = 0.405 hectares)
  const farmSizeHa = farmSize * 0.405;

  deficiencies.forEach((deficiency, index) => {
    if (deficiency.status !== 'Optimal') {
      const product = FERTILIZER_PRODUCTS.find(
        (p) => p.nutrient === deficiency.nutrient
      );

      if (product) {
        let quantityNeeded = 0;

        // Calculate based on nutrient type
        if (deficiency.nutrient === 'Nitrogen') {
          const nRequired = (idealValues.N - soilValues.N) * farmSizeHa;
          quantityNeeded = (nRequired / (product.npkRatio.N || 46)) / product.bagWeight;
        } else if (deficiency.nutrient === 'Phosphorus') {
          const pRequired = (idealValues.P - soilValues.P) * farmSizeHa;
          quantityNeeded = (pRequired / (product.npkRatio.P || 16)) / product.bagWeight;
        } else if (deficiency.nutrient === 'Potassium') {
          const kRequired = (idealValues.K - soilValues.K) * farmSizeHa;
          quantityNeeded = (kRequired / (product.npkRatio.K || 60)) / product.bagWeight;
        } else if (deficiency.nutrient === 'Organic Carbon') {
          // Vermicompost: 2-5 tons/hectare
          quantityNeeded = (3 * 1000) / product.bagWeight * farmSizeHa;
        } else if (deficiency.nutrient === 'pH') {
          // Agricultural lime based on pH difference
          const pHDiff = Math.abs(idealValues.pH - soilValues.pH);
          if (pHDiff > 0.5) {
            quantityNeeded = (pHDiff * 500) / product.bagWeight * farmSizeHa;
          }
        }

        quantityNeeded = Math.ceil(Math.max(1, quantityNeeded));

        recommendations.push({
          fertilizer: product.name,
          quantity: quantityNeeded,
          unit: product.unit,
          cost: quantityNeeded * product.pricePerBag,
          priority: index + 1,
        });
      }
    }
  });

  return recommendations;
}

// Get total cost
export function calculateTotalCost(recommendations: IRecommendation[]): number {
  return recommendations.reduce((total, rec) => total + rec.cost, 0);
}
