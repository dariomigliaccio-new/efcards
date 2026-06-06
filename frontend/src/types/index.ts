export type Sport = 'soccer' | 'baseball' | 'basketball' | 'football' | 'other';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'ultra_rare' | 'legendary';
export type CardCondition = 'mint' | 'near_mint' | 'excellent' | 'good' | 'poor';
export type UserCardStatus = 'have' | 'need' | 'duplicate';
export type ListingType = 'fixed' | 'offer' | 'auction';
export type TradeStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type AuctionStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  role: 'user' | 'admin' | 'moderator';
  is_verified: boolean;
  rating: number;
  rating_count: number;
  total_trades: number;
  total_sales: number;
  created_at: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  sport: Sport;
  year: number;
  manufacturer?: string;
  total_cards?: number;
  image_url?: string;
}

export interface Card {
  id: string;
  collection_id: string;
  collection_name?: string;
  card_number?: string;
  player_name?: string;
  team?: string;
  position?: string;
  nationality?: string;
  year?: number;
  sport: Sport;
  rarity: Rarity;
  parallel_type?: string;
  image_url?: string;
  image_back_url?: string;
  description?: string;
  estimated_value?: number;
  is_rookie: boolean;
  is_autograph: boolean;
  is_memorabilia: boolean;
  print_run?: number;
}

export interface UserCard extends Card {
  status: UserCardStatus;
  condition: CardCondition;
  quantity: number;
}

export interface Listing {
  id: string;
  seller_id: string;
  seller_username: string;
  seller_avatar?: string;
  seller_rating: number;
  card_id: string;
  player_name: string;
  team?: string;
  sport: Sport;
  rarity: Rarity;
  image_url?: string;
  year?: number;
  collection_name: string;
  type: ListingType;
  price?: number;
  min_offer?: number;
  condition: CardCondition;
  description?: string;
  status: string;
  views: number;
  is_featured: boolean;
  created_at: string;
}

export interface Auction {
  id: string;
  listing_id: string;
  seller_id: string;
  seller_username: string;
  seller_avatar?: string;
  card_id: string;
  player_name: string;
  sport: Sport;
  rarity: Rarity;
  image_url?: string;
  collection_name: string;
  start_price: number;
  reserve_price?: number;
  current_price: number;
  buy_now_price?: number;
  min_increment: number;
  status: AuctionStatus;
  starts_at: string;
  ends_at: string;
  winner_id?: string;
  bid_count: number;
  is_featured: boolean;
  seconds_remaining: number;
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  username: string;
  avatar_url?: string;
  amount: number;
  is_winning: boolean;
  created_at: string;
}

export interface Trade {
  id: string;
  initiator_id: string;
  initiator_username: string;
  initiator_avatar?: string;
  receiver_id: string;
  receiver_username: string;
  receiver_avatar?: string;
  status: TradeStatus;
  compatibility_score?: number;
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface TradeMatch {
  user_id: string;
  compatibility: number;
  cards_i_can_offer: string[];
  cards_they_can_offer: string[];
  user: User;
}

export interface Order {
  id: string;
  buyer_id: string;
  buyer_username: string;
  seller_id: string;
  seller_username: string;
  card_id: string;
  player_name: string;
  image_url?: string;
  sport: Sport;
  amount: number;
  platform_fee: number;
  seller_amount: number;
  status: OrderStatus;
  tracking_number?: string;
  tracking_carrier?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
