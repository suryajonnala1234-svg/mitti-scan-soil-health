# 🌾 Mitti-Scan - Soil Health Card Digitizer & Actionizer

A comprehensive MERN stack web application that empowers farmers by digitizing Government Soil Health Cards using OCR technology and providing crop-specific fertilizer recommendations with cost estimates.

## 🚀 Features

### 1. **Authentication System**
- Simple farmer login using mobile number (10 digits)
- JWT-based session management
- No OTP required for quick access

### 2. **Soil Card Scanner**
- **Camera Capture**: Use device camera to scan soil health cards
- **File Upload**: Upload existing images from gallery
- **OCR Processing**: Automatic extraction of soil nutrient values using Tesseract.js
- Extracts: Nitrogen (N), Phosphorus (P), Potassium (K), Organic Carbon (OC), and pH

### 3. **Verification & Editing**
- Review OCR-extracted values in an editable form
- Manual correction of any inaccurate data
- Crop selection (Wheat, Rice, Cotton, Maize)
- Farm size input (in acres)

### 4. **Smart Nutrient Analysis**
- Rule-based logic engine comparing soil values with crop-specific ideal standards
- Identifies nutrient deficiencies with severity levels (Low, Critical, Optimal)
- Priority-based deficiency ranking

### 5. **Fertilizer Recommendation Engine**
- Maps deficiencies to specific fertilizer products:
  - Low Nitrogen → Neem Coated Urea
  - Low Phosphorus → Single Super Phosphate (SSP)
  - Low Potassium → Muriate of Potash (MOP)
  - Low Organic Carbon → Vermicompost
  - Acidic Soil → Agricultural Lime
- Calculates required quantity (in bags)
- Provides total cost estimates in INR

### 6. **Interactive Dashboard**
- **Nutrient Health Gauges**: Visual circular gauges showing current vs ideal levels
- **Comparison Charts**: Bar charts comparing nutrient levels
- **Scan History**: View all previous scans
- **Shopping List**: Summary of recommended fertilizers with costs

## 🛠️ Tech Stack

### Frontend
- **React.js** (functional components with hooks)
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (agriculture-themed custom styling)
- **Framer Motion** (smooth animations)
- **Recharts** (data visualization)
- **React Webcam** (camera integration)
- **Lucide React** (modern icons)
- **Axios** (API calls)

### Backend
- **Node.js**
- **Next.js API Routes** (RESTful APIs)
- **Tesseract.js** (OCR processing)
- **MongoDB** (database)
- **Mongoose** (ODM)
- **JWT** (authentication)

## 📁 Project Structure

```
Mitti-Scan/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── login/route.ts          # Authentication endpoint
│   │   └── scan/
│   │       ├── ocr/route.ts            # OCR processing
│   │       ├── verify/route.ts         # Save and analyze scan
│   │       ├── history/route.ts        # Get scan history
│   │       └── [id]/route.ts           # Get specific scan
│   ├── dashboard/page.tsx              # Main dashboard
│   ├── login/page.tsx                  # Login page
│   ├── scanner/page.tsx                # Scanning interface
│   ├── result/[id]/page.tsx            # Analysis results
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Home page
│   └── globals.css                     # Global styles
├── components/
│   ├── Scanner.tsx                     # Camera/upload component
│   ├── VerifyForm.tsx                  # Data verification form
│   ├── NutrientGauge.tsx              # Circular gauge visualization
│   └── FertilizerCard.tsx             # Fertilizer recommendation card
├── contexts/
│   └── AuthContext.tsx                 # Authentication context
├── lib/
│   ├── mongodb.ts                      # MongoDB connection
│   ├── jwt.ts                          # JWT utilities
│   ├── nutrientAnalysis.ts            # Soil analysis logic
│   └── fertilizerRecommendation.ts    # Fertilizer calculation
├── models/
│   ├── User.ts                         # User schema
│   └── SoilScan.ts                    # Soil scan schema
├── .env.local                          # Environment variables
├── package.json                        # Dependencies
└── README.md                           # This file
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- pnpm package manager
- MongoDB Atlas account (or local MongoDB)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd Mitti-Scan---Soil-Health-Card-Digitizer-Actionizer
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Environment Variables
The `.env.local` file is already configured with:
```env
MONGODB_URI=your_mongodb_uri_here
JWT_SECRET=mitti_scan_agritech_2026_soil_health_secure_jwt_secret_key_9x7z4m2p
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 4: Run Development Server
```bash
pnpm dev
```

The application will start on `http://localhost:3000` (or port 3001 if 3000 is in use).

## 📱 Usage Flow

1. **Login**: Enter your name and 10-digit mobile number
2. **Dashboard**: View your scan history and start new scans
3. **Scanner**: 
   - Choose to capture photo or upload image
   - OCR automatically extracts soil data
4. **Verify**: 
   - Review and edit extracted values
   - Select your crop
   - Enter farm size
5. **Results**:
   - View nutrient health gauges
   - See comparison charts
   - Get fertilizer recommendations
   - View total cost estimate

## 🎨 Design Features

### Agriculture-Themed UI
- **Color Palette**:
  - Leaf Green: `#6b8e23`
  - Harvest Gold: `#f4a460`
  - Soil Brown: `#8b4513`
  - Earth Tones: Orange and Yellow gradients
  
### Animations
- Floating plant icons on login page
- Growing/scaling effects on hover
- Smooth page transitions with Framer Motion
- Circular progress animations on gauges
- Card hover effects

### Responsive Design
- Mobile-first approach
- Works seamlessly on phones, tablets, and desktops
- Touch-friendly interface for farmers

## 🗄️ Database Schema

### User Model
```typescript
{
  name: String (required)
  phone: String (required, unique, 10 digits)
  createdAt: Date (default: now)
}
```

### SoilScan Model
```typescript
{
  userId: ObjectId (ref: User)
  crop: String (enum: Wheat, Rice, Cotton, Maize)
  farmSize: Number (acres)
  soilValues: {
    N: Number (kg/ha)
    P: Number (kg/ha)
    K: Number (kg/ha)
    OC: Number (%)
    pH: Number
  }
  deficiencies: [{
    nutrient: String
    status: String (Low, Critical, Optimal)
    deficiency: Number (percentage)
  }]
  recommendations: [{
    fertilizer: String
    quantity: Number
    unit: String
    cost: Number (INR)
    priority: Number
  }]
  createdAt: Date (default: now)
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login/Register farmer

### Scanning
- `POST /api/scan/ocr` - Process image with OCR
- `POST /api/scan/verify` - Save and analyze scan
- `GET /api/scan/history` - Get user's scan history
- `GET /api/scan/:id` - Get specific scan details

## 🌾 Crop Standards

Pre-configured ideal nutrient levels for:
- **Wheat**: N=280, P=60, K=140, OC=0.75%, pH=6.5
- **Rice**: N=120, P=60, K=60, OC=0.8%, pH=6.0
- **Cotton**: N=120, P=60, K=60, OC=0.75%, pH=6.5
- **Maize**: N=150, P=75, K=75, OC=0.75%, pH=6.0

## 💰 Fertilizer Pricing

- **Neem Coated Urea**: ₹300 per 50kg bag
- **Single Super Phosphate**: ₹400 per 50kg bag
- **Muriate of Potash**: ₹1,200 per 50kg bag
- **Vermicompost**: ₹250 per 40kg bag
- **Agricultural Lime**: ₹200 per 50kg bag

## 🎯 Key Highlights

✅ **No ML/AI Black Box** - Uses transparent rule-based logic  
✅ **Offline-capable OCR** - Tesseract.js runs in browser  
✅ **No SMS Costs** - Simple login without OTP  
✅ **Farmer-friendly** - Simple language and intuitive UI  
✅ **Cost-effective** - Shows exact investment needed  
✅ **Crop-specific** - Tailored recommendations  
✅ **Production-ready** - Complete error handling and validation  

## 🤝 Contributing

This is a hackathon/demo project. Feel free to fork and enhance it!

## 📄 License

MIT License

## 👨‍💻 Developer

Built with ❤️ for farmers using modern web technologies.

---

**Made for AgriTech Innovation** 🌱
