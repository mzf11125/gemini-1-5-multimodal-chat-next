/* eslint-disable */

"use client"; // components/ChatContainer.tsx
import React, { useRef, useEffect, useState, FormEvent } from "react";
import { Message, useChat } from "ai/react";
import { CommonForm } from "./CommonForm";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatList } from "./message";
import { convertFileToBase64 } from "@/lib/convert-file-to-base-64";
import Webcam from "react-webcam";

export const ChatContainer: React.FC = () => {
  const { messages, append, input, handleInputChange, setMessages, setInput } =
    useChat({
      id: "food-allergy-detector",
      api: "/api/chat",
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
  const [showCamera, setShowCamera] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCapture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const base64 = imageSrc.split(",")[1];
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        content: input,
        role: "user",
        data: {
          image: base64,
        },
      };

      const options = {
        data: {
          media: base64,
          media_types: "image/jpeg",
        },
      };

      setInput("");
      setLoading(false);
      await append(newMessage, options);
      setTyping(false);
      setShowCamera(false);
    }
  };

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
    <div className="flex flex-col h-[90vh] md:h-[95vh] bg-gray-100 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Food Allergy Detector
        </h1>
        {messages.length > 0 && (
          <Button
            variant="destructive"
            type="button"
            size="sm"
            onClick={() => setMessages([])}
            className="flex items-center"
          >
            <ShieldAlert className="mr-2" />
            Clear History
          </Button>
        )}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden border rounded-lg bg-white p-6">
        <div className="flex-1 overflow-y-auto">
          <ChatList messages={messages} typing={typing} />
          <div ref={messagesEndRef} />
        </div>
        {showCamera && (
          <div className="flex flex-col items-center mt-4">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-64 rounded-lg mb-4"
            />
            <Button onClick={handleCapture} className="mb-4">
              Capture Photo
            </Button>
            <Button variant="secondary" onClick={() => setShowCamera(false)}>
              Cancel
            </Button>
          </div>
        )}
        <CommonForm
          value={input}
          loading={loading}
          onInputChange={handleInputChange}
          onFormSubmit={handleSubmitForm}
          placeholder="Enter food ingredients or upload an image of a food label"
          className="mt-4"
        />
        <Button
          variant="default"
          onClick={() => setShowCamera(true)}
          className="mt-4"
        >
          Use Camera
        </Button>
      </div>
    </div>
  );
};
