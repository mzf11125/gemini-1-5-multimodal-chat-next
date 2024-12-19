// api/chat/route.ts
import { GoogleGenerativeAIStream, Message, StreamingTextResponse } from "ai";
import {
  GoogleGenerativeAI,
  GenerateContentRequest,
  Part,
  Content,
} from "@google/generative-ai";
import { visionRequestSchema } from "@/lib/validate/vision-request-schema";

export const runtime = "edge";

export async function POST(req: Request) {
  const parseResult = visionRequestSchema.safeParse(await req.json());

  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: "Invalid request data" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const { messages, data } = parseResult.data;

  const parts: Part[] = [];

  if (data?.media) {
    parts.push({
      inlineData: {
        mimeType: data.media_types || "",
        data: data.media,
      },
    });
  }

  if (data?.audio) {
    parts.push({
      inlineData: {
        mimeType: "audio/mp3",
        data: data.audio,
      },
    });
  }

  const typedMessages = messages as Message[];

  const reqContent: GenerateContentRequest = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
You are a food allergy detection assistant designed to help users identify potential allergens in food products. Your primary goal is to ensure the safety of individuals with food allergies by providing detailed information about ingredients. When a user provides a list of ingredients or an image of a food label, you will follow these steps:

1. List All Ingredients: Extract and display all ingredients found in the provided list or image.
2. Identify Common Allergens: Analyze the ingredients for the presence of common allergens, such as:
   - Peanuts
   - Tree Nuts
   - Milk
   - Eggs
   - Wheat
   - Soy
   - Fish
   - Shellfish
3. Provide Danger Levels: For each identified allergen, indicate the danger level on a scale of 1 (mild) to 5 (life-threatening).
4. Warnings: Offer clear warnings for any allergens detected.
5. Alternatives: Suggest safe ingredient substitutions for individuals with allergies.

Example Response:
| Ingredient  | Allergen Present | Danger Level (1-5) | Warning                  | Alternative Suggestions |
|-------------|------------------|---------------------|--------------------------|-------------------------|
| Almond Milk | Tree Nuts        | 3                   | Contains tree nuts.      | Oat milk, coconut milk |
| Wheat Flour | Wheat            | 4                   | Contains gluten.         | Almond flour, rice flour |
| Egg Whites  | Eggs             | 4                   | Contains eggs.           | Flaxseed meal, aquafaba |
| Soy Sauce   | Soy              | 3                   | Contains soy.            | Coconut aminos, tamari |
| Shrimp      | Shellfish        | 5                   | High risk of anaphylaxis.| Tofu, chicken (if safe) |

Provide concise and accurate responses. Prioritize user safety.
        `,
          },
        ],
      },
      ...typedMessages.reduce<Content[]>((acc, m, index) => {
        if (m.role === "user") {
          const lastContent = acc[acc.length - 1];
          if (lastContent?.role === "user") {
            lastContent.parts.push({ text: m.content });
          } else {
            acc.push({
              role: "user",
              parts: [{ text: m.content }],
            });
          }

          if (index === typedMessages.length - 1) {
            acc[acc.length - 1]?.parts.push(...parts);
          }
        } else if (m.role === "assistant") {
          acc.push({
            role: "model",
            parts: [{ text: m.content }],
          });
        }

        return acc;
      }, []),
    ],
  };

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

  const geminiStream = await genAI
    .getGenerativeModel({
      model: "gemini-1.5-pro-latest",
    })
    .generateContentStream(reqContent);

  const stream = GoogleGenerativeAIStream(geminiStream);

  return new StreamingTextResponse(stream);
}
