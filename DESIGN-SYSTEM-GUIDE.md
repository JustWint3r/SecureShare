# SecureShare Design System Guide

## Design Philosophy: Cyberpunk Brutalism

This design system breaks away from generic "AI slop" aesthetics with a bold, distinctive approach combining:
- **Dark cyberpunk theme**: Deep navy/charcoal with electric cyan and neon orange accents
- **Brutalist typography**: IBM Plex Mono for headings, Manrope for body text
- **Atmospheric backgrounds**: Layered gradients with grid patterns and noise textures
- **Snappy animations**: Sharp transitions with staggered reveals using Framer Motion

---

## Color Palette

### Background Colors
```css
--bg-primary: #0a0e1a        /* Main background - deep navy */
--bg-secondary: #111827       /* Secondary background */
--bg-tertiary: #1a2332        /* Tertiary background */
```

### Surface Colors
```css
--surface-primary: #1a2332    /* Card backgrounds */
--surface-secondary: #242f42   /* Elevated cards */
--surface-hover: #2d3b52       /* Hover states */
--surface-active: #374456      /* Active states */
```

### Accent Colors
```css
/* Cyan - Primary accent */
--accent-cyan: #00d9ff
--accent-cyan-dim: #0891b2
--accent-cyan-bright: #67e8f9

/* Orange - Secondary accent */
--accent-orange: #ff6b35
--accent-orange-dim: #ea580c
--accent-orange-bright: #fb923c

/* Purple - Tertiary accent */
--accent-purple: #a855f7
--accent-purple-dim: #7c3aed
```

### Text Colors
```css
--text-primary: #f1f5f9       /* Primary text - brightest */
--text-secondary: #cbd5e1     /* Secondary text */
--text-tertiary: #94a3b8      /* Tertiary text */
--text-muted: #64748b         /* Muted text - least emphasis */
```

### Semantic Colors
```css
--success: #10b981            /* Success states */
--warning: #f59e0b            /* Warning states */
--error: #ef4444              /* Error states */
--info: #3b82f6               /* Info states */
```

---

## Typography

### Font Families

**Headings**: IBM Plex Mono (monospace)
- Distinctive, technical feel
- Perfect for the cyberpunk aesthetic
- Usage: All h1-h6 tags, buttons, labels

**Body**: Manrope (sans-serif)
- Modern, clean, highly readable
- Slightly condensed for efficient space usage
- Usage: Paragraphs, descriptions, body text

### Font Loading
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&display=swap');
```

### Type Scale
```css
h1: 3rem (48px)
h2: 2.25rem (36px)
h3: 1.875rem (30px)
h4: 1.5rem (24px)
h5: 1.25rem (20px)
h6: 1rem (16px)
```

---

## Components

### Buttons

**Primary Button** (`.btn-primary`)
- Cyan gradient background
- Shimmer effect on hover
- Uppercase text with letter spacing
- Shadow glow effect

```html
<button class="btn-primary">UPLOAD FILE</button>
```

**Secondary Button** (`.btn-secondary`)
- Surface background with border
- Hover changes border to cyan
- Uppercase text

```html
<button class="btn-secondary">CANCEL</button>
```

**Danger Button** (`.btn-danger`)
- Red gradient background
- Glow effect on hover
- Uppercase text

```html
<button class="btn-danger">DELETE</button>
```

### Cards

**Standard Card** (`.card`)
- Dark surface background
- Subtle border
- Hover effect: lifts up and glows

```html
<div class="card">
  <!-- Content -->
</div>
```

**Elevated Card** (`.card-elevated`)
- Slightly lighter background
- Box shadow
- Stronger hover effect with cyan glow

```html
<div class="card-elevated">
  <!-- Content -->
</div>
```

### Inputs

**Input Field** (`.input-field`)
- Dark surface background
- Border that glows cyan on focus
- Manrope font family

```html
<input type="text" class="input-field" placeholder="Enter text..." />
```

---

## Effects & Utilities

### Gradients

**Text Gradient** (`.text-gradient`)
- Cyan to orange gradient
- For headings and emphasis

**Text Gradient Purple** (`.text-gradient-purple`)
- Purple to cyan gradient
- Alternative gradient style

### Glass Effect (`.glass-effect`)
- Translucent background with blur
- Perfect for overlays and modals

### Gradient Border (`.gradient-border`)
- Animated gradient border
- Cyan to orange

### Glow Effects
```css
.glow-cyan    /* Cyan glow shadow */
.glow-orange  /* Orange glow shadow */
```

---

## Animations

### Built-in Keyframes

```css
@keyframes fadeIn        /* Fade in from transparent */
@keyframes slideUp       /* Slide up from below */
@keyframes slideDown     /* Slide down from above */
@keyframes slideLeft     /* Slide left from right */
@keyframes slideRight    /* Slide right from left */
@keyframes scaleIn       /* Scale up from small */
@keyframes pulse         /* Pulsing opacity */
@keyframes glow          /* Pulsing glow */
@keyframes shimmer       /* Shimmer effect */
```

### Utility Classes

```css
.animate-fade-in
.animate-slide-up
.animate-slide-down
.animate-slide-left
.animate-slide-right
.animate-scale-in
```

### Framer Motion Usage

The design uses Framer Motion for advanced animations:

```typescript
import { motion } from 'framer-motion';

// Staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  <motion.div variants={itemVariants}>Item 1</motion.div>
  <motion.div variants={itemVariants}>Item 2</motion.div>
</motion.div>
```

---

## Background Patterns

### Grid Pattern
Applied globally to body with pseudo-elements:
- 24px grid size
- Subtle gray lines (rgba(100, 116, 139, 0.08))
- Fixed position overlay

### Radial Gradients
- Cyan glow at top
- Orange glow at bottom right
- Very subtle (3% opacity)

---

## Design Principles

### 1. **Avoid Generic Aesthetics**
❌ Don't use: Inter, Roboto, Arial, system fonts
❌ Avoid: Purple gradients on white backgrounds
❌ Skip: Cookie-cutter layouts

✅ Do use: Distinctive fonts (IBM Plex Mono, Manrope)
✅ Create: Bold, dark themes with neon accents
✅ Design: Unexpected layouts that surprise

### 2. **Create Atmosphere**
- Layer multiple background effects
- Use subtle patterns and textures
- Add depth with shadows and glows
- Animate thoughtfully for impact

### 3. **Typography Matters**
- Choose unique, beautiful fonts
- Use font weight for hierarchy
- Leverage letter spacing strategically
- Mix monospace with sans-serif

### 4. **Motion with Purpose**
- Focus on high-impact moments
- Use staggered reveals for page loads
- Keep micro-interactions subtle
- Avoid motion overkill

### 5. **Consistency Through Variables**
- Use CSS custom properties
- Maintain color relationships
- Keep spacing systematic
- Scale typography proportionally

---

## Component Examples

### Login Page
- Full-screen split layout
- Animated background glows
- Staggered text reveals
- Feature grid with hover effects
- Scan line animation overlay

### Sidebar
- Gradient accent line
- Glowing logo
- Active state indicators
- Smooth hover transitions
- Role badges with theme colors

### Dashboard
- Dark background with grid
- Elevated header section
- Consistent card styling
- Search with custom input styling
- Primary action buttons

---

## Implementation Checklist

✅ Installed Framer Motion
✅ Created global CSS with design system
✅ Redesigned login page (PrivyLoginForm.tsx)
✅ Updated loading states (page.tsx)
✅ Redesigned Sidebar (Sidebar.tsx)
✅ Updated Dashboard header and layout (Dashboard.tsx)
⏳ File grid and cards (in progress)
⏳ Modal components (pending)
⏳ User profile setup (pending)

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox
- CSS Custom Properties
- Backdrop Filter (with fallbacks)
- Animation support required

---

## Performance Considerations

1. **Font Loading**: Using Google Fonts with `display=swap`
2. **Animations**: GPU-accelerated transforms
3. **Images**: Lazy load where possible
4. **Bundle Size**: Framer Motion is tree-shakeable
5. **CSS**: Minimal specificity, reusable classes

---

## Future Enhancements

- [ ] Add dark/light theme toggle
- [ ] Implement reduced motion preferences
- [ ] Add more micro-interactions
- [ ] Create component library documentation
- [ ] Add accessibility improvements (ARIA labels, focus states)
- [ ] Optimize for mobile responsiveness

---

**Design Version**: 2.0.0
**Last Updated**: 2025-12-16
**Designer**: Claude Sonnet 4.5 with Human Direction
