export interface EventItem {
  id: string;
  name: string;
  date: string;
  location: string;
  price_per_session: number;
  logo_url: string;
  qris_url: string;
  is_active: boolean;
  allowed_presets?: string[];
  allowed_filters?: string[];
  allowed_stickers?: string[];
  created_at?: string;
}

export interface PhotoStripStat {
  event_name: string;
  amount: number;
  count: number;
}