#import "MidloAppleMaps.h"

#import <MapKit/MapKit.h>
#import <CoreLocation/CoreLocation.h>
#import <React/RCTLog.h>

@implementation MidloAppleMaps

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(openPlace:(NSString *)name
                  lat:(double)lat
                  lng:(double)lng
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (name == nil || [name length] == 0) {
    resolve(@(NO));
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake(lat, lng);
    if (!CLLocationCoordinate2DIsValid(coordinate)) {
      resolve(@(NO));
      return;
    }

    MKPlacemark *placemark = [[MKPlacemark alloc] initWithCoordinate:coordinate];
    MKMapItem *item = [[MKMapItem alloc] initWithPlacemark:placemark];
    item.name = name;

    NSDictionary *options = @{ MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving };
    BOOL ok = [item openInMapsWithLaunchOptions:options];
    resolve(@(ok));
  });
}

RCT_EXPORT_METHOD(openPOI:(NSString *)name
                  lat:(double)lat
                  lng:(double)lng
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (name == nil || [name length] == 0) {
    resolve(@(NO));
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    CLLocationCoordinate2D coordinate = CLLocationCoordinate2DMake(lat, lng);
    if (!CLLocationCoordinate2DIsValid(coordinate)) {
      resolve(@(NO));
      return;
    }

    // Search Apple Maps’ POI database near the coordinate.
    MKLocalSearchRequest *request = [[MKLocalSearchRequest alloc] init];
    request.naturalLanguageQuery = name;
    request.region = MKCoordinateRegionMakeWithDistance(coordinate, 3000, 3000);

    MKLocalSearch *search = [[MKLocalSearch alloc] initWithRequest:request];
    [search startWithCompletionHandler:^(MKLocalSearchResponse * _Nullable response, NSError * _Nullable error) {
      if (error != nil || response == nil || response.mapItems == nil || [response.mapItems count] == 0) {
        resolve(@(NO));
        return;
      }

      // Pick the closest result to the provided coordinate.
      CLLocation *origin = [[CLLocation alloc] initWithLatitude:lat longitude:lng];
      MKMapItem *bestItem = nil;
      CLLocationDistance bestDistance = DBL_MAX;
      for (MKMapItem *item in response.mapItems) {
        CLLocationCoordinate2D c = item.placemark.coordinate;
        if (!CLLocationCoordinate2DIsValid(c)) {
          continue;
        }
        CLLocation *loc = [[CLLocation alloc] initWithLatitude:c.latitude longitude:c.longitude];
        CLLocationDistance d = [origin distanceFromLocation:loc];
        if (d < bestDistance) {
          bestDistance = d;
          bestItem = item;
        }
      }

      if (bestItem == nil) {
        resolve(@(NO));
        return;
      }

      NSDictionary *options = @{ MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving };
      BOOL ok = [bestItem openInMapsWithLaunchOptions:options];
      resolve(@(ok));
    }];
  });
}

@end
