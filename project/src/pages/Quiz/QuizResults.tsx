import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trophy, RotateCcw, Home, Share2, Download, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

interface QuizAttempt {
  id: string;
  score: number;
  total_questions: number;
  time_taken: number;
  answers: Record<string, number>;
  completed_at: string;
  quiz: {
    id: string;
    title: string;
    description: string;
    category: string;
  };
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  order_index: number;
}

export default function QuizResults() {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attemptId && quizId) {
      fetchResults();
    }
  }, [attemptId, quizId]);

  const fetchResults = async () => {
    try {
      // Fetch attempt details
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes (
            id,
            title,
            description,
            category
          )
        `)
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index');

      if (questionsError) throw questionsError;

      setAttempt(attemptData);
      setQuestions(questionsData || []);
    } catch (error: any) {
      toast.error('Failed to load results');
      navigate('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: 'Excellent!', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { text: 'Great Job!', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { text: 'Good Work!', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 60) return { text: 'Not Bad!', color: 'bg-orange-100 text-orange-800' };
    return { text: 'Keep Trying!', color: 'bg-red-100 text-red-800' };
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const shareResults = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quiz Results - ${attempt?.quiz.title}`,
          text: `I scored ${attempt?.score}% on "${attempt?.quiz.title}" quiz!`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      const text = `I scored ${attempt?.score}% on "${attempt?.quiz.title}" quiz! Check it out: ${window.location.href}`;
      await navigator.clipboard.writeText(text);
      toast.success('Results copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!attempt || !questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load quiz results.</p>
          <Button onClick={() => navigate('/quizzes')}>Browse Quizzes</Button>
        </Card>
      </div>
    );
  }

  const correctAnswers = questions.filter(q => attempt.answers[q.id] === q.correct_answer).length;
  const scoreBadge = getScoreBadge(attempt.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Results Header */}
          <Card className="p-8 mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <Trophy className={`h-20 w-20 mx-auto mb-4 ${getScoreColor(attempt.score)}`} />
            </motion.div>

            <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
            <h2 className="text-2xl text-gray-600 mb-6">{attempt.quiz.title}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(attempt.score)}`}>
                  {attempt.score}%
                </div>
                <div className="text-gray-600">Final Score</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${scoreBadge.color}`}>
                  {scoreBadge.text}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {correctAnswers}/{attempt.total_questions}
                </div>
                <div className="text-gray-600">Correct Answers</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {formatTime(attempt.time_taken)}
                </div>
                <div className="text-gray-600">Time Taken</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={`/quiz/${attempt.quiz.id}`}>
                <Button icon={RotateCcw}>Retake Quiz</Button>
              </Link>
              <Button variant="outline" onClick={shareResults} icon={Share2}>
                Share Results
              </Button>
              <Link to="/quizzes">
                <Button variant="ghost" icon={Home}>Browse More Quizzes</Button>
              </Link>
            </div>
          </Card>

          {/* Detailed Results */}
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Detailed Results</h3>
            
            <div className="space-y-6">
              {questions.map((question, index) => {
                const userAnswer = attempt.answers[question.id];
                const isCorrect = userAnswer === question.correct_answer;
                
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border-2 rounded-lg p-6 ${
                      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex-1">
                        {index + 1}. {question.question_text}
                      </h4>
                      {isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-green-600 ml-4" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 ml-4" />
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optionIndex) => {
                        const isUserAnswer = userAnswer === optionIndex;
                        const isCorrectAnswer = question.correct_answer === optionIndex;
                        
                        let optionClass = 'p-3 rounded-lg border ';
                        if (isCorrectAnswer) {
                          optionClass += 'border-green-300 bg-green-100 text-green-800';
                        } else if (isUserAnswer && !isCorrect) {
                          optionClass += 'border-red-300 bg-red-100 text-red-800';
                        } else {
                          optionClass += 'border-gray-200 bg-white text-gray-700';
                        }

                        return (
                          <div key={optionIndex} className={optionClass}>
                            <div className="flex items-center">
                              <span className="font-medium mr-2">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span>{option}</span>
                              {isCorrectAnswer && (
                                <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                              )}
                              {isUserAnswer && !isCorrect && (
                                <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-semibold text-blue-900 mb-2">Explanation:</h5>
                        <p className="text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </Card>

          {/* Quiz Info */}
          <Card className="p-6 mt-8">
            <div className="text-center">
              <p className="text-gray-600">
                Completed {formatDistanceToNow(new Date(attempt.completed_at), { addSuffix: true })}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Category: {attempt.quiz.category}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}