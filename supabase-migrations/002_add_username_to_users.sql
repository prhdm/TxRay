-- Add username column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

-- Create index on username for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Update existing users to have null username (they will get usernames later)
-- This is already the default behavior since we added the column as nullable

-- Optional: Add a unique constraint on username (uncomment if you want unique usernames)
-- ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username);

-- Optional: Add a check constraint to ensure username is not empty when provided
-- ALTER TABLE users ADD CONSTRAINT username_not_empty CHECK (username IS NULL OR length(trim(username)) > 0);

-- Note: The existing RLS policies will automatically apply to the new username column
-- since they operate on the entire row, not individual columns

