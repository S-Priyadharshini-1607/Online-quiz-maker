import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  total_questions: number;
  time_limit?: number;
  created_by: string;
  creator_name?: string;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  order_index: number;
}

export default function TakeQuiz() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuizData();
    }
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (quizStarted && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [quizStarted, timeLeft]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (quizError) throw quizError;

      // Fetch creator name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', quizData.created_by)
        .single();

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index');

      if (questionsError) throw questionsError;

      setQuiz({
        ...quizData,
        creator_name: profileData?.full_name || 'Unknown'
      });
      setQuestions(questionsData || []);
      
      if (quizData.time_limit) {
        setTimeLeft(quizData.time_limit * 60); // Convert minutes to seconds
      }
    } catch (error: any) {
      toast.error('Failed to load quiz');
      navigate('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!user || !quiz) {
      toast.error('You must be logged in to submit a quiz');
      return;
    }

    try {
      setSubmitting(true);

      // Calculate score
      let correctAnswers = 0;
      questions.forEach(question => {
        if (answers[question.id] === question.correct_answer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / questions.length) * 100);
      const timeTaken = quiz.time_limit ? (quiz.time_limit * 60) - (timeLeft || 0) : 0;

      // Save quiz attempt
      const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quiz.id,
          user_id: user.id,
          score,
          total_questions: questions.length,
          time_taken: timeTaken,
          answers,
        })
        .select()
        .single();

      if (error) throw error;

      // Update quiz statistics
      const { error: updateError } = await supabase.rpc('update_quiz_stats', {
        quiz_id: quiz.id,
        new_score: score
      });

      if (updateError) console.warn('Failed to update quiz stats:', updateError);

      toast.success('Quiz submitted successfully!');
      navigate(`/quiz/${quiz.id}/results/${attempt.id}`);
    } catch (error: any) {
      toast.error('Failed to submit quiz');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h2>
          <p className="text-gray-600 mb-6">This quiz may have been removed or is not available.</p>
          <Button onClick={() => navigate('/quizzes')}>Browse Other Quizzes</Button>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-8 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
              <p className="text-xl text-gray-600 mb-8">{quiz.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-primary-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{quiz.total_questions}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="bg-secondary-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-secondary-600">{quiz.category}</div>
                  <div className="text-sm text-gray-600">Category</div>
                </div>
                {quiz.time_limit && (
                  <div className="bg-accent-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-accent-600">{quiz.time_limit} min</div>
                    <div className="text-sm text-gray-600">Time Limit</div>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-500 mb-8">
                Created by {quiz.creator_name}
              </div>

              <div className="space-y-4">
                <Button onClick={startQuiz} size="lg">
                  Start Quiz
                </Button>
                <div>
                  <Button variant="ghost" onClick={() => navigate('/quizzes')}>
                    Back to Quizzes
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            {timeLeft !== null && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{answeredQuestions} answered</span>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                {currentQuestion.question_text}
              </h2>

              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <motion.label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      answers[currentQuestion.id] === index
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={index}
                      checked={answers[currentQuestion.id] === index}
                      onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      answers[currentQuestion.id] === index
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQuestion.id] === index && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-lg text-gray-900">{option}</span>
                  </motion.label>
                ))}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            icon={ChevronLeft}
          >
            Previous
          </Button>

          <div className="flex space-x-4">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                loading={submitting}
                icon={CheckCircle}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={goToNextQuestion}
                icon={ChevronRight}
                className="flex-row-reverse"
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Overview</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                  index === currentQuestionIndex
                    ? 'bg-primary-500 text-white'
                    : answers[questions[index].id] !== undefined
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}