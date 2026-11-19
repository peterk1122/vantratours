import mongoose, { Schema, models, model } from 'mongoose';

const HomeSectionSchema = new Schema(
  {
    heading: { type: String, required: true, trim: true },
    packages: [{ type: Schema.Types.ObjectId, ref: 'Package' }], // apne package model ka naam yahan likhein
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.HomeSection || model('HomeSection', HomeSectionSchema);