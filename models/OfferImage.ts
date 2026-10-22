import mongoose, { Schema } from 'mongoose';

const OfferImageSchema = new Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    filename: { type: String, default: '' },
  },
  { timestamps: true }
);

const OfferImage =
  mongoose.models.OfferImage || mongoose.model('OfferImage', OfferImageSchema);

export default OfferImage;
