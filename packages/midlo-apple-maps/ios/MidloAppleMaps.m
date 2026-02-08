#import "MidloAppleMaps.h"

#import <MapKit/MapKit.h>
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

@end
