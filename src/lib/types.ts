export interface User {
  id: string;
  name: string;
  email: string;
  joinDate: string;
}

export interface MacroNutrients {
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface NutrientData {
  date: Date;
  macros: MacroNutrients;
  micros: string[];
  calories: number;
}
