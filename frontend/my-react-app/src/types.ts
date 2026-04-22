import { Id, Tag, type Book } from "./lib/api";


export type ProfileStats = {
  book_added?: number;
  book_borrowed?: number;
  [key: string]: unknown;
};

export type BookCardItem = {
  id: Id;
  title: string;
  author: string;
  cover_image_uri?: string | null;
};

export type ReservationCardItem = BookCardItem & {
  reservation_status?: "active" | "pending" | string;
};

export type FormState = {
  title: string;
  author: string;
  description: string;
  location_ids: number[];
  tag_ids: number[];
  coverImage: File | null;
  coverPreview: string | null;
};

export type BookForEdit = {
  id: Id;
  title?: string;
  author?: string;
  description?: string | null;
  cover_image_uri?: string | null;
  locations?: Array<{ id: number; name?: string; address?: string }>;
  tags?: Array<{ id: number; tag_name: string; description?: string }>;
};

export type BookFormProps = {
  isEditMode: boolean;
  bookId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export type LocationItem =
  | string
  | {
      id?: Id;
      name?: string;
      address?: string;
      description?: string;
    };

export type BookDetails = Book & {
  title: string;
  author: string;
  description: string;
  cover_image_uri?: string | null;
  owner_id?: Id | null;
  status: string;
  locations: LocationItem[];
  tags?: Tag[];
  reader_count: number;
};

export type OwnerInfo = {
  id: Id | null;
  name: string;
  email?: string;
  isCurrentUser?: boolean;
};

export type HomeBookCard = {
  id: Id;
  title: string;
  author: string;
  cover_image_uri?: string | null;
  readers_count?: number;
};


export type CardBook = {
  id: Id;
  title: string;
  author: string;
  cover_image_uri?: string | null;
};

export type SeoManagerProps = {
  title: string;
  description: string;
  canonicalUrl?: string;
  noIndex?: boolean;      
  noFollow?: boolean;     
  ogImage?:  string | null;
  ogType?: 'website' | 'article' | 'book';
};