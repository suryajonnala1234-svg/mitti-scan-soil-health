# Sample Soil Health Card Data for Testing

## 🎯 Quick Start Guide

The application now processes OCR **directly in your browser** for better reliability. Simply upload a clear photo of your Government Soil Health Card and the system will extract nutrient values automatically.

## 📋 Government Soil Health Card Format

The app is designed to work with the official **Government of India Soil Health Card** which contains:

### Soil Test Results Section:
1. **pH** - Soil acidity/alkalinity level
2. **EC** - Electrical Conductivity  
3. **Organic Carbon (OC)** - Organic matter content
4. **Available Nitrogen (N)** - In kg/ha
5. **Available Phosphorus (P)** - In kg/ha
6. **Available Potassium (K)** - In kg/ha
7. **Available Sulphur (S)**
8. **Available Zinc (Zn)**
9. **Available Boron (B)**
10. **Available Iron (Fe)**
11. **Available Manganese (Mn)**
12. **Available Copper (Cu)**

### For Best OCR Results:
- ✅ Take a clear, well-lit photo of the card
- ✅ Ensure the "Soil Test Results" table is visible
- ✅ Keep the card flat (avoid shadows and glare)
- ✅ Higher resolution images work better
- ✅ The OCR focuses on extracting: **N, P, K, OC, and pH**

## 🔧 Testing with Real Card

### Step 1: Upload Your Card
1. Login to the app
2. Navigate to Scanner page
3. Click "Upload Image" or "Capture Photo"
4. Select your Soil Health Card image

### Step 2: OCR Processing
- Wait 10-30 seconds for browser-based OCR
- Progress bar will show extraction status
- OCR extracts values automatically

### Step 3: Verify & Correct
- Review extracted values in the form
- **Important:** Manually correct any inaccurate values
- Select your crop type
- Enter farm size in acres
- Submit for analysis

## 📊 Understanding Card Values

### Typical Ranges:
- **pH**: 4.5 - 9.0 (Ideal: 6.0 - 7.5)
- **N (Nitrogen)**: 0 - 500 kg/ha
- **P (Phosphorus)**: 0 - 100 kg/ha  
- **K (Potassium)**: 0 - 300 kg/ha
- **OC (Organic Carbon)**: 0 - 2.0%

---

# Sample Test Cases (Manual Entry)

## Test Case 1: Deficient Soil (Wheat)
```
Soil Health Card
-----------------
Farmer Name: Test Farmer
Village: Test Village
State: Test State

Nutrient Analysis:
- Nitrogen (N): 150 kg/ha
- Phosphorus (P): 30 kg/ha
- Potassium (K): 80 kg/ha
- Organic Carbon (OC): 0.45%
- pH: 7.2

Date: 14-02-2026
```

**Expected Analysis:**
- Nitrogen: Low (46% deficiency)
- Phosphorus: Critical (50% deficiency)
- Potassium: Low (43% deficiency)
- Organic Carbon: Low (40% deficiency)
- pH: Low

**Recommended for 5 acres of Wheat:**
- Neem Coated Urea
- Single Super Phosphate (SSP)
- Muriate of Potash (MOP)
- Vermicompost
- Agricultural Lime

---

## Test Case 2: Optimal Soil (Rice)
```
Soil Health Card
-----------------
Farmer Name: Happy Farmer
Village: Greenland
State: Punjab

Nutrient Analysis:
- Nitrogen (N): 125 kg/ha
- Phosphorus (P): 65 kg/ha
- Potassium (K): 62 kg/ha
- Organic Carbon (OC): 0.85%
- pH: 6.1

Date: 14-02-2026
```

**Expected Analysis:**
- All nutrients: Optimal
- No fertilizers needed

---

## Test Case 3: Critical Deficiency (Cotton)
```
Soil Health Card
-----------------
Farmer Name: Poor Soil Farmer
Village: Dry Land
State: Maharashtra

Nutrient Analysis:
- Nitrogen (N): 50 kg/ha
- Phosphorus (P): 20 kg/ha
- Potassium (K): 25 kg/ha
- Organic Carbon (OC): 0.3%
- pH: 8.5

Date: 14-02-2026
```

**Expected Analysis:**
- Nitrogen: Critical (58% deficiency)
- Phosphorus: Critical (67% deficiency)
- Potassium: Critical (58% deficiency)
- Organic Carbon: Critical (60% deficiency)
- pH: Critical

**Urgent fertilizer intervention required!**

---

## How to Use These Test Cases

### Method 1: Manual Entry
1. Login to the app
2. Click "Scan Soil Card"
3. Upload any image (the OCR might not extract perfectly)
4. In the verification form, manually enter the values from above
5. Select the crop mentioned in the test case
6. Enter farm size (e.g., 5 acres)
7. Submit and view results

### Method 2: OCR Testing
Create a simple image with the text from above using:
- MS Paint / PowerPoint
- Take a clear photo of the printed text
- Use any image editor to create a mock soil health card

**Tips for Better OCR Results:**
- Use clear, high-contrast text
- Avoid handwritten text (use printed)
- Good lighting when capturing photos
- Keep the card flat and aligned

---

## Understanding the Results

### Deficiency Status
- **Optimal**: Nutrient level is sufficient (0-20% below ideal)
- **Low**: Moderate deficiency (20-40% below ideal)
- **Critical**: Severe deficiency (>40% below ideal)

### Fertilizer Calculations
The app calculates fertilizer quantities based on:
1. Actual deficiency amount
2. Farm size in acres
3. Fertilizer nutrient content (%N, %P, %K)
4. Recommended application rates

### Cost Estimates
- All prices are approximate market rates in INR
- Prices may vary by location and season
- Bulk purchase may offer discounts

---

## Quick Testing Workflow

```
1. Login with any 10-digit number (e.g., 9876543210)
2. Go to Dashboard
3. Click "Scan Soil Card"
4. Upload any image or capture camera
5. Wait for OCR processing
6. Manually correct values using Test Case 1
7. Select "Wheat" as crop
8. Enter "5" acres
9. Submit and view beautiful results!
```

---

## Expected Output for Test Case 1 (Wheat, 5 acres)

### Fertilizer Recommendations:
1. **Single Super Phosphate** - Priority 1 (Critical P deficiency)
2. **Muriate of Potash** - Priority 2 (Low K deficiency)
3. **Neem Coated Urea** - Priority 3 (Low N deficiency)
4. **Vermicompost** - Priority 4 (For OC)
5. **Agricultural Lime** - Priority 5 (pH correction)

Total Cost: Approximately ₹8,000 - ₹12,000 for 5 acres

---

## Notes for Developers

- The OCR extraction uses regex patterns to find nutrient values
- Patterns look for keywords like "Nitrogen:", "N:", "Phosphorus:", "P:", etc.
- If OCR doesn't work well, that's expected - the verification screen allows manual correction
- This is a demo/MVP - production would need better OCR models or API integration

---

Happy Testing! 🌾
