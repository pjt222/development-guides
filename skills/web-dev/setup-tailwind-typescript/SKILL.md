---
name: setup-tailwind-typescript
description: >
  Configure Tailwind CSS with TypeScript in a Next.js or React project.
  Covers installation, configuration, custom theme extensions, component
  patterns, and type-safe styling utilities. Use when adding Tailwind CSS
  to an existing TypeScript project, customizing the Tailwind theme for a
  project's design system, setting up type-safe component styling patterns,
  or configuring Tailwind plugins and extensions.
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: web-dev
  complexity: basic
  language: TypeScript
  tags: tailwind, typescript, css, styling, configuration
---

# Set Up Tailwind CSS with TypeScript

Configure Tailwind CSS in a TypeScript project with custom theme, utilities, and type-safe patterns.

## When to Use

- Adding Tailwind CSS to an existing TypeScript project
- Customizing Tailwind theme for a project's design system
- Setting up type-safe component styling patterns
- Configuring Tailwind plugins and extensions

## Inputs

- **Required**: TypeScript project (Next.js, Vite, or standalone React)
- **Optional**: Design system tokens (colors, spacing, fonts)
- **Optional**: Tailwind plugins to include

## Procedure

### Step 1: Install Tailwind CSS

```bash
npm install -D tailwindcss @tailwindcss/postcss postcss
```

For Next.js (if not already included):

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 2: Configure tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a5f",
        },
        secondary: {
          500: "#6366f1",
          600: "#4f46e5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
    },
  },
  plugins: [],
};

export default config;
```

### Step 3: Set Up Global Styles

Edit `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply antialiased;
  }

  body {
    @apply bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg
           hover:bg-primary-700 focus:outline-none focus:ring-2
           focus:ring-primary-500 focus:ring-offset-2
           transition-colors duration-200;
  }
}
```

### Step 4: Create Type-Safe Utility Helpers

Create `src/lib/cn.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Install dependencies:

```bash
npm install clsx tailwind-merge
```

Usage in components:

```tsx
import { cn } from "@/lib/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors",
        variant === "primary" && "bg-primary-600 text-white hover:bg-primary-700",
        variant === "secondary" && "bg-secondary-500 text-white hover:bg-secondary-600",
        variant === "outline" && "border border-gray-300 hover:bg-gray-50",
        className
      )}
      {...props}
    />
  );
}
```

### Step 5: Add Dark Mode Support

Update `tailwind.config.ts`:

```typescript
const config: Config = {
  darkMode: "class", // or "media" for system preference
  // ... rest of config
};
```

Toggle implementation:

```tsx
"use client";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button onClick={() => setDark(!dark)}>
      {dark ? "Light" : "Dark"} Mode
    </button>
  );
}
```

### Step 6: Add Plugins (Optional)

```bash
npm install -D @tailwindcss/typography @tailwindcss/forms
```

```typescript
// tailwind.config.ts
import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";

const config: Config = {
  // ...
  plugins: [typography, forms],
};
```

## Validation

- [ ] Tailwind classes render correctly in the browser
- [ ] Custom theme values (colors, fonts, spacing) work
- [ ] `cn()` utility merges classes without conflicts
- [ ] Dark mode toggles correctly
- [ ] TypeScript shows no errors in config or components
- [ ] Production build purges unused styles

## Common Pitfalls

- **Content paths missing**: If classes don't render, check `content` array in config matches your file locations
- **Class conflicts**: Use `tailwind-merge` (via `cn()`) to prevent conflicting utility classes
- **Custom values not working**: Ensure custom values are under `extend` (to add) not at theme root (which replaces defaults)
- **Dark mode not toggling**: Check `darkMode` setting and that the `dark` class is on `<html>` not `<body>`

## Related Skills

- `scaffold-nextjs-app` - project setup before Tailwind configuration
- `deploy-to-vercel` - deploy the styled application
