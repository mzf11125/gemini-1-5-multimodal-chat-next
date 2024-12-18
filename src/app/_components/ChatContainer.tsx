"use client"; // components/ChatContainer.tsx
import React, { useRef, useEffect, useState, FormEvent } from "react";
import { Message, useChat } from "ai/react";
import { CommonForm } from "./CommonForm";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatList } from "./message";
import { convertFileToBase64 } from "@/lib/convert-file-to-base-64";

export const ChatContainer: React.FC = () => {
  const { messages, append, input, handleInputChange, setMessages, setInput } =
    useChat({
      id: "food-allergy-detector",
      api: "/api/chat", // Generic API endpoint
      body: {
        context: `
You are a food allergy detection assistant designed to help users identify potential allergens in food products. Your primary goal is to ensure the safety of individuals with food allergies by providing detailed information about ingredients. When a user provides a list of ingredients or an image of a food label, you will follow these steps:

List All Ingredients: Extract and display all ingredients found in the provided list or image.

Identify Common Allergens: Analyze the ingredients for the presence of common allergens, which include:

Peanuts
Tree Nuts
Milk
Eggs
Wheat
Soy
Fish
Shellfish
Provide Danger Levels: For each identified allergen, indicate the danger level based on the severity of reactions typically associated with that allergen. Use a scale of 1 to 5, where:

1: Mild (e.g., slight irritation)
2: Moderate (e.g., hives, stomach upset)
3: Significant (e.g., difficulty breathing, swelling)
4: Severe (e.g., anaphylaxis risk)
5: Life-threatening (e.g., immediate medical attention required)
Warnings for Potential Allergens: Provide clear warnings for any allergens present, emphasizing the need for caution.

Alternative Ingredient Suggestions: Offer suggestions for alternative ingredients that are safe for individuals with specific allergies.

Answer Questions: Respond to any questions related to food allergies and ingredients, providing accurate and helpful information.

Example Output Table
| Ingredient | Allergen Present | Danger Level (1-5) | Warning | Alternative Suggestions | |------------------|------------------|---------------------|----------------------------------|-------------------------------| | Almond Milk | Tree Nuts | 3 | Contains tree nuts. | Oat milk, coconut milk | | Wheat Flour | Wheat | 4 | Contains gluten. | Almond flour, rice flour | | Egg Whites | Eggs | 4 | Contains eggs. | Flaxseed meal, aquafaba | | Soy Sauce | Soy | 3 | Contains soy. | Coconut aminos, tamari | | Shrimp | Shellfish | 5 | High risk of anaphylaxis. | Tofu, chicken (if not allergic) |
    `,
      },
    });

  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmitForm = async (
    e: FormEvent<HTMLFormElement>,
    files?: File[]
  ) => {
    e.preventDefault();
    setLoading(true);
    setTyping(true);

    let imageBase64: string | null = null;
    let mediaType: string | null = null;

    if (files && files.length > 0) {
      for (const file of files) {
        const { base64 } = await convertFileToBase64(file);
        if (file.type.startsWith("image/")) {
          imageBase64 = base64;
          mediaType = file.type;
        }
      }
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: input,
      role: "user",
      data: {
        image: imageBase64,
      },
    };

    const options = {
      data: {
        media: imageBase64 || "",
        media_types: mediaType || "",
      },
    };

    setInput("");
    setLoading(false);
    await append(newMessage, options);
    setTyping(false);
  };

  return (
    <div className="flex flex-col h-[90vh] md:h-[95vh]">
      <div className="flex flex-col flex-1 overflow-hidden">
        {messages.length > 0 && (
          <div className="flex p-4">
            <Button
              variant="destructive"
              type="button"
              size="sm"
              onClick={() => setMessages([])}
            >
              <ShieldAlert className="mr-2" />
              Clear Allergy Check History
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <ChatList messages={messages} typing={typing} />
          <div ref={messagesEndRef} />
        </div>
        <CommonForm
          value={input}
          loading={loading}
          onInputChange={handleInputChange}
          onFormSubmit={handleSubmitForm}
          placeholder="Enter food ingredients or upload an image of a food label"
        />
      </div>
    </div>
  );
};

// "use client";
// import React, { useRef, useEffect, useState, FormEvent } from "react";
// import { Message, useChat } from "ai/react";
// import { CommonForm } from "./CommonForm";
// import { ShieldAlert } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { ChatList } from "./message";
// import { convertFileToBase64 } from "@/lib/convert-file-to-base-64";

// export const ChatContainer: React.FC = () => {
//   const { messages, append, input, handleInputChange, setMessages, setInput } =
//     useChat({
//       id: "food-allergy-detector",
//       api: "/api/chat",
//       body: {
//         context: `You are a food allergy detection assistant...`, // Full context preserved
//       },
//     });

//   const [loading, setLoading] = useState(false);
//   const [typing, setTyping] = useState(false);
//   const [imageBase64, setImageBase64] = useState<string | null>(null);
//   const [detectedItems, setDetectedItems] = useState<any[]>([]);

//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Handle file upload and conversion
//   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       const file = e.target.files[0];
//       const { base64 } = await convertFileToBase64(file);
//       setImageBase64(base64);
//     }
//   };

//   // Submit handler
//   const handleSubmitForm = async (
//     e: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
//     files?: File[]
//   ) => {
//     e.preventDefault();
//     setLoading(true);
//     setTyping(true);

//     let mediaBase64 = imageBase64;

//     const newMessage: Message = {
//       id: `msg-${Date.now()}`,
//       content: input,
//       role: "user",
//       data: {
//         image: mediaBase64,
//       },
//     };

//     const options = {
//       data: {
//         media: mediaBase64 || "",
//         media_types: "image/png", // Update for actual file type
//       },
//     };

//     try {
//       // Append user message
//       const result = await append(newMessage, options);

//       // Process response from backend
//       if (result?.data) {
//         const { detectedItems: items } = result.data;
//         setDetectedItems(items || []);
//       } else {
//         setDetectedItems([]);
//       }
//     } catch (error) {
//       console.error("Error during analysis:", error);
//       setDetectedItems([]);
//     } finally {
//       setLoading(false);
//       setTyping(false);
//       setInput("");
//     }
//   };

//   return (
//     <div className="flex flex-col h-[90vh] md:h-[95vh] bg-gray-50 p-4">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold">Food Allergy Detector</h1>
//         <Button
//           variant="destructive"
//           onClick={() => {
//             setMessages([]);
//             setDetectedItems([]);
//             setImageBase64(null);
//           }}
//         >
//           <ShieldAlert className="mr-2" />
//           Clear History
//         </Button>
//       </div>

//       {/* Content */}
//       <div className="flex-1 flex gap-4">
//         {/* Left Side: Image Upload */}
//         <div className="w-1/2 p-4 border rounded bg-white">
//           <h2 className="text-lg font-semibold mb-4">Upload an Image</h2>
//           <input
//             type="file"
//             accept="image/*"
//             onChange={handleImageUpload}
//             className="mb-4"
//           />
//           {imageBase64 && (
//             <img
//               src={imageBase64}
//               alt="Uploaded"
//               className="w-full h-auto rounded mb-4"
//             />
//           )}
//           <Button
//             onClick={(e) => handleSubmitForm(e as any)} // Pass event to mimic form submit
//             disabled={!imageBase64 || loading}
//           >
//             {loading ? "Analyzing..." : "Analyze"}
//           </Button>
//         </div>

//         {/* Right Side: Results */}
//         <div className="w-1/2 p-4 border rounded bg-white">
//           <h2 className="text-lg font-semibold mb-4">Detected Items</h2>
//           {detectedItems.length > 0 ? (
//             <ul className="space-y-2">
//               {detectedItems.map((item, idx) => (
//                 <li
//                   key={idx}
//                   className="flex justify-between border-b pb-2 last:border-b-0"
//                 >
//                   <span>{item.name}</span>
//                   <span className="text-gray-500">{item.confidence}%</span>
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p className="text-gray-500">No analysis yet. Upload an image!</p>
//           )}
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="mt-4">
//         <CommonForm
//           value={input}
//           loading={loading}
//           onInputChange={handleInputChange}
//           onFormSubmit={handleSubmitForm}
//           placeholder="Enter ingredients or upload an image above"
//         />
//       </div>
//     </div>
//   );
// };
