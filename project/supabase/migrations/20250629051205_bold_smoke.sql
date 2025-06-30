/*
  # Create function to update quiz statistics

  1. Function
    - `update_quiz_stats` - Updates quiz total_attempts and average_score when a new attempt is made
*/

CREATE OR REPLACE FUNCTION update_quiz_stats(quiz_id uuid, new_score integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE quizzes 
  SET 
    total_attempts = total_attempts + 1,
    average_score = (
      SELECT AVG(score)::numeric 
      FROM quiz_attempts 
      WHERE quiz_attempts.quiz_id = update_quiz_stats.quiz_id
    )
  WHERE id = quiz_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_quiz_stats(uuid, integer) TO authenticated;