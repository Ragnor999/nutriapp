'use client';

import type { AnalyzeFoodPhotoOutput } from '@/ai/flows/analyze-food-photo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo } from 'react';
import { CheckCircle } from 'lucide-react';

interface NutrientAnalysisProps {
  analysis: AnalyzeFoodPhotoOutput;
}

interface ParsedAnalysis {
  macros: { name: string; value: number }[];
  micros: string[];
  calories: number | null;
}

const parseAnalysis = (text: string): ParsedAnalysis => {
  const lines = text.split('\n');
  const macros: { name: string; value: number }[] = [];
  const micros: string[] = [];
  let calories: number | null = null;

  const macroRegex = /(protein|carbohydrates?|fat)\s*:\s*([\d.]+)\s*g/i;
  const calorieRegex = /calories\s*:\s*(\d+)/i;

  lines.forEach(line => {
    const macroMatch = line.match(macroRegex);
    if (macroMatch) {
      const name = macroMatch[1].charAt(0).toUpperCase() + macroMatch[1].slice(1).toLowerCase();
      macros.push({ name: name === 'Carbohydrate' ? 'Carbs' : name, value: parseFloat(macroMatch[2]) });
      return;
    }

    const calorieMatch = line.match(calorieRegex);
    if (calorieMatch) {
      calories = parseInt(calorieMatch[1], 10);
      return;
    }
    
    const cleanLine = line.replace(/^-/, '').trim();
    if(cleanLine && !/macro|nutrient/i.test(cleanLine)) {
        micros.push(cleanLine);
    }
  });

  return { macros, micros, calories };
};

export function NutrientAnalysis({ analysis }: NutrientAnalysisProps) {
  const { macros, micros, calories } = useMemo(() => parseAnalysis(analysis.nutrientAnalysis), [analysis]);

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
          <h3 className="text-lg font-semibold mb-2 font-headline">Other Nutrients & Notes</h3>
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
            <p className="text-sm text-muted-foreground">No additional nutrient details found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
