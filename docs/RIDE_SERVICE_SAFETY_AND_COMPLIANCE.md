# RIDE SERVICE SAFETY AND COMPLIANCE POLICY
## WIBAWA NUSANTARA — Passenger Ride Hailing Foundation

This document defines the safety protocols, driver verification checklists, and platform compliance guidelines designed for the **Antar Orang / Ojek Online** passenger service.

---

## 1. Feature Flag & Rollout Policy

> [!IMPORTANT]
> **Safety First Flag Policy:**
> The Passenger Ride-Hailing (`ride`) service is **disabled by default** on public-facing screens. It must remain locked behind an administrative configuration flag until the platform completes legal reviews, insurance integrations, and local municipality licensing.

### How it is controlled:
1. **Database Flag**: The `service_types` record with the code `ride` has `is_active = false` by default.
2. **Admin Toggle**: The superadmin/administrator dashboard will contain a switch to activate/deactivate the ride service on demand.
3. **Public Exposure**: Public-facing lists, buttons, and booking services must dynamically query the `service_types` table. If the code `ride` has `is_active = false`, the option to book a ride remains hidden.

---

## 2. Driver / Courier Verification Requirements

No driver or courier may accept passenger transport tasks without meeting all of the following requirements:

*   **Verified Profile**: `courier_profiles.status` must be `approved` by an authorized admin.
*   **Compliance Flag**: `courier_profiles.safety_verified` must be explicitly marked as `true` in the database.
*   **Ride Capability Approval**: `courier_profiles.can_ride_passenger` must be toggled to `true`.
*   **Supported Vehicle Type**: Only `motor` (motorcycle) or `mobil` (car) profiles are permitted. `sepeda` (bicycle) or `jalan_kaki` (walking) are strictly restricted from passenger services.
*   **Required Documents**:
    *   Active Driver's License (`driver_license_url` is verified).
    *   Valid Vehicle Registration (`vehicle_registration_url` is verified).
    *   Clear selfie with vehicle and license plate matching registration details.

---

## 3. Passenger Safety Protocols & Guidelines

Before every trip, the platform enforces:

1.  **Safety Disclaimer display**:
    ```text
    Harap gunakan helm standar SNI yang bersih untuk perjalanan ojek motor. Pastikan plat nomor kendaraan kurir/ojek sesuai dengan plat nomor yang tertera di aplikasi. Laporkan segala bentuk perilaku tidak aman kepada Admin WIBAWA NUSANTARA.
    ```
2.  **Emergency Helpline**:
    A floating safety banner with rapid admin contact numbers is shown on active ride details screen for quick coordination.
3.  **No Double Passenger Rides**:
    Ojek motor is strictly limited to 1 passenger (`passenger_count = 1`).

---

## 4. Platform Pricing & Commission Regulations

*   **Platform Fee**: Set dynamically via `delivery_fare_rules` (suggested default flat Rp 2,000 for server maintenance).
*   **Courier Commission**: Default split is **80% courier, 20% platform** to support driver livelihoods and community economic kemandirian.
