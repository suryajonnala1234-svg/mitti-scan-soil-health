import { NextRequest, NextResponse } from 'next/server';

// Vision AI Extraction - Most Accurate Method
export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Check for OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        fallbackToOCR: true 
      }, { status: 400 });
    }

    // Call OpenAI GPT-4 Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Latest vision model
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert at extracting data from Indian Soil Health Cards. Analyze this image and extract ALL information in JSON format.

CRITICAL INSTRUCTIONS:
1. Extract EVERY soil parameter you can see (pH, EC, OC, N, P, K, S, Zn, B, Fe, Mn, Cu, Ca, Mg, Mo, etc.)
2. Include the numeric value, unit, and rating (High/Medium/Low) for each parameter
3. Extract farmer details (name, father's name, mobile, sample number, survey number)
4. Extract location (village, taluk, district, state, pincode)
5. Extract any recommendations you see
6. If a value is not visible, omit that field - DO NOT make up data

Return ONLY valid JSON in this exact structure:
{
  "confidence": "High" | "Medium" | "Low",
  "farmerDetails": {
    "Farmer Name": "string",
    "Father Name": "string",
    "Sample Number": "string",
    "Mobile Number": "string",
    "Survey Number": "string"
  },
  "location": {
    "Village": "string",
    "Taluk/Tehsil": "string",
    "District": "string",
    "State": "string",
    "Pincode": "string"
  },
  "soilParameters": {
    "pH": { "value": "6.39", "unit": "", "rating": "Acidic" },
    "Electrical Conductivity (EC)": { "value": "0.37", "unit": "dS/m", "rating": "Normal" },
    "Organic Carbon (OC)": { "value": "0.40", "unit": "%", "rating": "Low" },
    "Nitrogen (N)": { "value": "305.00", "unit": "kg/ha", "rating": "Medium" },
    "Phosphorus (P)": { "value": "36.00", "unit": "kg/ha", "rating": "High" },
    "Potassium (K)": { "value": "69.00", "unit": "kg/ha", "rating": "Low" },
    "Sulphur (S)": { "value": "36.00", "unit": "ppm", "rating": "Sufficient" },
    (add all other parameters you see)
  },
  "recommendations": ["string array of recommendations"],
  "summary": "Brief summary of what you found"
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high' // High resolution analysis
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1 // Low temperature for consistent extraction
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json({ 
        error: 'Vision API failed', 
        fallbackToOCR: true 
      }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON response
    let extractedData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Vision API response:', content);
      return NextResponse.json({ 
        error: 'Failed to parse extracted data', 
        rawResponse: content,
        fallbackToOCR: true 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      method: 'vision-ai',
      model: 'gpt-4o'
    });

  } catch (error: any) {
    console.error('Vision extraction error:', error);
    return NextResponse.json({ 
      error: error.message,
      fallbackToOCR: true 
    }, { status: 500 });
  }
}
