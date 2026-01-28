package com.midlo.backend.places.details;

import java.util.List;

public record PlaceDetailsResponse(
                String placeId,
                String name,
                String formattedAddress,
                double lat,
                double lng,
                Double rating,
                Integer userRatingCount,
                String googleMapsUri,
                String websiteUri,
                String internationalPhoneNumber,
                Boolean openNow,
                List<String> weekdayDescriptions,
                List<PlacePhoto> photos) {
}
