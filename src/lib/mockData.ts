import type { User, NutrientData } from './types';

export const mockUsers: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', joinDate: '2023-01-15' },
  { id: '2', name: 'Bob Williams', email: 'bob@example.com', joinDate: '2023-02-20' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', joinDate: '2023-03-10' },
  { id: '4', name: 'Diana Miller', email: 'diana@example.com', joinDate: '2023-04-05' },
  { id: '5', name: 'Ethan Davis', email: 'ethan@example.com', joinDate: '2023-05-22' },
];

export const mockNutrientHistory: NutrientData[] = [
  {
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    macros: { protein: 45, carbohydrates: 150, fat: 60 },
    micros: ['Vitamin C: 90mg', 'Iron: 18mg', 'Calcium: 1000mg'],
    calories: 1320,
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    macros: { protein: 55, carbohydrates: 180, fat: 70 },
    micros: ['Vitamin A: 900mcg', 'Potassium: 3500mg', 'Magnesium: 400mg'],
    calories: 1570,
  },
    {
    date: new Date(new Date().setDate(new Date().getDate() - 4)),
    macros: { protein: 60, carbohydrates: 200, fat: 65 },
    micros: ['Vitamin D: 15mcg', 'Zinc: 11mg', 'Vitamin E: 15mg'],
    calories: 1625,
  },
];
