# GOOGLE PLAY STORE RELEASE CHECKLIST
## WIBAWA NUSANTARA — Store Listing Metadata & Asset Requirements

Prepare all of the following assets, listings, policy URLs, and access accounts before submitting your build to the Google Play Console:

---

## 1. Store Listing Metadata

*   **App Name (Maks. 30 Karakter)**: `WIBAWA NUSANTARA`
*   **Package Name**: `com.wibawanusantara.app`
*   **Short Description (Maks. 80 Karakter)**: `Aplikasi Sosial Media & Marketplace Pesantren Jawa Barat Terlengkap`
*   **Full Description (Maks. 4000 Karakter)**:
    ```text
    WIBAWA NUSANTARA adalah platform sosial media dan marketplace digital resmi yang menghubungkan komunitas pondok pesantren di Jawa Barat. Bagikan kegiatan santri, ikuti kabar pesantren terbaru, diskusikan topik keislaman di forum, dan dukung kemandirian ekonomi pesantren melalui transaksi jual beli produk lokal unggulan langsung dari handphone Anda.
    
    Fitur Utama:
    - Kabar & Feed Komunitas Pesantren Realtime.
    - Forum Diskusi (Musyawarah) Santri & Umat.
    - Marketplace (Toko Santri) Terintegrasi.
    - Chat Realtime Penjual dan Pembeli.
    - Donasi & Program Pemberdayaan Pesantren.
    - Notifikasi Web Push Instan.
    ```

---

## 2. Graphic Assets & Screenshots

Ensure all visual assets conform exactly to Google Play Console size regulations:

| Visual Asset | Required Dimensions | Format | Key Requirements |
| :--- | :--- | :--- | :--- |
| **App Icon** | `512 x 512 px` | 32-bit PNG | Max 1MB. Transparent backgrounds allowed, but opaque shapes are recommended. |
| **Feature Graphic** | `1024 x 500 px` | PNG or JPEG | Max 15MB. Center important graphics and texts to avoid clipping. |
| **Phone Screenshots** | Min. `320 px` wide, Ratio `16:9` | PNG or JPEG | Provide at least 4 to 8 high-res screenshots showing Feed, Composer, Chat, and Checkout. |
| **Banner Art** | `1024 x 500 px` | PNG or JPEG | Branding title with Sapphire Blue gradient backdrop. |

---

## 3. URLs, Policies & Contact Details

*   **Privacy Policy URL**: `https://wibawanusantara.com/privacy`
    *(Must explain cookie usage, profiles metadata isolation, and storage of media files)*
*   **Terms of Service URL**: `https://wibawanusantara.com/terms`
*   **Data Safety Declarations**:
    - **Data Collected**: Personal info (name, email, phone), User Content (posts, comments, images, videos), app activity.
    - **Security Practices**: Data is encrypted in transit (HTTPS/SSL). Users can request account and data deletion at any time.
*   **Support/Contact Email**: `support@wibawanusantara.com`

---

## 4. App Access & Review Instructions (Crucial for Google Approval)

If your app requires logging in (which WIBAWA NUSANTARA does), you **MUST** provide test credentials to the Google App Reviewers to prevent rejection:

*   **Access Instructions**:
    ```text
    Platform ini memerlukan otentikasi login. Harap gunakan akun demonstrasi / penguji (test account) yang kami sediakan untuk memeriksa seluruh fitur sosial media, obrolan realtime, pembuatan postingan, dan transaksi marketplace secara lengkap.
    ```
*   **Google Reviewer Demo Account**:
    - **Test Email**: `reviewer@wibawanusantara.com`
    - **Test Password**: `ReviewerWibawa2026!`
    *(Ensure this account is registered in Supabase Auth and has profiles roles set correctly beforehand)*

---

## 5. Build Artifact Info (AAB)

*   **Signing Standard**: Android App Bundle signed with Google Play App Signing key.
*   **Version Name**: `1.0.0`
*   **Version Code**: `1` (Increment with every build update)
*   **Target SDK**: Android 13.0 (API Level 33) or higher (Standard requirement for Google Play Console submissions).
