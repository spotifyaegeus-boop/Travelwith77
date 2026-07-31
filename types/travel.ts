export type TravelDay = {
  date: string;
  chapter: string;
  title: string;

  dayTemp: string;
  nightTemp: string;
  level: number;
  weather: string;

  maleOutfit: string;
  femaleOutfit: string;
  shoes: string;
  outerLayer: string;
  notice: string;

  heroImage: string;
  maleImage: string;
  femaleImage: string;

  published: boolean;
  itinerary: ItineraryItem[];
};

export type ItineraryItem = {
  time: string;
  place: string;
  description: string;
  type: string;
  priority: string;

  mapUrl?: string;

  /* 對應 Documents 工作表的 ID，例如 DOC003 */
  documentIds?: string[];
};

export type TravelDocument = {
  id: string;

  category:
    | '航班'
    | '住宿'
    | '租車'
    | '景點'
    | '保險'
    | '其他';

  name: string;
  description?: string;
  date?: string;
  url: string;

  published: boolean;
};

export type PackingItem = {
  id: string;
  category: string;
  name: string;

  quantity?: string;
  description?: string;
  important?: boolean;

  published: boolean;
};
