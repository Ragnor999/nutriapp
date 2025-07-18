
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, User, Calendar, BarChart2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllUsers, AllUsersOutput, getUserNutrientHistory, UserNutrientHistoryOutput } from '@/ai/flows/admin-flows';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as UICalendar } from '@/components/ui/calendar';
import type { NutrientData } from '@/lib/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

type UserType = AllUsersOutput['users'][0];

function UserDataModal({ user }: { user: UserType }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<NutrientData[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    setLoading(true);
    getUserNutrientHistory(user.uid)
      .then((data) => {
        setHistory(data.history);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch user's nutrient history:", err);
        setLoading(false);
      });
  }, [user.uid]);

  const selectedData = history.find((entry) => {
    if (!selectedDate) return false;
    const entryDate = entry.date;
    return (
      entryDate.getDate() === selectedDate.getDate() &&
      entryDate.getMonth() === selectedDate.getMonth() &&
      entryDate.getFullYear() === selectedDate.getFullYear()
    );
  });
  
  const chartData = selectedData ? [
      { name: 'Protein', value: selectedData.macros.protein },
      { name: 'Carbs', value: selectedData.macros.carbohydrates },
      { name: 'Fat', value: selectedData.macros.fat },
  ] : [];


  return (
    <DialogContent className="max-w-4xl h-[80vh]">
      <DialogHeader>
        <DialogTitle className="font-headline flex items-center gap-2">
            <User className="w-6 h-6" />
            Nutrient History for {user.displayName || user.email}
        </DialogTitle>
        <DialogDescription>
            Browse the user's recorded meal entries and nutrient data.
        </DialogDescription>
      </DialogHeader>
      {loading ? (
        <div className="flex items-center justify-center h-full">
            <Skeleton className="w-full h-1/2" />
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Calendar className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 font-semibold">No Nutrient History</p>
            <p className="text-muted-foreground text-sm">This user has not saved any meal analyses yet.</p>
        </div>
      ) : (
         <div className="grid md:grid-cols-[350px_1fr] gap-6 mt-4 h-full overflow-hidden">
            <div className="flex items-start justify-center pt-6 border rounded-lg">
                <UICalendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="p-0"
                    modifiers={{ hasData: history.map(h => h.date) }}
                    modifiersStyles={{ hasData: { color: 'hsl(var(--primary-foreground))', backgroundColor: 'hsl(var(--primary))', opacity: 0.8 }}}
                />
            </div>
            <Card className="h-full overflow-y-auto">
                <CardHeader>
                    <CardTitle className="font-headline">
                    {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date'}
                    </CardTitle>
                    <CardDescription>
                        {selectedData ? `Est. ${selectedData.calories} calories` : 'No data for this day.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {selectedData ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-md mb-2 font-headline flex items-center gap-2"><BarChart2 className="w-5 h-5" />Macronutrients (g)</h3>
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
    </DialogContent>
  );
}


export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>([]);
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!authLoading && !isAdmin) {
        router.replace('/dashboard');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
        setLoading(true);
        getAllUsers()
        .then((data) => {
            setUsers(data.users);
            setLoading(false);
        })
        .catch((err) => {
            console.error("Failed to fetch users:", err);
            setLoading(false);
        });
    }
  }, [isAdmin]);

  if (authLoading || !isAdmin) {
    return (
        <div className="flex h-full items-center justify-center">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Panel</h1>
      <p className="text-muted-foreground">Manage users and view their data.</p>
      <div className="mt-6">
        <Dialog>
            <Card>
            <CardHeader>
                <CardTitle className="font-headline">All Users</CardTitle>
                <CardDescription>A list of all users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Join Date</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                        </TableRow>
                        ))
                    ) : (
                    users.map((user) => (
                        <TableRow key={user.uid}>
                        <TableCell>
                            <div className="font-medium">{user.displayName || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{new Date(user.creationTime).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DialogTrigger asChild>
                             <Button aria-haspopup="true" size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View Data
                            </Button>
                          </DialogTrigger>
                          <UserDataModal user={user} />
                        </TableCell>
                        </TableRow>
                    ))
                    )}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </Dialog>
      </div>
    </>
  );
}
