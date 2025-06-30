import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import QuizList from './pages/Quizzes/QuizList';
import CreateQuiz from './pages/Quiz/CreateQuiz';
import EditQuiz from './pages/Quiz/EditQuiz';
import TakeQuiz from './pages/Quiz/TakeQuiz';
import QuizResults from './pages/Quiz/QuizResults';
import MyQuizzes from './pages/Quiz/MyQuizzes';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/quizzes" element={<QuizList />} />
              <Route path="/create" element={<CreateQuiz />} />
              <Route path="/quiz/:id/edit" element={<EditQuiz />} />
              <Route path="/quiz/:id" element={<TakeQuiz />} />
              <Route path="/quiz/:quizId/results/:attemptId" element={<QuizResults />} />
              <Route path="/my-quizzes" element={<MyQuizzes />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
          </main>

          <Footer />
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;