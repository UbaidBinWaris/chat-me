# ⚡ Real-time Chat Application

A high-performance, real-time chat platform built with **Next.js 16**, **Socket.IO**, and **PostgreSQL**. Featuring a premium glassmorphic UI, instant messaging, and persistent chat history.

## 🚀 Features

-   **Real-time Messaging**: Instant message delivery (< 100ms) using WebSockets.
-   **Room Management**: Create public chat rooms or join existing ones.
-   **Persistent History**: All messages and rooms are stored in PostgreSQL via Prisma.
-   **Glassmorphism UI**: Modern, translucent aesthetic using Tailwind CSS & Framer Motion.
-   **Optimistic UI**: Immediate interface updates for a snappy user experience.
-   **Custom Server**: Integrated Express server handling both Next.js SSR and Socket.IO events.

## 🛠 Tech Stack

-   **Frontend**: [Next.js 16](https://nextjs.org/) (React 19), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
-   **Backend**: Node.js, [Express](https://expressjs.com/), [Socket.IO](https://socket.io/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/)
-   **Utilities**: `clsx`, `tailwind-merge`, `date-fns`, `winston` (logging)

## 📦 Prerequisites

-   **Node.js**: v18 or higher
-   **PostgreSQL**: Local installation or cloud instance (e.g., Supabase, Neon)

## ⚡ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/chat-me.git
cd chat-me
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
# PostgreSQL Connection String
DATABASE_URL="postgresql://user:password@localhost:5432/chat_me"

# Optional: Redis (for scaling to multiple instances)
# REDIS_URL="redis://localhost:6379"
```

### 4. Database Setup
Push the Prisma schema to your database:
```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

## 🏗 Project Structure

```
├── app/                  # Next.js App Router pages
├── components/
│   ├── chat/             # Chat features (Layout, Input, Message)
│   └── ui/               # Reusable UI components (Button, Input, Card)
├── hooks/                # Custom hooks (useSocket)
├── lib/                  # Utilities (logger, prisma client)
├── prisma/               # Database schema
├── public/               # Static assets
└── server.ts             # Custom Express + Socket.IO server
```

## 📜 Scripts

-   `npm run dev`: Starts the development server with `tsx` (hot-reload for server.ts).
-   `npm run build`: Builds the Next.js application for production.
-   `npm start`: Starts the production server.
-   `npm run lint`: Runs ESLint checks.

## 🤝 Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
