import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from './firebase';
import type { ParsedAnalysis } from "@/components/NutrientAnalysis";
import type { NutrientData, MacroNutrients } from "./types";

// Save nutrient data for a specific user
export const saveNutrientData = async (userId: string, data: ParsedAnalysis) => {
  const macros: MacroNutrients = {
    protein: data.macros.find(m => m.name === 'Protein')?.value || 0,
    carbohydrates: data.macros.find(m => m.name === 'Carbs')?.value || 0,
    fat: data.macros.find(m => m.name === 'Fat')?.value || 0,
  };

  const docData = {
    userId,
    date: Timestamp.now(),
    calories: data.calories,
    macros,
    micros: data.micros,
  };
  
  await addDoc(collection(db, "nutrientHistory"), docData);
};


// Get nutrient history for a specific user
export const getNutrientHistory = async (userId: string): Promise<NutrientData[]> => {
  const q = query(collection(db, "nutrientHistory"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  
  const history: NutrientData[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    history.push({
      date: (data.date as Timestamp).toDate(),
      macros: data.macros,
      micros: data.micros,
      calories: data.calories,
    });
  });

  // Sort by date descending
  return history.sort((a, b) => b.date.getTime() - a.date.getTime());
};
