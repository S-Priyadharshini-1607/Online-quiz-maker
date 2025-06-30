import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Eye, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
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

export default function CreateQuiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    category: 'General Knowledge',
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
    },
  ]);

  const addDebugInfo = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: '',
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

  const validateQuizData = () => {
    addDebugInfo('Starting validation...');
    
    if (!quizData.title.trim()) {
      toast.error('Please enter a quiz title');
      addDebugInfo('Validation failed: No title');
      return false;
    }

    if (!quizData.description.trim()) {
      toast.error('Please enter a quiz description');
      addDebugInfo('Validation failed: No description');
      return false;
    }

    const validQuestions = questions.filter(q => {
      const hasQuestionText = q.question_text.trim().length > 0;
      const hasValidOptions = q.options.filter(opt => opt.trim().length > 0).length >= 2;
      return hasQuestionText && hasValidOptions;
    });

    if (validQuestions.length === 0) {
      toast.error('Please add at least one complete question with at least 2 options');
      addDebugInfo('Validation failed: No valid questions');
      return false;
    }

    addDebugInfo(`Validation passed: ${validQuestions.length} valid questions`);
    return true;
  };

  const testDatabaseConnection = async () => {
    try {
      addDebugInfo('Testing database connection...');
      
      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        addDebugInfo(`Database connection error: ${error.message}`);
        return false;
      }
      
      addDebugInfo('Database connection successful');
      return true;
    } catch (error: any) {
      addDebugInfo(`Database connection failed: ${error.message}`);
      return false;
    }
  };

  const testUserPermissions = async () => {
    try {
      addDebugInfo('Testing user permissions...');
      
      // Test if user can read their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) {
        addDebugInfo(`Profile read error: ${profileError.message}`);
        return false;
      }

      addDebugInfo(`Profile found: ${profile.full_name} (${profile.email})`);

      // Test if user can create a quiz (dry run)
      const testQuiz = {
        title: 'Test Quiz - DELETE ME',
        description: 'Test Description',
        category: 'General Knowledge',
        is_published: false,
        created_by: user?.id,
        total_questions: 0,
      };

      const { data: testQuizData, error: testQuizError } = await supabase
        .from('quizzes')
        .insert(testQuiz)
        .select()
        .single();

      if (testQuizError) {
        addDebugInfo(`Quiz creation test failed: ${testQuizError.message}`);
        return false;
      }

      addDebugInfo(`Quiz creation test successful: ${testQuizData.id}`);

      // Clean up test quiz
      await supabase.from('quizzes').delete().eq('id', testQuizData.id);
      addDebugInfo('Test quiz cleaned up');

      return true;
    } catch (error: any) {
      addDebugInfo(`Permission test failed: ${error.message}`);
      return false;
    }
  };

  const saveQuiz = async (isPublished: boolean) => {
    if (!user) {
      toast.error('You must be logged in to create a quiz');
      return;
    }

    setDebugInfo([]); // Clear previous debug info
    addDebugInfo(`Starting quiz ${isPublished ? 'publishing' : 'saving'} process...`);

    if (!validateQuizData()) {
      return;
    }

    // Test database connection and permissions
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      toast.error('Database connection failed. Please try again.');
      return;
    }

    const hasPermissions = await testUserPermissions();
    if (!hasPermissions) {
      toast.error('Permission error. Please try logging out and back in.');
      return;
    }

    const validQuestions = questions.filter(q => 
      q.question_text.trim() && 
      q.options.filter(opt => opt.trim()).length >= 2
    );

    try {
      setLoading(true);
      addDebugInfo(`User ID: ${user.id}`);
      addDebugInfo(`Publishing: ${isPublished}`);
      addDebugInfo(`Valid questions: ${validQuestions.length}`);

      const quizPayload = {
        title: quizData.title.trim(),
        description: quizData.description.trim(),
        category: quizData.category,
        is_published: isPublished,
        created_by: user.id,
        total_questions: validQuestions.length,
      };

      addDebugInfo(`Quiz payload: ${JSON.stringify(quizPayload, null, 2)}`);

      // Create quiz with detailed error handling
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert(quizPayload)
        .select('*')
        .single();

      if (quizError) {
        addDebugInfo(`Quiz creation error: ${JSON.stringify(quizError, null, 2)}`);
        throw new Error(`Failed to create quiz: ${quizError.message}`);
      }

      addDebugInfo(`Quiz created successfully: ${JSON.stringify(quiz, null, 2)}`);

      // Double-check the quiz was created with correct status
      const { data: verifyQuiz, error: verifyError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quiz.id)
        .single();

      if (verifyError) {
        addDebugInfo(`Quiz verification error: ${verifyError.message}`);
      } else {
        addDebugInfo(`Quiz verification successful:`);
        addDebugInfo(`- ID: ${verifyQuiz.id}`);
        addDebugInfo(`- Title: ${verifyQuiz.title}`);
        addDebugInfo(`- Published: ${verifyQuiz.is_published}`);
        addDebugInfo(`- Created by: ${verifyQuiz.created_by}`);
      }

      // Create questions
      if (validQuestions.length > 0) {
        const questionsToInsert = validQuestions.map((q, index) => ({
          quiz_id: quiz.id,
          question_text: q.question_text.trim(),
          options: q.options.filter(opt => opt.trim()),
          correct_answer: q.correct_answer,
          explanation: q.explanation.trim() || null,
          order_index: index,
        }));

        addDebugInfo(`Inserting ${questionsToInsert.length} questions...`);

        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert)
          .select('*');

        if (questionsError) {
          addDebugInfo(`Questions creation error: ${JSON.stringify(questionsError, null, 2)}`);
          // Clean up quiz if questions fail
          await supabase.from('quizzes').delete().eq('id', quiz.id);
          throw new Error(`Failed to create questions: ${questionsError.message}`);
        }

        addDebugInfo(`Questions created successfully: ${questionsData?.length} questions`);
      }

      // Final verification - check if quiz appears in published quizzes list
      if (isPublished) {
        const { data: publishedQuizzes, error: publishedError } = await supabase
          .from('quizzes')
          .select('id, title, is_published')
          .eq('is_published', true)
          .eq('id', quiz.id);

        if (publishedError) {
          addDebugInfo(`Published quiz check error: ${publishedError.message}`);
        } else if (publishedQuizzes && publishedQuizzes.length > 0) {
          addDebugInfo(`✅ Quiz successfully appears in published quizzes list`);
        } else {
          addDebugInfo(`❌ Quiz NOT found in published quizzes list`);
        }
      }

      const successMessage = isPublished 
        ? `Quiz "${quiz.title}" published successfully! It's now visible to all users.`
        : `Quiz "${quiz.title}" saved as draft!`;
      
      toast.success(successMessage);
      addDebugInfo(`✅ Success: ${successMessage}`);
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/my-quizzes');
      }, 2000);

    } catch (error: any) {
      addDebugInfo(`❌ Error: ${error.message}`);
      console.error('Full error object:', error);
      toast.error(error.message || `Failed to ${isPublished ? 'publish' : 'save'} quiz`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to create quizzes.</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
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
          {/* Debug Panel */}
          {debugInfo.length > 0 && (
            <Card className="p-4 mb-8 bg-gray-900 text-green-400 font-mono text-sm">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="font-bold">Debug Information</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {debugInfo.map((info, index) => (
                  <div key={index}>{info}</div>
                ))}
              </div>
            </Card>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Create New Quiz</h1>
            <p className="text-xl text-gray-600">
              Build an engaging quiz to share with the community
            </p>
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
              <Button onClick={addQuestion} icon={Plus} disabled={loading}>
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
                        disabled={loading}
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
              loading={loading}
              icon={Save}
              disabled={loading}
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => saveQuiz(true)}
              loading={loading}
              icon={Eye}
              disabled={loading}
            >
              Publish Quiz
            </Button>
          </div>

          {/* Help Text */}
          <Card className="p-4 mt-8 bg-blue-50 border-blue-200">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Publishing Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Draft:</strong> Save your work and continue editing later</li>
                <li><strong>Publish:</strong> Make your quiz visible to all users immediately</li>
                <li>You can always unpublish or edit your quiz later from "My Quizzes"</li>
                <li>Published quizzes appear in the browse section for everyone to take</li>
              </ul>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}