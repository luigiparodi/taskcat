# TaskCat Design System

Apple-inspired design system for TaskCat task/project management application.

## Overview

This design system provides a cohesive, accessible, and performant foundation for building TaskCat's UI. It's built on:

- **Tailwind CSS v4** - Utility-first styling with native CSS variables
- **ShadCN/UI** - Unstyled, accessible components built on Radix UI
- **Radix UI** - Headless, accessible component primitives
- **Class Variance Authority (CVA)** - Type-safe component variants
- **Design Tokens** - Platform-agnostic design decisions in `design-tokens.json`

## Quick Start

```bash
# Install dependencies
cd client && npm install

# Add new ShadCN components
npx shadcn@latest add <component-name>

# View design tokens
cat design-tokens.json
```

## Design Principles

1. **Apple-Inspired Aesthetics** - Clean, minimal, refined interactions
2. **Dark-First** - Default mode is dark; light mode as variant
3. **Accessibility First** - WCAG 2.1 AA compliance via Radix primitives
4. **Performance** - CSS variables for zero-runtime theming
5. **Consistency** - Single source of truth via design tokens
6. **Developer Experience** - Type-safe components with CVA variants

## Color System

### Semantic Colors (Light Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#ffffff` | Page background |
| `--foreground` | `#1d1d1f` | Primary text |
| `--card` | `#ffffff` | Card surfaces |
| `--card-foreground` | `#1d1d1f` | Card text |
| `--primary` | `#125bb0` | Primary actions |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#f1f2f4` | Secondary surfaces |
| `--muted` | `#f1f2f4` | Subtle backgrounds |
| `--muted-foreground` | `#6e6e73` | Secondary text |
| `--accent` | `#f0f6fe` | Accent backgrounds |
| `--destructive` | `#bc413a` | Danger actions |
| `--border` | `#e1e3e5` | Default borders |
| `--ring` | `#266fc9` | Focus rings |

### Semantic Colors (Dark Mode - Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0a0a0b` | Page background |
| `--foreground` | `#f9fafb` | Primary text |
| `--card` | `#161719` | Card surfaces |
| `--primary` | `#7faff0` | Primary actions |
| `--secondary` | `#292a2c` | Secondary surfaces |
| `--muted` | `#292a2c` | Subtle backgrounds |
| `--muted-foreground` | `#a1a3a7` | Secondary text |
| `--destructive` | `#f08078` | Danger actions |
| `--border` | `#292a2c` | Default borders |
| `--ring` | `#5690dd` | Focus rings |

### Surface Elevation (Dark Mode)

| Level | Token | Value | Usage |
|-------|-------|-------|-------|
| 0 | `--surface-subtle` | `#161719` | Base elevation |
| 1 | `--surface-1` | `#161719` | Cards, panels |
| 2 | `--surface-2` | `#292a2c` | Elevated cards |
| 3 | `--surface-inset` | `#0a0a0b` | Sunken areas |

### State Colors

| State | Subtle | Border | On Subtle | Usage |
|-------|--------|--------|-----------|-------|
| Success | `#e3fae6` / `#273a30` | `#9fd7aa` / `#3d6f52` | `#077f3a` / `#5cc98a` | Completed tasks |
| Warning | `#fff0dc` / `#3b3325` | `#edbe7b` / `#7b6131` | `#956302` / `#e0a838` | Pending review |
| Danger | `#ffeeec` / `#2d2323` | `#f9b2a9` / `#915450` | `#bc413a` / `#f08078` | Errors, deletion |
| Info | `#e8f4ff` / `#1e2730` | `#98cdfb` / `#386990` | `#0372b5` / `#4aa8ee` | In-progress tasks |

### Interactive States (Apple Pattern)

| State | Light | Dark | Pattern |
|-------|-------|------|---------|
| Primary Hover | `#266fc9` | `#a4c9fc` | Lightens on hover |
| Primary Active | `#0a488f` | `#5690dd` | Darkens on press |
| Secondary Hover | `#e1e3e5` | `#424446` | Lightens on hover |
| Secondary Active | `#cdcfd2` | `#161719` | Darkens on press |

## Typography Scale

9-level type scale with optical adjustments:

| Level | Size | Line Height | Letter Spacing | Weight | Usage |
|-------|------|-------------|----------------|--------|-------|
| Display | 3.5rem (56px) | 4rem | -0.022em | 600 | Hero headlines |
| Title 1 | 2.5rem (40px) | 3rem | -0.02em | 600 | Page titles |
| Title 2 | 2rem (32px) | 2.5rem | -0.016em | 600 | Section headers |
| Title 3 | 1.5rem (24px) | 2rem | -0.012em | 600 | Card titles |
| Heading | 1.25rem (20px) | 1.75rem | -0.008em | 600 | Subsections |
| Body Large | 1.0625rem (17px) | 1.625rem | -0.002em | 400 | Important body |
| Body | 0.9375rem (15px) | 1.375rem | 0em | 400 | Default body |
| Caption | 0.8125rem (13px) | 1.125rem | 0.004em | 400 | Metadata, labels |
| Footnote | 0.6875rem (11px) | 0.875rem | 0.006em | 400 | Legal, timestamps |

### Tailwind Classes

```tsx
// Available via cn() utility
className="text-display"
className="text-title-1"
className="text-title-2"
className="text-title-3"
className="text-heading"
className="text-body-lg"
className="text-body"
className="text-caption"
className="text-footnote"
```

## Spacing System

8px base unit with semantic aliases:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Micro spacing |
| `space-2` | 8px | Base unit |
| `space-3` | 12px | Small gaps |
| `space-4` | 16px | Standard gaps |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Large gaps |

### Container & Gutters

| Breakpoint | Container Max | Gutter |
|------------|---------------|--------|
| Mobile | 100% | 1rem (16px) |
| Tablet | 768px | 1.5rem (24px) |
| Desktop | 1280px | 2rem (32px) |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Small elements |
| `--radius-md` | 8px | Default inputs |
| `--radius-lg` | 10px | Cards (default) |
| `--radius-xl` | 14px | Large cards |
| `--radius-button` | 9999px | Pill buttons |
| `--radius-card` | 18px | Card containers |
| `--radius-box` | 12px | Inputs, dialogs |

## Shadows

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--shadow-sm` | `0 2px 4px rgba(0,0,0,0.04)` | - | Subtle elevation |
| `--shadow-md` | `0 4px 14px rgba(0,0,0,0.08)` | - | Medium elevation |
| `--shadow-lg` | `0 10px 30px rgba(0,0,0,0.12)` | - | High elevation |
| `--shadow-card` | `0 1px 2px rgba(0,0,0,0.04)` | `0 1px 2px rgba(0,0,0,0.55)` | Cards |
| `--shadow-card-hover` | `0 4px 14px rgba(0,0,0,0.08)` | `0 6px 18px rgba(0,0,0,0.65)` | Interactive cards |
| `--shadow-dialog` | `0 10px 40px rgba(0,0,0,0.16)` | `0 10px 40px rgba(0,0,0,0.7)` | Modals |

## Motion System

### Durations

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Micro-interactions |
| `--duration-base` | 250ms | Standard transitions |
| `--duration-slow` | 400ms | Complex animations |

### Easings

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default |
| `--ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Exits |
| `--ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Entrances |

### Tailwind Classes

```tsx
className="duration-150 ease-standard"
className="duration-250 ease-decelerate"
className="duration-400 ease-accelerate"
```

## Components

### Button

Located: `src/components/ui/button.tsx`

**Variants:**
- `default` - Primary actions
- `secondary` - Secondary actions
- `outline` - Tertiary actions
- `ghost` - Subtle actions
- `destructive` - Danger actions
- `destructive-solid` - Primary danger
- `link` - Text links

**Sizes:**
- `sm` - 32px height
- `default` - 36px height
- `lg` - 44px height
- `icon-sm` - 32px square
- `icon` - 36px square
- `icon-lg` - 44px square

**Props:**
```tsx
interface ButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'destructive-solid' | 'link'
  size?: 'sm' | 'default' | 'lg' | 'icon-sm' | 'icon' | 'icon-lg'
  asChild?: boolean
  loading?: boolean
}
```

### Card

Located: `src/components/ui/card.tsx`

**Features:**
- Interactive state (hover, focus, active)
- Selection state
- Drag state for dnd-kit integration
- Compound components: Header, Title, Description, Content, Footer, BadgeRow

**Props:**
```tsx
interface CardProps {
  interactive?: boolean
  selected?: boolean
  dragging?: boolean
}
```

### Dialog

Located: `src/components/ui/dialog.tsx`

**Sizes:** `sm` (384px), `default` (512px), `lg` (768px)

**Features:**
- Mobile: bottom sheet
- Desktop: centered modal
- Built-in close button
- Accessible focus management

### Input

Located: `src/components/ui/input.tsx`

**Sizes:** `sm` (32px), `default` (36px), `lg` (44px)

**Features:**
- Start icon support
- End slot (suffix) support
- Field integration for validation
- Proper ARIA attributes

### Badge

Located: `src/components/ui/badge.tsx`

**Tones:** `neutral`, `info`, `success`, `warning`, `danger`, `primary`

**Sizes:** `sm` (20px), `default` (24px)

**Specialized:**
- `StatusBadge` - Maps task status to tone
- `PriorityBadge` - Maps priority to tone

### Field

Located: `src/components/ui/field.tsx`

**Features:**
- Label + description + error message
- React Hook Form integration
- Accessible ARIA relationships

## Adding New Components

```bash
# Add official ShadCN component
npx shadcn@latest add table
npx shadcn@latest add pagination
npx shadcn@latest add toast
npx shadcn@latest add skeleton
npx shadcn@latest add tabs
npx shadcn@latest add sidebar
npx shadcn@latest add select
npx shadcn@latest add date-picker
npx shadcn@latest add checkbox
npx shadcn@latest add switch
npx shadcn@latest add slider
npx shadcn@latest add popover
npx shadcn@latest add hover-card
npx shadcn@latest add context-menu
npx shadcn@latest add chart
```

## Theming

### Dark Mode (Default)

```css
:root {
  color-scheme: dark;
  /* dark tokens defined here */
}
```

### Light Mode

```css
.light {
  /* light tokens defined here */
}
```

### Toggle Theme

```tsx
// In your theme provider
document.documentElement.classList.toggle('light')
```

## Accessibility

All components inherit Radix UI accessibility:

- **Keyboard Navigation** - Tab, Arrow keys, Escape
- **Focus Management** - Trapped in modals, restored on close
- **ARIA Attributes** - Proper roles, states, properties
- **Screen Readers** - Semantic HTML, live regions
- **Reduced Motion** - Respects `prefers-reduced-motion`

## Design Tokens Usage

### In CSS (index.css)

```css
@theme {
  --color-primary: var(--primary);
  --radius-card: var(--radius-apple-card);
}
```

### In Components

```tsx
// Use semantic tokens via Tailwind classes
className="bg-primary text-primary-foreground"
className="border-border hover:border-border-strong"
className="rounded-card shadow-card hover:shadow-card-hover"
```

### In JavaScript/TypeScript

```typescript
import { designTokens } from './design-tokens.json'

// For chart libraries, email templates, etc.
const primaryColor = designTokens.tokenSets.color.primary['500'].value
```

## Conventions

### Component Structure

```
src/components/ui/
├── component-name.tsx      # Main component + variants
├── component-name.stories.tsx  # Storybook (if added)
└── component-name.test.tsx     # Unit tests
```

### Naming

- **Files**: kebab-case (`button.tsx`)
- **Components**: PascalCase (`Button`)
- **Variants**: camelCase (`variant`, `size`)
- **CSS Classes**: kebab-case (`data-slot="button"`)

### Data Attributes

All components use `data-slot` for testing/styling:

```tsx
<div data-slot="card" data-interactive data-selected data-dragging>
```

## Migration Guide

### From Custom CSS to Design Tokens

1. Replace hardcoded values with semantic tokens
2. Use `bg-background` not `bg-white`
3. Use `text-foreground` not `text-black`
4. Use `border-border` not `border-gray-200`

### Adding Component Variants

```typescript
// Use CVA for type-safe variants
const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
      },
      size: {
        sm: "h-8 px-3 text-caption",
        default: "h-9 px-4 text-body",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

## Resources

- [Design Tokens Format](https://design-tokens.github.io/format/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [ShadCN/UI Docs](https://ui.shadcn.com/)
- [Radix UI Docs](https://www.radix-ui.com/)
- [CVA Docs](https://cva.style/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Changelog

### v1.0.0 (Current)

- Initial design system setup
- Apple-inspired dark/light color system
- 9-level typography scale
- 8px spacing system
- Semantic border radius
- Shadow elevation system
- Motion tokens
- Core components: Button, Card, Dialog, Input, Badge, Field, DropdownMenu, AlertDialog
- Design tokens export (`design-tokens.json`)