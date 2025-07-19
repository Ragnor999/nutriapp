
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { User, Calendar, Eye, Utensils, ChevronRight, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type AllUsersOutput, type UserNutrientHistoryOutput } from '@/ai/flows/admin-flows';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { NutrientData } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { NutrientAnalysis, type ParsedAnalysis } from '@/components/NutrientAnalysis';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as UICalendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';


type UserType = AllUsersOutput['users'][0];

// Convert NutrientData to the ParsedAnalysis format expected by the component
const toParsedAnalysis = (data: NutrientData): ParsedAnalysis => {
  return {
    calories: data.calories,
    macros: [
      { name: 'Protein', value: data.macros.protein },
      { name: 'Carbs', value: data.macros.carbohydrates },
      { name: 'Fat', value: data.macros.fat },
    ],
    micros: data.micros,
  };
};

function UserDataModal({ user, token }: { user: UserType, token: string | null }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<NutrientData[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<NutrientData | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchHistory() {
      if (!token) {
        setLoading(false);
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'Could not authenticate the request.' });
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/history?userId=${user.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
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

        const sortedHistory = historyWithDates.sort((a, b) => b.date.getTime() - a.date.getTime());
        setHistory(sortedHistory);
        if (sortedHistory.length > 0) {
            setSelectedEntry(sortedHistory[0]);
        }
      } catch (err: any) {
        console.error("Failed to fetch user's nutrient history:", err);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: err.message || "Could not fetch user's nutrient history."
        });
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user.uid, toast, token]);

  const filteredHistory = history.filter(entry => 
      !date || format(entry.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  );

  return (
    <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="font-headline flex items-center gap-2">
            <User className="w-6 h-6" />
            Nutrient History for {user.displayName || user.email}
        </DialogTitle>
        <DialogDescription>
            Browse the user's recorded meal entries and view the detailed analysis.
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
         <div className="grid md:grid-cols-[320px_1fr] gap-6 mt-4 flex-1 overflow-hidden">
            <div className="border rounded-lg flex flex-col">
                <div className="p-4 border-b">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Filter by date...</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <UICalendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    {date && <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setDate(undefined)}>Clear Filter</Button>}
                </div>
                <div className="flex-1 overflow-y-auto">
                   {filteredHistory.length > 0 ? (
                        <ul className="divide-y">
                            {filteredHistory.map((entry, index) => (
                                <li key={index}>
                                    <button
                                        onClick={() => setSelectedEntry(entry)}
                                        className={cn(
                                            "w-full text-left p-4 hover:bg-muted/50 transition-colors flex justify-between items-center",
                                            selectedEntry?.date === entry.date && "bg-muted"
                                        )}
                                    >
                                        <div>
                                            <p className="font-semibold">{format(entry.date, 'PPP')}</p>
                                            <p className="text-sm text-muted-foreground">{format(entry.date, 'p')}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground"/>
                                    </button>
                                </li>
                            ))}
                        </ul>
                   ): (
                     <div className="p-4 text-center text-muted-foreground text-sm">No entries for the selected date.</div>
                   )}
                </div>
            </div>
            <div className="overflow-y-auto">
                 {selectedEntry ? (
                    <NutrientAnalysis parsedData={toParsedAnalysis(selectedEntry)} />
                 ) : (
                    <Card className="h-full flex flex-col items-center justify-center text-center">
                        <Utensils className="w-12 h-12 text-muted-foreground" />
                        <CardHeader>
                            <CardTitle className="font-headline">Select an Entry</CardTitle>
                            <CardDescription>
                                Choose a meal entry from the left to see the detailed nutrient analysis.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                 )}
            </div>
         </div>
      )}
    </DialogContent>
  );
}


function MakeAdminDialog({ token, onAdminMade }: { token: string | null, onAdminMade: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleMakeAdmin = async () => {
    if (!token) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/admin/set-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to make user admin.');
      }
      toast({
        title: 'Success',
        description: result.message,
      });
      onAdminMade();
      setOpen(false);
      setEmail('');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm">
          <ShieldCheck className="h-4 w-4 mr-2" />
          Make Admin
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Make User an Admin</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the email of the user you want to grant admin privileges to. This action will grant them full access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Input 
            type="email" 
            placeholder="user@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleMakeAdmin} disabled={loading || !email}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>([]);
  const { user, isAdmin, idToken, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const fetchUsers = useCallback(async () => {
    if (isAdmin && idToken) {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch users');
            }
            const data: AllUsersOutput = await response.json();
            setUsers(data.users);
        } catch (err: any) {
            console.error("Failed to fetch users:", err);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.message || "Could not fetch the list of users."
            });
        } finally {
            setLoading(false);
        }
    }
  }, [isAdmin, idToken, toast]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
        router.replace('/dashboard');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (authLoading || !user) {
    return (
        <div className="flex h-full items-center justify-center">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users and view their data.</p>
        </div>
        <MakeAdminDialog token={idToken} onAdminMade={fetchUsers} />
      </div>
      <div className="mt-6">
        <Dialog>
            <Card>
            <CardHeader>
                <CardTitle className="font-headline">All Users</CardTitle>
                <CardDescription>A list of all users in the system.</CardDescription>
            </CardHeader>
            <CardContent>
               {loading ? (
                 <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
               ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Join Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Role</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.uid}>
                        <TableCell>
                            <div className="font-medium">{user.displayName || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{new Date(user.creationTime).toLocaleDateString()}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {user.isAdmin ? (
                            <Badge variant="destructive"><ShieldCheck className="w-3.5 h-3.5 mr-1"/>Admin</Badge>
                          ) : (
                            <Badge variant="secondary"><ShieldOff className="w-3.5 h-3.5 mr-1"/>User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DialogTrigger asChild>
                             <Button aria-haspopup="true" size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View Data
                            </Button>
                          </DialogTrigger>
                          <UserDataModal user={user} token={idToken}/>
                        </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
               )}
            </CardContent>
            </Card>
        </Dialog>
      </div>
    </>
  );
}
