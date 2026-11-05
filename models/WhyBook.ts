import mongoose, { Schema } from 'mongoose';

const WhyBookSchema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    heading: { type: String, default: 'Why book with us?' },
    items: [
      {
        image: { type: String, default: '' },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.WhyBook || mongoose.model('WhyBook', WhyBookSchema);
