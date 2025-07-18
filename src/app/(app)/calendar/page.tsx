'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { mockNutrientHistory } from '@/lib/mockData';
import type { NutrientData } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle } from 'lucide-react';

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const selectedData: NutrientData | undefined = mockNutrientHistory.find(
    (entry) =>
      date &&
      entry.date.getDate() === date.getDate() &&
      entry.date.getMonth() === date.getMonth() &&
      entry.date.getFullYear() === date.getFullYear()
  );

  const chartData = selectedData ? [
      { name: 'Protein', value: selectedData.macros.protein },
      { name: 'Carbs', value: selectedData.macros.carbohydrates },
      { name: 'Fat', value: selectedData.macros.fat },
  ] : [];

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Nutrient Calendar</h1>
      <p className="text-muted-foreground">Review your past nutrient intake day by day.</p>
      <div className="mt-6 grid flex-1 gap-6 md:grid-cols-[1fr_350px]">
        <Card className="flex items-center justify-center">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-0"
                modifiers={{
                    hasData: mockNutrientHistory.map(d => d.date)
                }}
                modifiersStyles={{
                    hasData: {
                        color: 'hsl(var(--primary-foreground))',
                        backgroundColor: 'hsl(var(--primary))',
                        opacity: 0.8,
                    }
                }}
            />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              {date ? date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date'}
            </CardTitle>
            <CardDescription>
                {selectedData ? `Est. ${selectedData.calories} calories` : 'No data for this day.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedData ? (
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-md mb-2 font-headline">Macronutrients (g)</h3>
                         <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis fontSize={12} tickLine={false} axisLine={false}/>
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h3 className="font-semibold text-md mb-2 font-headline">Micronutrients</h3>
                        <ul className="space-y-2">
                           {selectedData.micros.map((item, index) => (
                                <li key={index} className="flex items-start text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-64 text-center">
                    <p className="text-muted-foreground">Select a highlighted day to see nutrient details.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
