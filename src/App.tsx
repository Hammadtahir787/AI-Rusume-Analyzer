import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { FileText, Briefcase, Sparkles, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Label } from './components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Progress } from './components/ui/progress';
import { Badge } from './components/ui/badge';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface AnalysisResult {
  matchPercentage: number;
  summary: string;
  matchingKeywords: string[];
  missingKeywords: string[];
  improvements: string[];
  formattingFeedback: string;
}

export default function App() {
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      setError('Please provide both a resume and a job description.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following resume against the provided job description.
        
        Resume:
        ${resume}
        
        Job Description:
        ${jobDescription}
        
        Provide a detailed analysis.`,
        config: {
          systemInstruction: "You are an expert technical recruiter and career coach. Your goal is to objectively analyze a candidate's resume against a specific job description.",
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchPercentage: {
                type: Type.NUMBER,
                description: 'A score from 0 to 100 indicating how well the resume matches the job description.',
              },
              summary: {
                type: Type.STRING,
                description: 'A brief summary of the candidate\'s fit for the role.',
              },
              matchingKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Keywords from the job description that are present in the resume.',
              },
              missingKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Important keywords from the job description that are missing from the resume.',
              },
              improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Actionable suggestions to improve the resume for this specific role.',
              },
              formattingFeedback: {
                type: Type.STRING,
                description: 'General feedback on the resume\'s structure, clarity, and impact (assuming standard text format).',
              },
            },
            required: ['matchPercentage', 'summary', 'matchingKeywords', 'missingKeywords', 'improvements', 'formattingFeedback'],
          },
        },
      });

      if (response.text) {
        const parsedResult = JSON.parse(response.text) as AnalysisResult;
        setResult(parsedResult);
      } else {
        throw new Error('No response from AI');
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Failed to analyze the resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-200">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 text-white p-2 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">AI Resume Analyzer</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-zinc-500" />
                  Your Resume
                </CardTitle>
                <CardDescription>Paste your resume text here.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="John Doe&#10;Software Engineer&#10;&#10;Experience...&#10;Skills..."
                  className="min-h-[300px] font-mono text-sm resize-y"
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-zinc-500" />
                  Job Description
                </CardTitle>
                <CardDescription>Paste the target job description here.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="We are looking for a Software Engineer with experience in React, Node.js..."
                  className="min-h-[200px] font-mono text-sm resize-y"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </CardContent>
            </Card>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Button
              className="w-full h-12 text-base"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !resume.trim() || !jobDescription.trim()}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze Match
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          <div className="lg:sticky lg:top-24 h-fit">
            <AnimatePresence mode="wait">
              {!result && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50"
                >
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 mb-2">Ready to Analyze</h3>
                  <p className="text-zinc-500 max-w-sm">
                    Paste your resume and the job description, then click analyze to see how well you match the role.
                  </p>
                </motion.div>
              )}

              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 border border-zinc-200 rounded-xl bg-white shadow-sm"
                >
                  <Loader2 className="w-12 h-12 text-zinc-900 animate-spin mb-6" />
                  <h3 className="text-xl font-medium text-zinc-900 mb-2">Analyzing your fit...</h3>
                  <p className="text-zinc-500">Our AI is comparing your experience against the requirements.</p>
                </motion.div>
              )}

              {result && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="overflow-hidden border-none shadow-md">
                    <div className="bg-zinc-900 p-6 text-white text-center relative overflow-hidden">
                      <div className="relative z-10">
                        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Match Score</h2>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={`text-6xl font-bold tracking-tighter ${getScoreColor(result.matchPercentage)}`}>
                            {result.matchPercentage}
                          </span>
                          <span className="text-2xl text-zinc-500">%</span>
                        </div>
                      </div>
                      {/* Decorative background circle */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    </div>
                    <CardContent className="p-6">
                      <p className="text-zinc-600 leading-relaxed">
                        {result.summary}
                      </p>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="keywords" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="keywords">Keywords</TabsTrigger>
                      <TabsTrigger value="improvements">Improvements</TabsTrigger>
                      <TabsTrigger value="formatting">Formatting</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="keywords" className="space-y-4 outline-none">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Matching Keywords
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {result.matchingKeywords.length > 0 ? (
                              result.matchingKeywords.map((kw, i) => (
                                <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                                  {kw}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-zinc-500">No matching keywords found.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            Missing Keywords
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {result.missingKeywords.length > 0 ? (
                              result.missingKeywords.map((kw, i) => (
                                <Badge key={i} variant="outline" className="border-red-200 text-red-700 bg-red-50">
                                  {kw}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-zinc-500">Great job! No major keywords missing.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="improvements" className="outline-none">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Actionable Suggestions</CardTitle>
                          <CardDescription>How to tailor your resume for this role</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {result.improvements.map((imp, i) => (
                              <li key={i} className="flex gap-3 text-sm text-zinc-700">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-xs font-medium mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="leading-relaxed">{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="formatting" className="outline-none">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">General Feedback</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-zinc-700 leading-relaxed prose prose-zinc max-w-none">
                          <ReactMarkdown>{result.formattingFeedback}</ReactMarkdown>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
