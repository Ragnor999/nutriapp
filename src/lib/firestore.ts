import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from './firebase';
import type { ParsedAnalysis } from "@/components/NutrientAnalysis";
import type { MacroNutrients } from "./types";

// Save nutrient data for a specific user
export const saveNutrientData = async (userId: string, data: ParsedAnalysis) => {
  if (!userId) {
    throw new Error("User ID is required to save nutrient data.");
  }
  
  const macros: MacroNutrients = {
    protein: data.macros.find(m => m.name === 'Protein')?.value || 0,
    carbohydrates: data.macros.find(m => m.name === 'Carbs')?.value || 0,
    fat: data.macros.find(m => m.name === 'Fat')?.value || 0,
  };

  const docData = {
    userId, // Include the userId in the document
    date: Timestamp.now(),
    calories: data.calories,
    macros,
    micros: data.micros,
  };
  
  // Save to the top-level 'nutrientHistory' collection
  const historyCollectionRef = collection(db, 'nutrientHistory');
  await addDoc(historyCollectionRef, docData);
};
