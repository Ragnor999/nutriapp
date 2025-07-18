
'use client';

import type { AnalyzeFoodPhotoOutput } from '@/ai/flows/analyze-food-photo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useEffect, useMemo } from 'react';
import { CheckCircle } from 'lucide-react';

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
  const lines = text.split('\n');
  const macros: { name: string; value: number }[] = [];
  let micros: string[] = [];
  let calories = 0;

  let currentSection: 'macros' | 'micros' | 'calories' | null = null;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('## Macronutrients')) {
      currentSection = 'macros';
      return;
    } else if (trimmedLine.startsWith('## Micronutrients')) {
      currentSection = 'micros';
      return;
    } else if (trimmedLine.startsWith('## Estimated Calories')) {
      currentSection = 'calories';
      return;
    }

    if (!trimmedLine) return;

    switch (currentSection) {
      case 'macros': {
        const match = trimmedLine.match(/^(Protein|Carbohydrates?|Fat)\s*:\s*([\d.]+)\s*g/i);
        if (match) {
          let name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
          if (name === 'Carbohydrate') name = 'Carbs';
          macros.push({ name, value: parseFloat(match[2]) });
        }
        break;
      }
      case 'micros': {
        const cleanLine = trimmedLine.replace(/^-|\*|•/, '').trim();
        if (cleanLine) {
          micros.push(cleanLine);
        }
        break;
      }
      case 'calories': {
        const match = trimmedLine.match(/(\d+)/);
        if (match) {
          calories = parseInt(match[1], 10);
        }
        break;
      }
    }
  });

  // Fallback if calories are not explicitly parsed but macros are
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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline">Nutrient Analysis</CardTitle>
        <CardDescription>
          {calories ? `Estimated ${calories} calories.` : 'Here is the breakdown of your meal.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 font-headline">Macronutrients (g)</h3>
          {macros.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
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
