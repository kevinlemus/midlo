export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface PlaceResult {
  places: Place[];
}
