/**
 * Placeholder API service.
 * Your MVP uses mock data, but this file prepares the structure
 * for when you add a backend or real Google Places integration.
 */

export const api = {
  getMidpoint: async () => {
    return { lat: 39.7684, lng: -86.1581 };
  },

  getPlaces: async () => {
    return [
      { name: "Midpoint Coffee", distance: "0.4 mi" },
      { name: "Neutral Ground Bistro", distance: "0.7 mi" },
      { name: "Halfway House Bar", distance: "1.0 mi" },
    ];
  },
};
