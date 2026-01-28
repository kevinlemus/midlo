export type Midpoint = {
  lat: number;
  lng: number;
};

export type Place = {
  placeId: string;
  name: string;
  distance: string;
  lat: number;
  lng: number;
};

export type PlacePhoto = {
  name: string;
  widthPx: number | null;
  heightPx: number | null;
};

export type PlaceDetails = {
  placeId: string;
  name: string | null;
  formattedAddress: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string | null;
  websiteUri: string | null;
  internationalPhoneNumber: string | null;
  openNow: boolean | null;
  weekdayDescriptions: string[] | null;
  photos: PlacePhoto[] | null;
};
