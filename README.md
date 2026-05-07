<div align="center">

<img src="https://placehold.co/900x300/1D9E75/ffffff?text=ShelfSense&font=montserrat" alt="ShelfSense Banner" width="100%" />

<br />
<br />

# 🥬 ShelfSense

**Smart Pantry & Food Waste Reduction System**

*Stop forgetting. Start using. Waste less.*

<br />

![Expo](https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white)
![Upstash](https://img.shields.io/badge/Upstash-00E9A3?style=flat-square&logo=upstash&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

<br />

[![iOS](https://img.shields.io/badge/iOS-compatible-lightgrey?style=flat-square&logo=apple)](/)
[![Android](https://img.shields.io/badge/Android-compatible-lightgrey?style=flat-square&logo=android)](/)
[![Web](https://img.shields.io/badge/Web-PWA-lightgrey?style=flat-square&logo=googlechrome)](/)

</div>

---

> *"In the Philippines, plate waste has grown by 69% in just five years —*
> *not out of carelessness, but simply because we forget what's already there."*
>
> — **DOST-FNRI**, 2023 National Nutrition Survey

---

## 🚨 The Problem

Every day, **2,175 tons of food** are thrown away in Metro Manila alone —
while nearly **30% of Filipinos still go hungry**.

It doesn't start at the trash bin.
**It starts at home** — with food pushed to the back of the pantry,
expiration dates no one checked, and no idea what to cook with
what's already there.

<br />

<div align="center">

| 🏠 Household | 🏙️ Metro Manila | 🇵🇭 Philippines |
|:---:|:---:|:---:|
| **+69%** | **2,175 tons/day** | **2.95M tonnes/year** |
| rise in plate waste since 2018 | of food trashed daily | wasted nationwide |
| *DOST-FNRI, 2023* | *Barrion et al., 2023* | *UNEP 2024* |

</div>

---

## 😩 Sound Familiar?

You've probably been here before:

- 🧊 You open the fridge and find something expired — and you don't even remember buying it
- 🛒 You buy groceries, then realize you already have the same thing at home
- 😩 It's 7pm, you're hungry, and you have no idea what to cook with what's left
- 📦 Something gets pushed to the back of the shelf — and surfaces weeks later, too late

**ShelfSense was built for exactly those moments.**

---

## 📸 Screenshots

<div align="center">

| Pantry Overview | Expiry Tracker | Recipe Suggestions | Chef Sage AI |
|:---:|:---:|:---:|:---:|
| <img src="https://placehold.co/200x400/e8f5e9/1D9E75?text=Pantry+View&font=montserrat" /> | <img src="https://placehold.co/200x400/e8f5e9/1D9E75?text=Expiry+Tracker&font=montserrat" /> | <img src="https://placehold.co/200x400/e8f5e9/1D9E75?text=Recipes&font=montserrat" /> | <img src="https://placehold.co/200x400/e8f5e9/1D9E75?text=Chef+Sage&font=montserrat" /> |

> 📷 *Replace placeholders with actual app screenshots*

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📦 **Pantry at a glance** | See everything you have, what's expiring soon, and what to use first |
| 📷 **Barcode & expiry scanning** | Scan barcodes or let AI read expiry dates — even when labels are worn or unclear |
| 🍳 **Smart recipe suggestions** | Get recipe ideas built around what you already have, prioritizing near-expiry items |
| 🤖 **Chef Sage AI assistant** | Ask *"what can I cook tonight?"* and get personalized answers based on your actual pantry |
| 🔔 **Expiry alerts** | Get notified before food goes bad so you can act on it, not throw it out |
| 📱 **Works everywhere** | Available on iOS, Android, and as a Web PWA — one app, all platforms |

---

## 🛠️ Tech Stack

ShelfSense is a cross-platform mobile and web app built with modern tools:

### 📱 App Framework
| Tool | Purpose |
|---|---|
| **Expo + React Native** | Build one app that runs on iOS, Android, and Web |
| **React Navigation v7** | Screen navigation with tabs and stacks |
| **Plus Jakarta Sans** | Clean, modern font across the app |

### 🤖 AI & Scanning
| Tool | Purpose |
|---|---|
| **Google Gemini** | Powers Chef Sage (AI assistant) and reads expiry dates from camera images |
| **expo-camera** | Native barcode and expiry date scanning on mobile |
| **html5-qrcode** | Barcode scanning on the web version |

### 🗄️ Storage & Database
| Tool | Purpose |
|---|---|
| **Firebase** | Cloud database and backend — stores pantry data across devices |
| **Upstash** | Fast Redis-style database for server-side operations |
| **AsyncStorage** | Keeps data available offline on the user's device |

### 🔐 Auth & Security
| Tool | Purpose |
|---|---|
| **JWT (jsonwebtoken)** | Secure token-based login sessions |
| **bcryptjs** | Hashes and protects user passwords |

### 🚀 Deployment
| Tool | Purpose |
|---|---|
| **Vercel** | Hosts the web app and serverless API functions |
| **Expo Export** | Builds and packages the app for all platforms |

### 🧰 Utilities
`date-fns` — date formatting and expiry calculations &nbsp;|&nbsp; `uuid` — unique IDs for pantry items

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+`
- Expo CLI — `npm install -g expo-cli`
- A `.env` file based on `.env.example`

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/shelfsense.git
cd shelfsense

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your API keys (Gemini, Firebase, Upstash, JWT)

# Start the app
npx expo start

# Run the API server (separate terminal)
npm run api
```

### Environment Variables

```env
GEMINI_API_KEY=your_gemini_key
FIREBASE_API_KEY=your_firebase_key
UPSTASH_REDIS_URL=your_upstash_url
UPSTASH_REDIS_TOKEN=your_upstash_token
JWT_SECRET=your_jwt_secret
```

---

## 👥 Who This Is For

> For the **college student** living alone, juggling deadlines and groceries.
> For the **parent** trying to stretch the family budget a little further.
> For the **working professional** who meal preps but forgets what's in the fridge.
> For anyone who has ever opened their pantry and asked —
> *"Wait, when did I buy this?"*

---

## 💚 The Bottom Line

Food waste is not a trash problem. **It's an awareness problem.**

> *Food waste doesn't start at the trash bin.*
> *It starts the moment we stop paying attention.*
> **ShelfSense gives that attention back — one pantry at a time.**

---

<div align="center">

Made with 💚 for Filipino households &nbsp;·&nbsp; Hackathon 2025

</div>
