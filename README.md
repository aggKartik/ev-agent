# ev-agent

A modern full-stack React application built with cutting-edge technologies for type-safe, performant web development.

## 🚀 Tech Stack

- **[TanStack Start](https://tanstack.com/start)** - Full-stack React framework with file-based routing and SSR
- **[Bun](https://bun.sh)** - Fast JavaScript runtime and package manager  
- **[tRPC](https://trpc.io)** - End-to-end type-safe API layer
- **[TanStack Query](https://tanstack.com/query)** - Powerful data fetching and caching
- **[Ark UI](https://ark-ui.com)** - Headless component library for accessible UI primitives
- **[Panda CSS](https://panda-css.com)** - CSS-in-JS with zero runtime overhead
- **[Biome](https://biomejs.dev)** - Fast linting and formatting

## 📂 Project Structure

```
ev-agent/
├── src/
│   ├── routes/                    # File-based routing
│   │   ├── __root.tsx             # Root layout with providers
│   │   ├── index.tsx              # Home page
│   │   ├── about.tsx              # About page
│   │   └── api.trpc.$trpc.ts      # tRPC API handler
│   ├── server/                    # Server-side code
│   │   ├── routers/               # Feature-based tRPC routers
│   │   │   ├── index.ts           # Root router (combines all routers)
│   │   │   └── example.ts         # Example feature router
│   │   ├── trpc.ts                # tRPC initialization & procedures
│   │   └── context.ts             # Request context creator
│   ├── lib/                       # Shared utilities
│   │   ├── trpc.ts                # Client-side tRPC setup
│   │   └── env.ts                 # Type-safe environment variables
│   ├── components/                # React components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ThemeToggle.tsx
│   ├── styles/                    # Panda CSS config
│   │   ├── recipes/               # Component style recipes
│   │   │   ├── button.ts
│   │   │   └── index.ts
│   │   └── global.css             # Global styles (Panda layers)
│   └── router.tsx                 # Router configuration
├── styled-system/                 # Panda CSS generated output (gitignored)
├── public/                        # Static assets
├── .env.example                   # Environment variables template
├── .env                           # Local environment (gitignored)
├── biome.json                     # Biome configuration
├── panda.config.ts                # Panda CSS configuration
├── postcss.config.cjs             # PostCSS configuration
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite configuration
└── package.json                   # Dependencies & scripts
```

## 🏁 Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.2+)

### Installation

1. Install dependencies:
```bash
bun install
```

2. Generate Panda CSS styled-system:
```bash
bun run prepare
```

3. Start the development server:
```bash
bun dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 📜 Available Scripts

- `bun dev` - Start development server on port 3000
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run prepare` - Generate Panda CSS styled-system
- `bun run lint` - Run Biome linter
- `bun run format` - Format code with Biome
- `bun run check` - Run all Biome checks (lint + format)
- `bun test` - Run tests with Vitest

## 🎯 Key Features

### Type-Safe API with tRPC

The application includes a fully configured tRPC setup with:
- Feature-based router organization (`src/server/routers/`)
- End-to-end type safety from server to client
- Integration with TanStack Query for data fetching
- Example procedures for queries and mutations

Example usage:
```tsx
import { trpc } from "#/lib/trpc";

function MyComponent() {
  const hello = trpc.example.hello.useQuery({ name: "World" });
  
  return <div>{hello.data}</div>;
}
```

### Styling with Panda CSS

Panda CSS provides:
- Zero-runtime CSS-in-JS
- Type-safe styling
- Automatic style generation
- Recipe system for component variants

Example:
```tsx
import { css } from "../../styled-system/css";

function Button() {
  return (
    <button className={css({
      bg: "blue.500",
      color: "white",
      px: "4",
      py: "2",
      borderRadius: "md"
    })}>
      Click me
    </button>
  );
}
```

### Component Recipes

Create reusable component styles in `src/styles/recipes/`:
```tsx
import { defineSlotRecipe } from "@pandacss/dev";

export const buttonRecipe = defineSlotRecipe({
  className: "button",
  slots: [],
  base: {},
  variants: {
    variant: {
      primary: { /* ... */ },
      secondary: { /* ... */ }
    }
  }
});
```

### Environment Variables

Type-safe environment variables are configured in `src/lib/env.ts` using Zod:
```tsx
import { env } from "#/lib/env";

// Usage
console.log(env.NODE_ENV); // Fully typed!
```

Add new variables to `.env` and update the schema in `src/lib/env.ts`.

## 🔧 Adding New Features

### Adding a New tRPC Router

1. Create a new router file in `src/server/routers/`:
```tsx
// src/server/routers/users.ts
import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const usersRouter = router({
  getAll: publicProcedure.query(() => {
    // Your logic here
  }),
  
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      // Your logic here
    }),
});
```

2. Add it to the root router in `src/server/routers/index.ts`:
```tsx
import { usersRouter } from "./users";

export const appRouter = router({
  example: exampleRouter,
  users: usersRouter,  // Add here
});
```

### Adding a New Route

Create a new file in `src/routes/`:
```tsx
// src/routes/dashboard.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  return <div>Dashboard Page</div>;
}
```

### Styling with Ark UI

Ark UI provides headless, accessible components:
```tsx
import * as Accordion from "@ark-ui/react/accordion";
import { css } from "../../styled-system/css";

function MyAccordion() {
  return (
    <Accordion.Root>
      <Accordion.Item value="item-1">
        <Accordion.ItemTrigger className={css({ p: "4" })}>
          What is Ark UI?
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          Headless component library for building accessible UIs.
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  );
}
```

## 🧪 Testing

The project is set up with Vitest and Testing Library:
```bash
bun test
```

## 📦 Building for Production

```bash
bun run build
```

The production build will be output to the `dist/` directory.

## 🔍 Code Quality

This project uses Biome for:
- Fast linting (replaces ESLint)
- Fast formatting (replaces Prettier)
- Import organization
- Tab indentation with double quotes

Run checks:
```bash
bun run check
```

Auto-fix issues:
```bash
bun run check --write
```

## 🌐 Deployment

The application can be deployed to various platforms:
- **Vercel** - Native support for TanStack Start
- **Netlify** - Configure with the Netlify adapter
- **Cloudflare Pages** - Use the Cloudflare adapter
- **Railway** - Use the Railway adapter

Configure deployment adapter in `package.json` or during build.

## 📝 Notes

- The `styled-system/` directory is auto-generated by Panda CSS and should not be edited manually
- The `.env` file is gitignored - use `.env.example` as a template
- API routes use the `.api.` prefix pattern for TanStack Start
- All tRPC procedures have full type safety across client and server

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `bun run check --write` to format code
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🔗 Resources

- [TanStack Start Docs](https://tanstack.com/start)
- [tRPC Docs](https://trpc.io/docs)
- [Panda CSS Docs](https://panda-css.com)
- [Ark UI Docs](https://ark-ui.com)
- [TanStack Query Docs](https://tanstack.com/query)
- [Biome Docs](https://biomejs.dev)
- [Bun Docs](https://bun.sh/docs)

---

Built with ❤️ using modern web technologies
