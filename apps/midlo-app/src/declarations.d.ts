declare module "*.png" {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module "midlo-apple-maps" {
  export function openAppleMapsPlace(
    name: string,
    lat: number,
    lng: number,
  ): Promise<boolean>;

  export function openAppleMapsPOI(
    name: string,
    lat: number,
    lng: number,
  ): Promise<boolean>;
}
