import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from './firebase';
import type { ParsedAnalysis } from "@/components/NutrientAnalysis";
import type { MacroNutrients } from "./types";

// Save nutrient data for a specific user
export const saveNutrientData = async (userId: string, data: ParsedAnalysis) => {
  const macros: MacroNutrients = {
    protein: data.macros.find(m => m.name === 'Protein')?.value || 0,
    carbohydrates: data.macros.find(m => m.name === 'Carbs')?.value || 0,
    fat: data.macros.find(m => m.name === 'Fat')?.value || 0,
  };

  const docData = {
    date: Timestamp.now(),
    calories: data.calories,
    macros,
    micros: data.micros,
  };
  
  // Save to the sub-collection within the user's document
  const historyCollectionRef = collection(db, 'users', userId, 'nutrientHistory');
  await addDoc(historyCollectionRef, docData);
};
