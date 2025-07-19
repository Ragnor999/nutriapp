
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import type { NutrientData } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { isSameDay } from 'date-fns';
import { getAllUsers, AllUsersOutput, getUserNutrientHistory } from '@/ai/flows/admin-flows';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type UserType = AllUsersOutput['users'][0];

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [nutrientHistory, setNutrientHistory] = useState<NutrientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        if (isAdmin) {
            try {
                const data = await getAllUsers();
                setUsers(data.users);
                if (data.users.length > 0 && !selectedUserId) {
                    setSelectedUserId(data.users[0].uid);
                } else if (data.users.length === 0) {
                   setNutrientHistory([]);
                   setLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch users:", err);
                setLoading(false);
            }
        } else if (user) {
            setSelectedUserId(user.uid);
        }
    };
    fetchData();
  }, [user, isAdmin]);

  useEffect(() => {
    if (selectedUserId) {
      setLoading(true);
      getUserNutrientHistory(selectedUserId)
        .then(data => {
          setNutrientHistory(data.history);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch nutrient history:", err);
          setNutrientHistory([]); // Clear history on error
          setLoading(false);
        });
    } else {
        // No user selected, don't show loading, clear data.
        setLoading(false);
        setNutrientHistory([]);
    }
  }, [selectedUserId]);


  const selectedData = date ? nutrientHistory.find(entry => isSameDay(new Date(entry.date), date)) : undefined;

  const chartData = selectedData ? [
      { name: 'Protein', value: selectedData.macros.protein },
      { name: 'Carbs', value: selectedData.macros.carbohydrates },
      { name: 'Fat', value: selectedData.macros.fat },
  ] : [];

  const daysWithData = nutrientHistory.map(d => new Date(d.date));
  
  const selectedUserName = users.find(u => u.uid === selectedUserId)?.displayName || user?.name;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Nutrient Calendar</h1>
            <p className="text-muted-foreground">
              {isAdmin ? `Viewing data for ${selectedUserName || '...'}` : 'Review your past nutrient intake day by day.'}
            </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0 w-full sm:w-64">
             <Label htmlFor="user-select" className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground"><Users className="w-4 h-4"/>Select User</Label>
            <Select onValueChange={setSelectedUserId} value={selectedUserId || ''} disabled={users.length === 0}>
              <SelectTrigger id="user-select" className="w-full">
                <SelectValue placeholder="Select a user to view" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.uid} value={u.uid}>
                    {u.displayName || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      {loading ? (
        <div className="mt-6 grid flex-1 gap-6 md:grid-cols-[auto_1fr]">
          <Card>
            <CardContent className="p-6 pt-6">
               <Skeleton className="w-[300px] h-[300px]" />
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
      <div className="mt-6 grid flex-1 gap-6 md:grid-cols-[auto_1fr]">
        <Card className="flex items-start justify-center pt-6 w-min">
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
                    <p className="text-muted-foreground">{!selectedUserId && isAdmin ? 'Select a user to view their calendar.' : 'Select a highlighted day to see nutrient details.'}</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
