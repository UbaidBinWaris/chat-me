@echo off
echo ====================================
echo Chat-Me Database Setup
echo ====================================
echo.

echo Step 1: Creating database and user...
psql -U postgres -c "CREATE DATABASE chat_database;"
psql -U postgres -c "CREATE USER chat_user WITH PASSWORD 'chat_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE chat_database TO chat_user;"
psql -U postgres -d chat_database -c "GRANT ALL ON SCHEMA public TO chat_user;"

echo.
echo Step 2: Running database schema...
psql -U chat_user -d chat_database -f database\init.sql

echo.
echo ====================================
echo Database setup complete!
echo ====================================
echo.
echo You can now run: npm run dev
echo.
pause
