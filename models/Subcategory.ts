import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubcategory extends Document {
  name: string;
  slug: string;
  category: mongoose.Types.ObjectId; // root Category this belongs to, e.g. Desert Safari
  parent?: mongoose.Types.ObjectId | null; // optional parent Subcategory, for nesting (e.g. Liwa under Overnight)
  description: string;
  image?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubcategorySchema: Schema<ISubcategory> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a subcategory name'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Please provide a URL slug'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
      default: null,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    metaKeywords: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// A slug must be unique among siblings (same category + same parent),
// not globally — this is what lets "overnight" exist under desert-safari
// while "overnight/liwa" nests underneath it without a global slug clash.
SubcategorySchema.index({ category: 1, parent: 1, slug: 1 }, { unique: true });

const Subcategory: Model<ISubcategory> =
  mongoose.models.Subcategory || mongoose.model<ISubcategory>('Subcategory', SubcategorySchema);

export default Subcategory;
