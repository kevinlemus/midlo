import { NativeModules, Platform } from "react-native";

type MidloAppleMapsModule = {
  openPlace(name: string, lat: number, lng: number): Promise<boolean>;
  openPOI(name: string, lat: number, lng: number): Promise<boolean>;
};

const Native: MidloAppleMapsModule | undefined =
  Platform.OS === "ios" ? (NativeModules as any)?.MidloAppleMaps : undefined;

export async function openAppleMapsPlace(
  name: string,
  lat: number,
  lng: number,
): Promise<boolean> {
  if (!Native) return false;
  try {
    return await Native.openPlace(name, lat, lng);
  } catch {
    return false;
  }
}

/**
 * Uses Apple Maps' own POI database (MKLocalSearch) to open the canonical
 * listing near the coordinate. This is what makes Apple Maps show "McDonald's"
 * instead of a street-address label.
 */
export async function openAppleMapsPOI(
  name: string,
  lat: number,
  lng: number,
): Promise<boolean> {
  if (!Native) return false;
  try {
    return await Native.openPOI(name, lat, lng);
  } catch {
    return false;
  }
}
