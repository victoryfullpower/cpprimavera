# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key-here-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"

# Node Environment
NODE_ENV=development
```

## How to Generate NEXTAUTH_SECRET

You can generate a secure secret using one of these methods:

### Method 1: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Method 2: Using OpenSSL
```bash
openssl rand -hex 32
```

### Method 3: Online Generator
Visit: https://generate-secret.vercel.app/32

## Database Setup

1. Make sure PostgreSQL is installed and running
2. Create a database for your application
3. Update the DATABASE_URL with your actual database credentials
4. Run the Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

## Security Notes

- Never commit `.env.local` to version control
- Use different secrets for development and production
- Use strong, unique passwords for your database
- Consider using environment-specific files (.env.development, .env.production)

