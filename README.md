# Pantry Manager App

A modern pantry inventory management application built with Next.js 15, featuring GitHub authentication and PostgreSQL database integration.

## Tech Stack

- **Framework:** Next.js 15.5.6 with App Router
- **Language:** TypeScript
- **UI:** React 19, Tailwind CSS 4, shadcn/ui components
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with GitHub OAuth
- **Styling:** Tailwind CSS with class-variance-authority

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js:** v20.x or higher (recommended: v22+)
- **npm:** v9.x or higher
- **Git:** For version control

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PantryManagerApp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

You will receive a `.env` file over a secure channel from your team lead. Place this file in the root directory of the project.

The `.env` file should contain the following variables:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."

# GitHub App secrets
GITHUB_ID="..."
GITHUB_SECRET="..."
```

**Important:** Never commit the `.env` file to version control. It's already included in `.gitignore`.

### 4. Set Up the Database

Generate the Prisma client and run database migrations:

```bash
npx prisma generate
npx prisma db push
```

To view and manage your database with Prisma Studio:

```bash
npx prisma studio
```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start the development server with Turbopack
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Database Schema

The application uses the following main models:

- **User** - User accounts with email, name, bio, and age
- **Account** - OAuth account information (GitHub)
- **Session** - User session management
- **VerificationToken** - Email verification tokens

To modify the database schema:

1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Run `npx prisma generate` to update the Prisma client

## Authentication

The app uses NextAuth.js with GitHub OAuth provider. Users can sign in with their GitHub account. The authentication configuration is located in:

- `app/api/auth/[...nextauth]/route.ts`

## Development Guidelines

### Code Style

- The project uses Prettier for code formatting
- Run formatting with: `npx prettier --write .`
- ESLint is configured for code quality checks

### Database Changes

1. Always update `prisma/schema.prisma` for schema changes
2. Run `npx prisma db push` to apply changes
3. Commit the schema file changes to version control
4. Never commit the generated Prisma client (`/lib/generated/prisma`)

### Git Workflow

1. Create a new branch for your feature: `git checkout -b feature/your-feature-name`
2. Make your changes and commit with descriptive messages
3. Push your branch and create a pull request
4. Wait for code review before merging

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` in the `.env` file
- Ensure PostgreSQL is running
- Check network access to the database

### Authentication Issues

- Verify `GITHUB_ID` and `GITHUB_SECRET` are correct
- Ensure the GitHub OAuth app callback URL is set to `http://localhost:3000/api/auth/callback/github`
- Check that `NEXTAUTH_SECRET` is set and `NEXTAUTH_URL` matches your domain

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

### Port Already in Use

If port 3000 is already in use, you can run on a different port:

```bash
npm run dev -- -p 3001
```

## Production Deployment

Before deploying to production:

1. Build the application: `npm run build`
2. Set production environment variables (especially `NEXTAUTH_URL`)
3. Run database migrations: `npx prisma migrate deploy`
4. Start the server: `npm start`

## Support

For questions or issues:

- Check existing GitHub issues
- Contact the team lead
- Review the Next.js documentation: [https://nextjs.org/docs](https://nextjs.org/docs)
- Review the Prisma documentation: [https://www.prisma.io/docs](https://www.prisma.io/docs)

## License

[Add your license information here]
