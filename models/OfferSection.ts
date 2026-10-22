import mongoose, { Schema } from 'mongoose';

const OfferItemSchema = new Schema({
  image: { type: String, default: '' },
  link: { type: String, default: '' },
  alt: { type: String, default: '' },
  order: { type: Number, default: 0 },
});

const OfferSectionSchema = new Schema(
  {
    heading: { type: String, default: 'Discounts & Offers' },
    subheading: { type: String, default: '' },
    offers: { type: [OfferItemSchema], default: [] },
  },
  { timestamps: true }
);

const OfferSection =
  mongoose.models.OfferSection || mongoose.model('OfferSection', OfferSectionSchema);

export default OfferSection;
