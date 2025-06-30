import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Eye, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  is_published: boolean;
  created_by: string;
  total_questions: number;
}

const categories = [
  'Science',
  'History',
  'Mathematics',
  'Literature',
  'Geography',
  'Technology',
  'Sports',
  'Entertainment',
  'General Knowledge'
];

export default function EditQuiz() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    category: 'General Knowledge',
  });

  useEffect(() => {
    if (id && user) {
      fetchQuizData();
    }
  }, [id, user]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .eq('created_by', user?.id) // Ensure user owns this quiz
        .single();

      if (quizError) {
        if (quizError.code === 'PGRST116') {
          toast.error('Quiz not found or you do not have permission to edit it');
        } else {
          toast.error('Failed to load quiz');
        }
        navigate('/my-quizzes');
        return;
      }

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', id)
        .order('order_index');

      if (questionsError) {
        toast.error('Failed to load questions');
        navigate('/my-quizzes');
        return;
      }

      setQuiz(quizData);
      setQuizData({
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
      });

      // Convert questions to the format expected by the form
      const formattedQuestions = questionsData.map(q => ({
        id: q.id,
        question_text: q.question_text,
        options: [...q.options, '', '', '', ''].slice(0, 4), // Ensure 4 options
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        order_index: q.order_index,
      }));

      setQuestions(formattedQuestions.length > 0 ? formattedQuestions : [
        {
          id: 'new-1',
          question_text: '',
          options: ['', '', '', ''],
          correct_answer: 0,
          explanation: '',
          order_index: 0,
        }
      ]);

    } catch (error: any) {
      toast.error('Failed to load quiz data');
      navigate('/my-quizzes');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `new-${Date.now()}`,
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
      order_index: questions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) }
        : q
    ));
  };

  const saveQuiz = async (isPublished: boolean) => {
    if (!user || !quiz) {
      toast.error('Unable to save quiz');
      return;
    }

    if (!quizData.title.trim() || !quizData.description.trim()) {
      toast.error('Please fill in the quiz title and description');
      return;
    }

    const validQuestions = questions.filter(q => 
      q.question_text.trim() && 
      q.options.filter(opt => opt.trim()).length >= 2
    );

    if (validQuestions.length === 0) {
      toast.error('Please add at least one complete question with at least 2 options');
      return;
    }

    try {
      setSaving(true);

      // Update quiz
      const { error: quizError } = await supabase
        .from('quizzes')
        .update({
          title: quizData.title.trim(),
          description: quizData.description.trim(),
          category: quizData.category,
          is_published: isPublished,
          total_questions: validQuestions.length,
        })
        .eq('id', quiz.id);

      if (quizError) throw quizError;

      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quiz.id);

      if (deleteError) throw deleteError;

      // Insert updated questions
      const questionsToInsert = validQuestions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question_text.trim(),
        options: q.options.filter(opt => opt.trim()),
        correct_answer: q.correct_answer,
        explanation: q.explanation.trim() || null,
        order_index: index,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast.success(isPublished ? 'Quiz updated and published!' : 'Quiz updated and saved as draft!');
      navigate('/my-quizzes');
    } catch (error: any) {
      toast.error('Failed to update quiz');
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to edit quizzes.</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h2>
          <p className="text-gray-600 mb-6">This quiz may have been deleted or you don't have permission to edit it.</p>
          <Button onClick={() => navigate('/my-quizzes')}>Back to My Quizzes</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/my-quizzes')}
              icon={ArrowLeft}
              className="mr-4"
            >
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Quiz</h1>
              <p className="text-xl text-gray-600">
                Update your quiz content and settings
              </p>
              <div className="flex items-center mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  quiz.is_published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {quiz.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </div>

          {/* Quiz Information */}
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quiz Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={quizData.title}
                  onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter an engaging quiz title"
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {quizData.title.length}/100 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={quizData.category}
                  onChange={(e) => setQuizData({ ...quizData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={quizData.description}
                onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe what this quiz is about"
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {quizData.description.length}/500 characters
              </div>
            </div>
          </Card>

          {/* Questions */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Questions</h2>
              <Button onClick={addQuestion} icon={Plus} disabled={saving}>
                Add Question
              </Button>
            </div>

            <div className="space-y-6">
              {questions.map((question, questionIndex) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Question {questionIndex + 1}
                    </h3>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={saving}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text *
                    </label>
                    <textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter your question here"
                      maxLength={500}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer Options * (at least 2 required)
                    </label>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={question.correct_answer === optionIndex}
                            onChange={() => updateQuestion(question.id, 'correct_answer', optionIndex)}
                            className="text-primary-600 focus:ring-primary-500"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder={`Option ${optionIndex + 1}`}
                            maxLength={200}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Select the correct answer by clicking the radio button
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explanation (Optional)
                    </label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Explain why this is the correct answer (shown after quiz completion)"
                      maxLength={500}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => saveQuiz(false)}
              loading={saving}
              icon={Save}
              disabled={saving}
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => saveQuiz(true)}
              loading={saving}
              icon={Eye}
              disabled={saving}
            >
              {quiz.is_published ? 'Update & Keep Published' : 'Save & Publish'}
            </Button>
          </div>

          {/* Warning for published quizzes */}
          {quiz.is_published && (
            <Card className="p-4 mt-8 bg-yellow-50 border-yellow-200">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Editing Published Quiz</p>
                  <p>
                    This quiz is currently published and visible to users. Any changes you make will be immediately visible to anyone taking the quiz.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}