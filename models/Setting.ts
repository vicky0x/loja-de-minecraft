import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  mercadoPagoToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    mercadoPagoToken: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema); 