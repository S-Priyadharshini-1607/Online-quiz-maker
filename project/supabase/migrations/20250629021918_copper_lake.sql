/*
  # Add leaderboard function

  1. New Functions
    - `get_user_leaderboard(time_filter)` - Returns user leaderboard data with rankings
      - Accepts time filter parameter ('all', 'month', 'week')
      - Returns user_id, full_name, total_score, quiz_count, average_score, and rank
      - Calculates rankings based on total score
      - Joins with profiles table to get user names

  2. Security
    - Function is accessible to authenticated users
    - Uses existing RLS policies on underlying tables
*/

CREATE OR REPLACE FUNCTION public.get_user_leaderboard(time_filter text DEFAULT 'all')
RETURNS TABLE(
    user_id uuid,
    full_name text,
    total_score bigint,
    quiz_count bigint,
    average_score numeric,
    rank bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_scores AS (
        SELECT
            qa.user_id,
            SUM(qa.score) AS total_score,
            COUNT(qa.id) AS quiz_count,
            AVG(qa.score) AS average_score
        FROM
            quiz_attempts qa
        WHERE
            CASE
                WHEN time_filter = 'month' THEN qa.completed_at >= date_trunc('month', NOW())
                WHEN time_filter = 'week' THEN qa.completed_at >= date_trunc('week', NOW())
                ELSE TRUE
            END
        GROUP BY
            qa.user_id
    )
    SELECT
        us.user_id,
        p.full_name,
        us.total_score,
        us.quiz_count,
        us.average_score,
        RANK() OVER (ORDER BY us.total_score DESC) AS rank
    FROM
        user_scores us
    JOIN
        profiles p ON us.user_id = p.id
    ORDER BY
        rank ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_leaderboard(text) TO authenticated;