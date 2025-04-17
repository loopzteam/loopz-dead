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
```

## Technologies Used

- Next.js
- Supabase (Auth & Database)
- Framer Motion (Animations)
- Tailwind CSS (Styling)
- OpenAI (for future integration)

## License

[MIT License](LICENSE)
