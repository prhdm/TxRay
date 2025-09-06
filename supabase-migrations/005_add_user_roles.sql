-- Add roles to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have 'user' role (default)
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Create policy for admins to read all user data
CREATE POLICY "Admins can read all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
        )
    );

-- Create policy for admins to update user roles
CREATE POLICY "Admins can update user roles" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id::text = auth.uid()::text
            AND u.role = 'admin'
        )
    );

-- Insert a sample admin user (replace with actual wallet address)
-- INSERT INTO users (wallet_address, role) VALUES ('0x1234567890abcdef...', 'admin')
-- ON CONFLICT (wallet_address) DO UPDATE SET role = 'admin';
