
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import type { NutrientData } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { isSameDay, format } from 'date-fns';
import { type AllUsersOutput, type UserNutrientHistoryOutput } from '@/ai/flows/admin-flows';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type UserType = AllUsersOutput['users'][0];

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [nutrientHistory, setNutrientHistory] = useState<NutrientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { user, isAdmin, idToken, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const fetchHistory = useCallback(async (userId: string) => {
    if (!userId || !idToken) {
        setNutrientHistory([]);
        return;
    }
    setLoading(true);
    setNutrientHistory([]); // Clear previous history
    try {
      const response = await fetch(`/api/admin/history?userId=${userId}`, {
        headers: {
            'Authorization': `Bearer ${idToken}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch history');
      }
      const data: UserNutrientHistoryOutput = await response.json();
      
      const historyWithDates = data.history.map((item: any) => ({
          ...item,
          date: new Date(item.date),
      }));

      const sortedHistory = historyWithDates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNutrientHistory(sortedHistory);
    } catch (err: any) {
      console.error("Failed to fetch nutrient history:", err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Could not load nutrient history.'
      });
      setNutrientHistory([]);
    } finally {
      setLoading(false);
    }
  }, [idToken, toast]);

  // Combined effect to handle initial data loading
  useEffect(() => {
    if (authLoading || !idToken) {
      return; // Wait until authentication state and token are resolved
    }

    if (isAdmin) {
      setLoading(true);
      fetch('/api/admin/users', {
        headers: {
            'Authorization': `Bearer ${idToken}`
        }
      })
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch users");
            return res.json() as Promise<AllUsersOutput>;
        })
        .then(data => {
          setUsers(data.users);
          if (data.users.length > 0) {
            // Default to viewing the admin's own data first
            const adminUser = data.users.find(u => u.uid === user?.uid) || data.users[0];
            setSelectedUserId(adminUser.uid);
            fetchHistory(adminUser.uid);
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          console.error("Failed to fetch users:", err);
          toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not load the list of users.'
          });
          setLoading(false);
        });
    } else if (user) {
      // Regular user flow
      setSelectedUserId(user.uid);
      fetchHistory(user.uid);
    } else {
      // Not logged in or no user object
      setLoading(false);
    }
  }, [authLoading, user, isAdmin, fetchHistory, toast, idToken]);


  const handleAdminUserChange = (userId: string) => {
    if (isAdmin) {
      setSelectedUserId(userId);
      fetchHistory(userId);
    }
  };

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
              {isAdmin && users.length > 0 && selectedUserName ? `Viewing data for ${selectedUserName}` : 'Review your past nutrient intake day by day.'}
            </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0 w-full sm:w-64">
             <Label htmlFor="user-select" className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground"><Users className="w-4 h-4"/>Select User</Label>
            <Select onValueChange={handleAdminUserChange} value={selectedUserId || ''} disabled={users.length === 0}>
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
      {(loading && nutrientHistory.length === 0) ? (
        <div className="mt-6 grid flex-1 gap-6 md:grid-cols-[auto_1fr]">
          <Card className="hidden md:flex items-start justify-center pt-6 w-min">
            <CardContent className="p-0">
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
        <Card className="flex-col md:flex-row flex items-start justify-center pt-6 w-full md:w-min">
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
                disabled={(day) => day > new Date() || day < new Date("1900-01-01")}
            />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              {date ? format(date, 'PPP') : 'Select a date'}
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
                <div className="flex items-center justify-center h-full min-h-64 text-center">
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
