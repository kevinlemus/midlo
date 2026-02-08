import { NativeModules, Platform } from "react-native";

type MidloAppleMapsModule = {
  openPlace(name: string, lat: number, lng: number): Promise<boolean>;
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
