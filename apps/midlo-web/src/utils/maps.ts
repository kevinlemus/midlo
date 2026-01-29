// src/utils/maps.ts

export function mapsLinks(lat: number, lng: number) {
  const encoded = `${lat},${lng}`;

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    apple: `https://maps.apple.com/?q=${encoded}`,
    waze: `https://waze.com/ul?ll=${encoded}&navigate=yes`,
  };
}

export function mapsLinksWithPlaceId(
  lat: number,
  lng: number,
  placeId: string
) {
  const encoded = `${lat},${lng}`;
  const encodedId = encodeURIComponent(placeId);

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encoded}&query_place_id=${encodedId}`,
    apple: `https://maps.apple.com/?q=${encoded}&auid=${encodedId}`,
    waze: `https://waze.com/ul?ll=${encoded}&navigate=yes`,
  };
}
