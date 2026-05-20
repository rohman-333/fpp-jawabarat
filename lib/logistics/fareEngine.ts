// lib/logistics/fareEngine.ts

export interface FareCalculationInput {
  serviceTypeCode?: string;
  shippingMethodCode?: string;
  originZoneId?: string;
  destinationZoneId?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  distanceKm?: number;
  itemWeight?: number;
  isCod?: boolean;
  orderAmount?: number;
}

export interface FareCalculationOutput {
  baseFare: number;
  distanceKm: number;
  distanceFare: number;
  codFee: number;
  platformFee: number;
  courierEarning: number;
  totalFare: number;
  calculationMode: 'distance' | 'zone' | 'flat';
  fareBreakdown: {
    baseFare: number;
    distanceFare: number;
    codFee: number;
    platformFee: number;
    courierEarning: number;
    totalFare: number;
    estimatedDistanceKm: number;
  };
}

/**
 * Calculates distance between two coordinates in kilometers using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return parseFloat(d.toFixed(2));
}

/**
 * Automatically calculates logistics fees, argo fares, platform cuts, and courier earnings.
 */
export function calculateDeliveryFare(input: FareCalculationInput): FareCalculationOutput {
  const {
    shippingMethodCode = 'internal_courier',
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    itemWeight = 1,
    isCod = false,
    orderAmount = 0,
  } = input;

  // 1. Initial baseline parameters (fallback defaults matching fare_engine_settings)
  let baseFare = 5000;
  let perKmFare = 2500;
  let minimumFare = 7000;
  let codFeeFlat = 3000;
  let platformFee = 1000;
  let calculationMode: 'distance' | 'zone' | 'flat' = 'flat';

  // Adjust parameters based on shipping methods or zones
  if (shippingMethodCode === 'pickup') {
    return {
      baseFare: 0,
      distanceKm: 0,
      distanceFare: 0,
      codFee: 0,
      platformFee: 0,
      courierEarning: 0,
      totalFare: 0,
      calculationMode: 'flat',
      fareBreakdown: {
        baseFare: 0,
        distanceFare: 0,
        codFee: 0,
        platformFee: 0,
        courierEarning: 0,
        totalFare: 0,
        estimatedDistanceKm: 0,
      },
    };
  }

  if (shippingMethodCode === 'external_shipping') {
    // External shipping uses a flat estimative fee
    const flatFee = 15000; // Flat Rp 15.000 for local area JNE/J&T
    return {
      baseFare: flatFee,
      distanceKm: 0,
      distanceFare: 0,
      codFee: 0,
      platformFee: 2000, // Platform markup fee
      courierEarning: 0, // Delivered by external company
      totalFare: flatFee,
      calculationMode: 'flat',
      fareBreakdown: {
        baseFare: flatFee,
        distanceFare: 0,
        codFee: 0,
        platformFee: 2000,
        courierEarning: 0,
        totalFare: flatFee,
        estimatedDistanceKm: 0,
      },
    };
  }

  // 2. Calculate Distance
  let distanceKm = input.distanceKm ?? 0;
  if (
    !distanceKm &&
    originLat !== undefined &&
    originLng !== undefined &&
    destinationLat !== undefined &&
    destinationLng !== undefined
  ) {
    distanceKm = calculateHaversineDistance(originLat, originLng, destinationLat, destinationLng);
    calculationMode = 'distance';
  } else if (distanceKm > 0) {
    calculationMode = 'distance';
  } else {
    // Falls back to zone-to-zone flat approximation
    distanceKm = 3; // Standard 3 km assumption within same subdistrict
    calculationMode = 'zone';
  }

  // 3. Compute Distance Fare
  let distanceFare = parseFloat((distanceKm * perKmFare).toFixed(0));

  // Weight penalty (extra Rp 1.000 per kg above 5kg)
  if (itemWeight > 5) {
    distanceFare += (itemWeight - 5) * 1000;
  }

  // 4. Compute Total Before Addons
  let rawTotal = baseFare + distanceFare;

  // Apply Minimum Fare boundary check
  if (rawTotal < minimumFare) {
    rawTotal = minimumFare;
  }

  // 5. COD Additional Fee
  const codFee = isCod ? codFeeFlat : 0;

  // 6. Platform Fee calculation (15% platform share or minimum flat Rp 1.000)
  const platformCommRate = 0.15; // 15% platforms commission
  const calculatedPlatformComm = rawTotal * platformCommRate;
  platformFee = Math.max(platformFee, parseFloat(calculatedPlatformComm.toFixed(0)));

  // 7. Final Argo Total
  const totalFare = rawTotal + codFee;
  
  // Courier Earning (85% of argo base + distance, or total argo minus platform cut)
  const courierEarning = Math.max(0, totalFare - platformFee);

  return {
    baseFare,
    distanceKm,
    distanceFare,
    codFee,
    platformFee,
    courierEarning,
    totalFare,
    calculationMode,
    fareBreakdown: {
      baseFare,
      distanceFare,
      codFee,
      platformFee,
      courierEarning,
      totalFare,
      estimatedDistanceKm: distanceKm,
    },
  };
}
