import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

export interface StyleOptions {
  hairLength?: string;
  hairColor?: string;
}

/**
 * Strips the Data URI prefix (e.g., "data:image/jpeg;base64,") to get raw base64.
 */
const cleanBase64 = (base64Str: string) => {
  return base64Str.split(',')[1] || base64Str;
};

/**
 * Gets the mime type from a base64 string or defaults to image/jpeg
 */
const getMimeType = (base64Str: string) => {
  const match = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  return match ? match[1] : 'image/jpeg';
};

/**
 * Generates a random integer for the seed to ensure variability.
 */
const getRandomSeed = () => Math.floor(Math.random() * 1000000000);

export const generateHairSwap = async (
  userImageBase64: string,
  styleImageBase64: string,
  options?: StyleOptions
): Promise<string> => {
  // Initialize AI client per request to grab the latest API Key
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("No API Key found. Please set your Gemini API Key.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const userMime = getMimeType(userImageBase64);
  const styleMime = getMimeType(styleImageBase64);

  // Construct dynamic instructions based on user options
  let styleInstruction = "2. Identify the hairstyle in the SECOND image and apply it to the person in the FIRST image.";

  // Even if options are passed, for Swap, we generally prioritize the reference image unless specific overrides are requested.
  // Based on new requirements, preferences are primarily for 'Lucky', but we keep logic here just in case.
  if (options?.hairColor) {
    styleInstruction += ` IMPORTANT: Change the hair color to ${options.hairColor}.`;
  } else {
    styleInstruction += ` IMPORTANT: Keep the hair color of the person in the FIRST image (the user), DO NOT use the color from the second image unless it is critical to the style structure.`;
  }

  if (options?.hairLength) {
    styleInstruction += ` IMPORTANT: Adjust the hair length to be ${options.hairLength}.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: `You are an expert hair stylist and photo editor. 
            Instructions: 
            1. Identify the person in the FIRST image. 
            ${styleInstruction}
            3. Generate a NEW, photorealistic image.
            4. Maintain the person's facial features, identity, skin tone, lighting, and background from the first image exactly. Only change the hair.
            5. Make sure the result looks different from previous generations if called multiple times.`
          },
          {
            inlineData: {
              mimeType: userMime,
              data: cleanBase64(userImageBase64),
            },
          },
          {
            inlineData: {
              mimeType: styleMime,
              data: cleanBase64(styleImageBase64),
            },
          },
        ],
      },
      config: {
        seed: getRandomSeed(), // Ensure variability
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Swap API Error:", error);
    throw new Error("Failed to generate hairstyle swap. Please try again.");
  }
};

export const generateDescriptionStyle = async (
  userImageBase64: string,
  prompt: string,
  options?: StyleOptions
): Promise<string> => {
  // Initialize AI client per request
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("No API Key found. Please set your Gemini API Key.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const userMime = getMimeType(userImageBase64);

  let specificDetails = "";
  if (options?.hairColor) {
    specificDetails += ` The hair color MUST be ${options.hairColor}.`;
  } else {
    specificDetails += ` Maintain the original hair color from the provided image.`;
  }

  if (options?.hairLength) {
    specificDetails += ` The hair length MUST be ${options.hairLength}.`;
  } else {
    specificDetails += ` Maintain the original hair length unless the prompt "${prompt}" explicitly implies a different length.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: `You are an expert hair stylist and photo editor. 
            Instructions: 
            1. Identify the person in the provided image. 
            2. Generate a NEW, photorealistic image of this person wearing the hairstyle described as: "${prompt}". 
            3. ${specificDetails}
            4. Maintain the person's facial features, identity, skin tone, lighting, and background from the original image exactly. Only change the hair.`
          },
          {
            inlineData: {
              mimeType: userMime,
              data: cleanBase64(userImageBase64),
            },
          },
        ],
      },
      config: {
        seed: getRandomSeed(), // Ensure variability
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Text Style API Error:", error);
    throw new Error("Failed to generate hairstyle from description. Please try again.");
  }
};

export const generateLuckyLook = async (
  userImageBase64: string,
  options?: StyleOptions
): Promise<string> => {
  // Initialize AI client per request
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    throw new Error("No API Key found. Please set your Gemini API Key.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const userMime = getMimeType(userImageBase64);

  let constraints = "";
  if (options?.hairColor) {
    constraints += `The new style MUST have ${options.hairColor} hair color. `;
  } else {
    constraints += `Keep the hair color close to the original. `;
  }

  if (options?.hairLength) {
    constraints += `The length MUST be ${options.hairLength}. `;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: `You are a world-class hair stylist. 
            Instructions: 
            1. Analyze the face shape and features of the person in this image. 
            2. Generate a NEW, photorealistic image of this person with a brand new hairstyle that perfectly suits their face shape.
            3. ${constraints}
            4. The new style should be trendy and flattering. Make it distinct from the original.
            5. Maintain the person's facial identity, skin tone, and background. Only change the hair.`
          },
          {
            inlineData: {
              mimeType: userMime,
              data: cleanBase64(userImageBase64),
            },
          },
        ],
      },
      config: {
        seed: getRandomSeed(), // Ensure variability
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini Lucky API Error:", error);
    throw new Error("Failed to generate lucky hairstyle. Please try again.");
  }
};

// Helper to find the image part in the response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractImageFromResponse = (response: any): string => {
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates returned from Gemini.");
  }

  const parts = candidates[0].content.parts;
  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }

  // If we only got text back (refusal or description), throw error
  const textPart = parts.find((p: any) => p.text);
  if (textPart) {
    throw new Error(`Model returned text instead of image: ${textPart.text}`);
  }

  throw new Error("No image data found in response.");
};