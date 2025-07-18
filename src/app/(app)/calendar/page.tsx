
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import type { NutrientData } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getNutrientHistory } from '@/lib/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { isSameDay } from 'date-fns';

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [nutrientHistory, setNutrientHistory] = useState<NutrientData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      setLoading(true);
      getNutrientHistory(user.uid)
        .then(data => {
          setNutrientHistory(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch nutrient history:", err);
          setLoading(false);
        });
    } else {
      // If there's no user, we are not loading and there's no history.
      setLoading(false);
      setNutrientHistory([]);
    }
  }, [user]);

  const selectedData = date ? nutrientHistory.find(entry => isSameDay(entry.date, date)) : undefined;

  const chartData = selectedData ? [
      { name: 'Protein', value: selectedData.macros.protein },
      { name: 'Carbs', value: selectedData.macros.carbohydrates },
      { name: 'Fat', value: selectedData.macros.fat },
  ] : [];

  const daysWithData = nutrientHistory.map(d => d.date);

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Nutrient Calendar</h1>
      <p className="text-muted-foreground">Review your past nutrient intake day by day.</p>
      {loading ? (
        <div className="mt-6 grid flex-1 gap-6 md:grid-cols-[350px_1fr]">
          <Card>
            <CardContent className="p-6 pt-6">
               <Skeleton className="w-full h-[300px]" />
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="w-full h-[250px]" />
            </CardContent>
          </Card>
        </div>
      ) : (
      <div className="mt-6 grid flex-1 gap-6 md:grid-cols-[350px_1fr]">
        <Card className="flex items-start justify-center pt-6">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-0"
                modifiers={{
                    hasData: daysWithData
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
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
      )}
    </div>
  );
}
