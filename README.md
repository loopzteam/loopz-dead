# Loopz

A mindfulness application to help users untangle their thoughts and find clarity.

## Project Overview

Loopz is a Next.js application with Supabase integration focused on providing a digital space for mindfulness and mental clarity.

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/loopzteam/loopz.git
cd loopz
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Database Setup

Loopz includes an automated database setup tool to ensure your Supabase schema is properly configured.

1. Configure additional environment variables in `.env.local`:

   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_SETUP_TOKEN=your_secure_random_token
   ```

   You can find your service role key in your Supabase project settings under API. The setup token should be a secure random string you generate.

2. Create the `exec_sql` function in Supabase:

   - Go to your Supabase dashboard > SQL Editor
   - Create a new query with the following SQL:

   ```sql
   CREATE OR REPLACE FUNCTION public.exec_sql(query text)
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     EXECUTE query;
   END;
   $$;

   -- Grant usage to authenticated users
   GRANT EXECUTE ON FUNCTION public.exec_sql TO authenticated;
   ```

   - Run the query

3. Run the setup script:
   ```bash
   npm run db:setup
   # or
   yarn db:setup
   ```

This script will create all necessary tables, set up row-level security policies, and create indexes for your Loopz application. You can run it again whenever you need to reset your database or update the schema.

### Automated Database Maintenance

For production deployments, Loopz supports automatic database schema verification and setup through a cron job.

#### Setup with Vercel Cron

If you're deploying on Vercel, you can use Vercel Cron to automatically check and update your database schema:

1. Add the `CRON_SECRET` environment variable in your Vercel project settings
2. Set up a cron job in your `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/db-check",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This will run the database check daily at midnight.

#### Setup with Other Cron Services

You can also use services like Upstash QStash or GitHub Actions to call the endpoint:

```bash
curl -X POST https://your-app-url.com/api/cron/db-check \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

The endpoint will check if your database schema is up to date and apply any necessary changes.

## Project Structure

```
/public
  /images
    loopz-logo.png
/app
  /components
    LandingPage.jsx
    AuthForm.jsx
  /lib
    supabase.js
  page.jsx
  layout.jsx
  globals.css
/lib
  supabase-schema.sql  # Database schema definition
  setup-db.js          # Automated setup script
```

## Technologies Used

- Next.js
- Supabase (Auth & Database)
- Framer Motion (Animations)
- Tailwind CSS (Styling)
- OpenAI (AI integration)

## License

[MIT License](LICENSE)
