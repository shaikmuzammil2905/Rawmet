export type UserRole = "admin" | "vendor" | "customer";

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  role: UserRole;
  status: "active" | "suspended";
  created_at: string;
}

export interface VendorRecord {
  id: number;
  user_id: number;
  business_name: string;
  owner_name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  business_category: string;
  product_service_category: string;
  gst_number: string;
  id_proof_type: string;
  id_proof_url: string;
  logo_url: string;
  address: string;
  city: string;
  state: string;
  description: string;
  product_details: string;
  verification_status: "pending" | "approved" | "rejected" | "suspended";
  rejection_reason?: string;
  approved_at?: string;
  rejected_at?: string;
  reviewed_by_admin_id?: number | null;
  updated_at?: string;
  business_type?: string;
  country?: string;
  door_no?: string;
  address_line1?: string;
  address_line2?: string;
  pincode?: string;
  business_proof_type?: string;
  business_proof_number?: string;
  primary_category?: string;
  whatsapp_opt_in: number;
  whatsapp_categories: string;
  created_at: string;
}

export interface CategoryRecord {
  id: number;
  type: "product" | "machinery" | "service";
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: number;
}

export interface SubcategoryRecord {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  category_name?: string;
  category_type?: string;
}

export interface ListingRecord {
  id: number;
  vendor_id: number;
  vendor_name?: string;
  vendor_verified?: boolean;
  vendor_whatsapp?: string;
  vendor_mobile?: string;
  vendor_city?: string;
  type: "product" | "machinery" | "service";
  category_slug: string;
  subcategory_slug: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  specifications: string;
  location: string;
  price_display: string;
  availability: string;
  image_url: string;
  gallery_urls: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  is_published?: number;
  master_product_id?: number | null;
  price_numeric?: number;
  price_unit?: string;
  min_order_qty?: string;
  supply_location?: string;
  commercial_details?: string;
  is_master?: number;
  featured: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface RequirementRecord {
  id: number;
  user_id: number | null;
  name: string;
  business_name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  category_type: "product" | "machinery" | "service";
  category_slug: string;
  title: string;
  quantity: string;
  location: string;
  description: string;
  attachment_url: string;
  status: "open" | "matched" | "closed";
  matched_vendors_count: number;
  created_at: string;
}

export interface SubscriptionPlanRecord {
  id: number;
  name: string;
  slug: string;
  user_type?: "seller" | "buyer" | "all";
  duration_months: number;
  bonus_months: number;
  price_inr: number;
  gst_included: number;
  badge_text: string;
  highlight_text: string;
  features: string;
  listing_allowance?: number;
  contact_unlock_allowance?: number;
  enquiry_allowance?: number;
  description?: string;
  is_active: number;
  sort_order: number;
}

export interface SubscriptionFormRecord {
  id: number;
  user_id: number | null;
  user_type: "seller" | "buyer";
  name: string;
  business_name: string;
  mobile: string;
  email: string;
  plan_name: string;
  amount_inr: number;
  notes: string;
  status: "pending" | "approved" | "rejected" | "converted";
  admin_remarks: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRecord {
  id: number;
  user_id: number | null;
  user_email: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface HeroSlide {
  id: string;
  eyebrow: string;
  headlinePrefix: string;
  headlineHighlight: string;
  subcategoriesLine: string;
  desktopImage: string;
  mobileImage: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface AboutContent {
  headline: string;
  subheadline: string;
  summary: string;
  fullStory: string;
  mission: string;
  vision: string;
  imageUrl: string;
  stats: Array<{
    key: string;
    target: number;
    suffix: string;
    label: string;
    icon: string;
  }>;
}

export interface LaunchingOfferContent {
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  fourthYearFreeNote: string;
  highlights: string[];
}

export interface ContactSettings {
  companyName: string;
  portalName: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  gstNumber: string;
  referralRewardRule: string;
  conditionsApplyNote: string;
}

