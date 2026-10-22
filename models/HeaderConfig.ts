import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubmenuItem {
  label: string;
  link: string;
  order: number;
}

export interface IMenuItem {
  label: string;
  link: string;
  order: number;
  submenu: ISubmenuItem[];
}

export interface ITopBarMessage {
  text: string;
  link: string;
}

export interface ITopBar {
  enabled: boolean;
  bgColor: string;
  textColor: string;
  autoSlide: boolean;
  intervalSeconds: number;
  messages: ITopBarMessage[];
}

export interface ILogo {
  url: string;
  alt: string;
  height: number;
}

export interface IContact {
  enabled: boolean;
  label: string;
  phone: string;
  link: string;
}

export interface ISearch {
  enabled: boolean;
}

export interface IButton {
  enabled: boolean;
  label: string;
  link: string;
  bgColor: string;
  textColor: string;
}

export interface IHeaderConfig extends Document {
  topBar: ITopBar;
  logo: ILogo;
  menuItems: IMenuItem[];
  contact: IContact;
  search: ISearch;
  showCart: boolean;
  button: IButton;
  accentColor: string;
  spaceBelow: number;
  updatedAt: Date;
}

const SubmenuItemSchema = new Schema<ISubmenuItem>(
  {
    label: { type: String, required: true, trim: true },
    link: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const MenuItemSchema = new Schema<IMenuItem>(
  {
    label: { type: String, required: true, trim: true },
    link: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
    submenu: { type: [SubmenuItemSchema], default: [] },
  },
  { _id: true }
);

const TopBarMessageSchema = new Schema<ITopBarMessage>(
  {
    text: { type: String, default: '', trim: true },
    link: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const TopBarSchema = new Schema<ITopBar>(
  {
    enabled: { type: Boolean, default: true },
    bgColor: { type: String, default: '#3B82F6' },
    textColor: { type: String, default: '#FFFFFF' },
    autoSlide: { type: Boolean, default: true },
    intervalSeconds: { type: Number, default: 5 },
    messages: { type: [TopBarMessageSchema], default: [] },
  },
  { _id: false, strict: false }
);

const LogoSchema = new Schema<ILogo>(
  {
    url: { type: String, default: '/images/logo.webp', trim: true },
    alt: { type: String, default: 'Logo', trim: true },
    height: { type: Number, default: 48 },
  },
  { _id: false }
);

const ContactSchema = new Schema<IContact>(
  {
    enabled: { type: Boolean, default: true },
    label: { type: String, default: 'Need Help?', trim: true },
    phone: { type: String, default: '', trim: true },
    link: { type: String, default: '', trim: true },
  },
  { _id: false, strict: false }
);

const SearchSchema = new Schema<ISearch>(
  {
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const ButtonSchema = new Schema<IButton>(
  {
    enabled: { type: Boolean, default: true },
    label: { type: String, default: 'Login', trim: true },
    link: { type: String, default: '/login', trim: true },
    bgColor: { type: String, default: '#111111' },
    textColor: { type: String, default: '#FFFFFF' },
  },
  { _id: false }
);

const HeaderConfigSchema: Schema<IHeaderConfig> = new Schema(
  {
    topBar: { type: TopBarSchema, default: () => ({}) },
    logo: { type: LogoSchema, default: () => ({}) },
    menuItems: { type: [MenuItemSchema], default: [] },
    contact: { type: ContactSchema, default: () => ({}) },
    search: { type: SearchSchema, default: () => ({}) },
    showCart: { type: Boolean, default: true },
    button: { type: ButtonSchema, default: () => ({}) },
    accentColor: { type: String, default: '#DF6951' },
    spaceBelow: { type: Number, default: 40 },
  },
  { timestamps: true, strict: false }
);

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.HeaderConfig;
}

const HeaderConfig: Model<IHeaderConfig> =
  mongoose.models.HeaderConfig ||
  mongoose.model<IHeaderConfig>('HeaderConfig', HeaderConfigSchema);

export default HeaderConfig;
