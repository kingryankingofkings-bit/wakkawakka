export type Theme = 'light' | 'dark' | 'system';
export type PostType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'REEL' | 'STORY' | 'AUDIO' | 'LIVE';
export type Visibility = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';
export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MESSAGE' | 'MENTION' | 'SHARE' | 'LIVE' | 'GIFT' | 'SUBSCRIPTION' | 'TIP' | 'BADGE';
export type VerificationTier = 'NONE' | 'BLUE' | 'GOLD' | 'GOVERNMENT';
export type FollowStatus = 'PENDING' | 'ACCEPTED';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  website?: string;
  location?: string;
  birthdate?: string;
  isVerified: boolean;
  verificationTier: VerificationTier;
  isPremium: boolean;
  isPrivate: boolean;
  twoFactorEnabled: boolean;
  theme: Theme;
  accentColor: string;
  language: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  streakDays: number;
  badges: Badge[];
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  content: string;
  author: User;
  authorId: string;
  mediaUrls: string[];
  type: PostType;
  visibility: Visibility;
  isEphemeral: boolean;
  expiresAt?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  hashtags: string[];
  collaborators: User[];
  productTag?: Product;
  userReaction?: ReactionType;
  isBookmarked?: boolean;
  isShared?: boolean;
  originalPost?: Post;
  musicTrack?: MusicTrack;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  authorId: string;
  parentId?: string;
  content: string;
  likesCount: number;
  replies?: Comment[];
  userLiked?: boolean;
  createdAt: string;
}

export interface Like {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  type: ReactionType;
}

export interface Follow {
  id: string;
  follower: User;
  followerId: string;
  following: User;
  followingId: string;
  status: FollowStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  senderId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  isRead: boolean;
  isDeleted: boolean;
  replyTo?: Message;
  createdAt: string;
}

export interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  avatarUrl?: string;
  members: User[];
  admins: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actor: User;
  actorId: string;
  targetId: string;
  targetType: string;
  isRead: boolean;
  message: string;
  link: string;
  createdAt: string;
}

export interface Story {
  id: string;
  author: User;
  authorId: string;
  mediaUrl: string;
  type: 'IMAGE' | 'VIDEO' | 'TEXT';
  textContent?: string;
  backgroundColor?: string;
  expiresAt: string;
  viewerIds: string[];
  hasViewed?: boolean;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  coverImage?: string;
  creator: User;
  creatorId: string;
  members: User[];
  memberCount: number;
  moderators: User[];
  category: string;
  isPrivate: boolean;
  isMember?: boolean;
  isModerator?: boolean;
  createdAt: string;
}

export interface LiveStream {
  id: string;
  host: User;
  hostId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  streamKey: string;
  viewerCount: number;
  isActive: boolean;
  coHosts: User[];
  giftTotal: number;
  comments: LiveComment[];
  createdAt: string;
  endedAt?: string;
}

export interface LiveComment {
  id: string;
  user: User;
  message: string;
  type: 'COMMENT' | 'GIFT' | 'JOIN' | 'FOLLOW';
  giftAmount?: number;
  createdAt: string;
}

export interface AudioRoom {
  id: string;
  host: User;
  hostId: string;
  title: string;
  description?: string;
  speakers: User[];
  listeners: User[];
  listenerCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  seller: User;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
}

export interface Order {
  id: string;
  buyer: User;
  buyerId: string;
  product: Product;
  productId: string;
  quantity: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Badge {
  id: string;
  userId: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  awardedAt: string;
}

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string;
}

export interface Hashtag {
  id: string;
  name: string;
  postCount: number;
  isTrending: boolean;
  posts?: Post[];
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverArt?: string;
  duration: number;
}

export interface Subscription {
  id: string;
  subscriber: User;
  subscriberId: string;
  creator: User;
  creatorId: string;
  tier: string;
  amount: number;
  status: SubscriptionStatus;
  createdAt: string;
}

export interface Tip {
  id: string;
  sender: User;
  senderId: string;
  receiver: User;
  receiverId: string;
  amount: number;
  message?: string;
  createdAt: string;
}

export interface Analytics {
  id: string;
  userId: string;
  date: string;
  impressions: number;
  reach: number;
  profileViews: number;
  followerGrowth: number;
  postEngagement: number;
  topPosts: Post[];
  followerDemographics: {
    age: Record<string, number>;
    gender: Record<string, number>;
    location: Record<string, number>;
  };
}

export interface SearchResults {
  users: User[];
  posts: Post[];
  hashtags: Hashtag[];
  communities: Community[];
}

export interface FeedAlgorithmWeight {
  recency: number;
  engagement: number;
  interest: number;
  following: number;
}

export interface Report {
  id: string;
  reporter: User;
  reporterId: string;
  targetId: string;
  targetType: 'POST' | 'USER' | 'COMMENT' | 'COMMUNITY';
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface ActivityPubActor {
  '@context': string;
  id: string;
  type: string;
  preferredUsername: string;
  name: string;
  summary?: string;
  inbox: string;
  outbox: string;
  followers: string;
  following: string;
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
}

export interface PrivacySettings {
  showEmail: boolean;
  showBirthdate: boolean;
  allowDMsFrom: 'EVERYONE' | 'FOLLOWERS' | 'NONE';
  showOnlineStatus: boolean;
  allowTagging: boolean;
  showActivityStatus: boolean;
  dataExportRequested?: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}
