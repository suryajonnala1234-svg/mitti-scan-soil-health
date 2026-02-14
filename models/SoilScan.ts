import mongoose, { Document, Schema } from 'mongoose';

export interface ISoilValues {
  N: number;  // Nitrogen
  P: number;  // Phosphorus
  K: number;  // Potassium
  OC: number; // Organic Carbon
  pH: number;
}

export interface IDeficiency {
  nutrient: string;
  status: 'Low' | 'Critical' | 'Optimal';
  deficiency: number;
}

export interface IRecommendation {
  fertilizer: string;
  quantity: number;
  unit: string;
  cost: number;
  priority: number;
}

export interface ISoilScan extends Document {
  userId: mongoose.Types.ObjectId;
  crop: string;
  farmSize: number;
  soilValues: ISoilValues;
  deficiencies: IDeficiency[];
  recommendations: IRecommendation[];
  createdAt: Date;
}

const SoilScanSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  crop: {
    type: String,
    required: [true, 'Please specify the crop'],
    enum: ['Wheat', 'Rice', 'Cotton', 'Maize'],
  },
  farmSize: {
    type: Number,
    required: [true, 'Please provide farm size'],
    min: 0.1,
  },
  soilValues: {
    N: { type: Number, required: true },
    P: { type: Number, required: true },
    K: { type: Number, required: true },
    OC: { type: Number, required: true },
    pH: { type: Number, required: true },
  },
  deficiencies: [{
    nutrient: String,
    status: {
      type: String,
      enum: ['Low', 'Critical', 'Optimal'],
    },
    deficiency: Number,
  }],
  recommendations: [{
    fertilizer: String,
    quantity: Number,
    unit: String,
    cost: Number,
    priority: Number,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.SoilScan || mongoose.model<ISoilScan>('SoilScan', SoilScanSchema);
