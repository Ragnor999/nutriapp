'use client';

import { useState, useRef, MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { analyzeFoodPhoto, AnalyzeFoodPhotoOutput } from '@/ai/flows/analyze-food-photo';
import { saveNutrientData } from '@/lib/firestore';
import { useAuth } from '@/hooks/use-auth';
import { NutrientAnalysis, ParsedAnalysis } from './NutrientAnalysis';
import Image from 'next/image';
import { UploadCloud, Loader2, X, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DashboardClient() {
  const [analysis, setAnalysis] = useState<AnalyzeFoodPhotoOutput | null>(null);
  const [parsedAnalysis, setParsedAnalysis] = useState<ParsedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload an image file.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      handleAnalysis(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleAnalysis = async (photoDataUri: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setParsedAnalysis(null);

    try {
      const result = await analyzeFoodPhoto({ photoDataUri });
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToJournal = async () => {
    if (!user || !parsedAnalysis) return;
    setSaving(true);
    try {
      await saveNutrientData(user.uid, parsedAnalysis);
      toast({
        title: 'Saved to Journal',
        description: "Your meal's nutrients have been recorded.",
      });
      router.push('/calendar');
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save nutrient data. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearPreview = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent the click from triggering the file input
    setPreview(null);
    setAnalysis(null);
    setParsedAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Upload Food Photo</CardTitle>
          <CardDescription>Upload a picture of your meal for AI nutrient analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !preview && fileInputRef.current?.click()}
          >
            {preview ? (
              <>
                <Image src={preview} alt="Food preview" width={256} height={256} className="object-contain h-full w-full p-2" />
                 <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 rounded-full h-8 w-8"
                    onClick={handleClearPreview}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove image</span>
                  </Button>
              </>
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
              </div>
            )}
          </div>
          <Input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </CardContent>
      </Card>
      
      <div className="min-h-[20rem] flex flex-col gap-4">
        {loading && (
          <Card className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-lg font-semibold">Analyzing your meal...</p>
            <p className="text-muted-foreground">This may take a moment.</p>
          </Card>
        )}
        {error && !loading && (
           <Card className="flex flex-col items-center justify-center h-full bg-destructive/10 border-destructive">
            <p className="font-bold text-destructive">Analysis Failed</p>
            <p className="text-sm text-destructive-foreground/80 mt-2 text-center px-4">{error}</p>
          </Card>
        )}
        {analysis && !loading && (
            <NutrientAnalysis analysis={analysis} onParsed={setParsedAnalysis} />
        )}
        {parsedAnalysis && !loading && (
          <Button onClick={handleSaveToJournal} disabled={saving} size="lg">
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Save to Journal
          </Button>
        )}
        {!loading && !analysis && !error && (
            <Card className="flex flex-col items-center justify-center h-full">
                <CardHeader>
                    <CardTitle className="font-headline">Awaiting Analysis</CardTitle>
                    <CardDescription className="text-center">Your meal's nutrient breakdown will appear here.</CardDescription>
                </CardHeader>
            </Card>
        )}
      </div>
    </div>
  );
}
