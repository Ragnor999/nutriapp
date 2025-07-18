
'use client';

import type { AnalyzeFoodPhotoOutput } from '@/ai/flows/analyze-food-photo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useEffect, useMemo } from 'react';
import { CheckCircle, Flame, Beef, Wheat, Droplets } from 'lucide-react';

export interface ParsedAnalysis {
  macros: { name: string; value: number }[];
  micros: string[];
  calories: number;
}

interface NutrientAnalysisProps {
  analysis: AnalyzeFoodPhotoOutput;
  onParsed: (parsedData: ParsedAnalysis) => void;
}

const parseAnalysis = (text: string): ParsedAnalysis => {
    const macros: { name: string; value: number }[] = [];
    let micros: string[] = [];
    let calories = 0;

    // Robustly find calories
    const caloriesMatch = text.match(/## Estimated Calories\s*\n\D*(\d+)/);
    if (caloriesMatch && caloriesMatch[1]) {
        calories = parseInt(caloriesMatch[1], 10);
    }

    // Robustly find macros
    const macroSectionMatch = text.match(/## Macronutrients([\s\S]*?)## Micronutrients/);
    if (macroSectionMatch && macroSectionMatch[1]) {
        const macroText = macroSectionMatch[1];
        const proteinMatch = macroText.match(/Protein\s*:\s*([\d.]+)\s*g/i);
        const carbsMatch = macroText.match(/Carbohydrates?\s*:\s*([\d.]+)\s*g/i);
        const fatMatch = macroText.match(/Fat\s*:\s*([\d.]+)\s*g/i);

        if (proteinMatch) macros.push({ name: 'Protein', value: parseFloat(proteinMatch[1]) });
        if (carbsMatch) macros.push({ name: 'Carbs', value: parseFloat(carbsMatch[1]) });
        if (fatMatch) macros.push({ name: 'Fat', value: parseFloat(fatMatch[1]) });
    }
    
    // Robustly find micros
    const microSectionMatch = text.match(/## Micronutrients([\s\S]*?)(\n##|$)/);
    if (microSectionMatch && microSectionMatch[1]) {
        micros = microSectionMatch[1]
            .split('\n')
            .map(line => line.trim().replace(/^-|\*|•/, '').trim())
            .filter(line => line.length > 0);
    }

    // Fallback for calories if not found but macros are present
    if (calories === 0 && macros.length > 0) {
        const proteinG = macros.find(m => m.name === 'Protein')?.value || 0;
        const carbsG = macros.find(m => m.name === 'Carbs')?.value || 0;
        const fatG = macros.find(m => m.name === 'Fat')?.value || 0;
        calories = Math.round((proteinG * 4) + (carbsG * 4) + (fatG * 9));
    }

    return { macros, micros, calories };
};

export function NutrientAnalysis({ analysis, onParsed }: NutrientAnalysisProps) {
  const parsedData = useMemo(() => parseAnalysis(analysis.nutrientAnalysis), [analysis]);

  useEffect(() => {
    onParsed(parsedData);
  }, [parsedData, onParsed]);

  const { macros, micros, calories } = parsedData;

  const macroDetails = {
    Protein: macros.find(m => m.name === 'Protein')?.value,
    Carbs: macros.find(m => m.name === 'Carbs')?.value,
    Fat: macros.find(m => m.name === 'Fat')?.value,
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline">Nutrient Analysis</CardTitle>
        <CardDescription className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            {calories ? `Estimated ${calories} calories` : 'Here is the breakdown of your meal.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 font-headline">Macronutrients</h3>
          {macros.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                          <Beef className="w-5 h-5 text-red-500" />
                          <span className="font-medium">Protein</span>
                      </div>
                      <span className="font-bold">{macroDetails.Protein?.toFixed(1) ?? 'N/A'} g</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                          <Wheat className="w-5 h-5 text-yellow-600" />
                          <span className="font-medium">Carbs</span>
                      </div>
                      <span className="font-bold">{macroDetails.Carbs?.toFixed(1) ?? 'N/A'} g</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                          <Droplets className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">Fat</span>
                      </div>
                      <span className="font-bold">{macroDetails.Fat?.toFixed(1) ?? 'N/A'} g</span>
                  </div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={macros} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No macronutrient data found.</p>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 font-headline">Micronutrients & Notes</h3>
          {micros.length > 0 ? (
            <ul className="space-y-2">
              {micros.map((item, index) => (
                <li key={index} className="flex items-start text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No micronutrient details found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
