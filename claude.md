# Festival Atlas - Central European Festival Discovery Platform

## Project Overview

Build a beautiful, performant, static website for discovering music festivals across Central Europe. The site features an interactive map view, calendar timeline, and dynamic filtering - all without user authentication or backend services. Data is stored locally in JSON format.

**Domain:** festivals.klatterico.de  
**Name:** Festival Atlas  
**Tagline:** "Your Central European Festival Compass"

## Core Principles

- **Beautiful-first:** Stunning visual design and polish is the top priority
- **Dark theme perfection:** Deep blacks with bright text and colorful accents
- **No corners:** Everything rounded - buttons, cards, inputs, images, containers
- **Smooth animations:** Delightful micro-interactions and transitions everywhere
- **Mobile-first:** Responsive design optimized for mobile browsing
- **Rich interactions:** Use React UI libraries for professional-grade components
- **No dependencies on third-party APIs:** Self-contained, local data storage
- **No user data collection:** No auth, no personalization, no tracking

**Design Philosophy:** This should look and feel like a premium, professionally-designed product - think Spotify, Apple Music, or Behance quality. Not a basic static site.

## Tech Stack

- **Framework:** Astro (static site generation)
- **Interactive Components:** React islands for complex/interactive UI
- **UI Component Library:** shadcn/ui (or Radix UI / Headless UI) - for beautiful, pre-built components
- **Map:** Leaflet.js with OpenStreetMap tiles + heat map plugin
- **Charts:** Recharts (React-based) for historical data visualization
- **Data:** Local JSON files (festivals.json)
- **Styling:** Tailwind CSS
- **Icons:** Lucide Icons (matches shadcn/ui)
- **Animations:** Framer Motion for smooth transitions and micro-interactions
- **Interactivity:** React components for filters, modals, toggles
- **Hosting:** Static deployment (Netlify/Vercel compatible)

**Key Architecture Decision:**
Use Astro for static content + React islands for interactive components. This allows access to React's rich ecosystem of UI libraries while maintaining Astro's benefits. The `client:load` or `client:visible` directives load React components only where needed.

## Data Structure

The app reads from a single JSON file containing all festival data. Each festival should have:

- **id:** Unique identifier (kebab-case)
- **name:** Festival name
- **description:** Brief description (1-2 sentences)
- **location:**
  - city, country, countryCode (ISO 2-letter), venue
  - coordinates (lat/lng for map markers)
- **dates:**
  - start date (ISO format YYYY-MM-DD)
  - end date (ISO format YYYY-MM-DD)
  - year (2026)
- **genres:** Array from: EDM, Techno, Rock, Metal, Else
- **size:** Festival size (small, medium, large, massive)
- **ticketInfo:**
  - priceRange (human-readable like "€300-€500")
  - currency code
  - ticket link
- **website:** Official festival website URL
- **instagram:** Instagram profile URL (optional)
- **image:** Path to festival image (optional)
- **featured:** Boolean flag for homepage highlights
- **lineup:** Array of artist names performing (optional, for lineup-based search)
- **reviewSummary:** AI-generated summary of reviews/posts (optional, user will populate)
- **historicalData:** Object with past year attendance/growth (optional)
  - years array with: year, attendance, notable_acts

Create sample data with 8-10 example festivals covering different genres, countries, and dates throughout 2026:
- Tomorrowland (Belgium, July, EDM/Techno)
- Rock am Ring (Germany, June, Rock/Metal)
- EXIT Festival (Serbia, July, EDM/Else)
- Wacken Open Air (Germany, August, Metal)
- Sziget Festival (Hungary, August, Else - mixed genres)
- Parookaville (Germany, July, EDM/Techno)
- Nova Rock (Austria, June, Rock/Metal)
- Airbeat One (Germany, July, EDM/Techno)

Include realistic sample data for lineup, reviewSummary, and historicalData in at least 3-4 of these festivals.

## Key Components Needed

The app should have these reusable components:

- **Header** - Site navigation with logo and view links
- **Footer** - Credits and basic info
- **FestivalCard** - Individual festival preview card (clickable to open detail)
- **FestivalDetail** - Modal/popup or full page with comprehensive festival information
- **FestivalList** - Grid of festival cards
- **MapView** - Interactive Leaflet map with heat map layer option
- **CalendarView** - Timeline visualization by month (only showing months with festivals)
- **FilterBar** - Dynamic filtering controls with lineup search
- **GenreBadge** - Colored genre tags
- **ViewToggle** - Switch between table and grid view (for List page)

And these main pages:

- **Homepage** (index) - Landing page with featured festivals and quick stats
- **Map View** - Interactive map with optional heat map overlay
- **Calendar View** - Chronological timeline by month
- **List View** - Filterable grid/table of all festivals with view toggle
- **Festival Detail** - Individual festival page with full information (or modal popup)

## Page Descriptions

### Homepage

The landing page that introduces Festival Atlas and highlights featured festivals.

**Should include:**
- Hero section with site name "Festival Atlas" (large, bright white heading) and tagline "Your Central European Festival Compass"
- Eye-catching visual design - dark background with bright, colorful accents
- 3-4 featured festival cards (where featured: true in data) - clickable to open detail
- **Quick stats section** showing:
  - Total number of festivals
  - Number of countries covered
  - Number of genres available
  - Any other interesting metrics
  - Use bright, colorful numbers/icons on dark background
- Clear navigation buttons to Map, Calendar, and List views - vibrant, rounded buttons
- Footer with credits

**Visual priority:**
- Dark background throughout
- Bright white headings
- Colorful CTAs and accent elements
- No rectangular corners anywhere
- Smooth animations and hover effects

### Map View

Full-screen interactive map showing all festival locations across Central Europe.

**Features:**
- Leaflet map centered on Central Europe (around lat 50.5, lng 10.5, zoom level 5)
- Custom marker icons for each festival, color-coded by genre
- Clicking a marker opens the festival detail modal/popup
- Filter bar above map for genre and country filtering
- Legend showing what each marker color represents
- Marker clustering if multiple festivals are in same location
- **Heat Map Toggle:** Button to switch between marker view and heat map view
  - Heat map shows festival density/concentration across the region
  - Warmer colors (red/orange) = more festivals in that area
  - Cooler colors (blue/green) = fewer festivals
  - Useful for seeing festival hotspots at a glance
- Responsive design - map adjusts height for mobile

### Calendar View

Timeline visualization organizing festivals chronologically by month.

**Features:**
- Monthly sections for each month that has at least one festival
- **DO NOT show months with zero festivals** - skip empty months entirely
- Each month header shows the month name and festival count
- Festivals displayed as cards in chronological order within each month
- Filter bar for genre and country
- Visual indicators for multi-day festivals
- Smooth scrolling between months
- Mobile: vertical timeline layout
- Quick jump navigation to skip to months with festivals

### List View

Comprehensive filterable and sortable list of all festivals with multiple viewing options.

**Features:**
- **View Toggle:** Switch between Grid View and Table View
  - **Grid View:** Card layout (1 column mobile, 2-3 columns desktop)
  - **Table View:** Spreadsheet-style table with columns for Name, Date, Location, Genres, Price
- Filter bar with active filter indicators
- Sort dropdown with options: Date (ascending), Name (A-Z), Country
- Total festival count display updates based on filters
- Scroll-to-top button for long lists
- Smooth animations when filters update or view changes
- Table view should be responsive (scrollable on mobile or simplified columns)

## Design Polish & Visual Excellence

### Animation & Interaction Principles

**Micro-interactions everywhere:**
- Buttons should scale slightly on hover (transform: scale(1.05))
- Cards should lift and glow on hover
- Smooth transitions on all state changes (0.2-0.3s ease)
- Subtle bounce or spring animations using Framer Motion
- Page transitions should be smooth, not jarring

**Loading states:**
- Skeleton loaders for content
- Smooth fade-ins when data appears
- Stagger animations for lists of cards

**Feedback:**
- Active states clearly visible
- Hover states on everything clickable
- Focus rings for keyboard navigation (bright colored rings)
- Success/error states with color and animation

### Typography Excellence

**Font choices:**
- Consider using a premium font pairing:
  - Headings: Inter, Poppins, or Satoshi (modern, clean)
  - Body: Same as headings for consistency
- Or stick with SF Pro / system fonts but with excellent hierarchy

**Text styling:**
- Bright white (#FFFFFF) for main headings
- Light gray (#E0E0E0) for body text
- Medium gray (#9CA3AF) for supporting text
- Colorful text for accents (links, CTAs)
- Generous line height (1.6-1.8 for body)
- Ample letter spacing for headings

### Spacing & Rhythm

**White space is your friend:**
- Double or triple spacing between major sections
- Generous padding in cards and containers
- Never cramped - always room to breathe
- Consistent spacing scale (use Tailwind's spacing)

### Color Usage

**Strategic color application:**
- Dark backgrounds (blacks and dark grays)
- Bright white text for readability
- Genre colors used consistently (badges, charts, accents)
- Vibrant CTAs that pop (blues, purples)
- Subtle gradients for backgrounds and cards
- Consider adding subtle color overlays to images

### Shadows & Depth

**Layering with shadows:**
- Cards: subtle shadow that intensifies on hover
- Modals: strong shadow to indicate elevation
- Floating elements (filter bar): medium shadow
- Use colored shadows that match genre colors for extra flair

### Glassmorphism & Modern Effects

**Consider using:**
- Subtle backdrop blur on overlays
- Semi-transparent backgrounds with blur
- Gradient borders on cards
- Glowing effects on active elements
- Subtle noise texture on dark backgrounds for depth

### Component-Specific Polish

**FestivalCard:**
- Image overlay gradient for text readability
- Smooth image zoom on hover
- Genre badges with subtle glow
- Shadow intensifies and card lifts on hover
- "View Details" overlay fades in on hover

**Buttons:**
- Solid: vibrant background, white text, shadow, hover scale + glow
- Ghost: border, transparent bg, hover fill with color
- Icon buttons: circular, hover scale + rotate

**Modals:**
- Smooth slide-up or fade-in animation
- Background blur with dark overlay
- Close button with hover effect
- Smooth scroll inside modal
- Stagger animation for content sections

**Filters:**
- Active filters highlighted with color
- Smooth checkbox/toggle animations
- Input fields with focus glow
- Clear button with hover effect

**Map:**
- Custom marker designs (not default pins)
- Popup has same dark theme styling
- Heat map with smooth gradient transitions
- Legend with beautiful styling

**Charts:**
- Bright colored lines/bars on dark background
- Smooth animation when chart appears
- Tooltips with dark theme
- Grid lines subtle but visible
- Data points highlighted on hover

### Mobile Design Excellence

**Touch-friendly:**
- Larger tap targets (min 44x44px)
- Swipeable where appropriate
- Bottom sheets for filters on mobile
- Sticky navigation that collapses on scroll

**Responsive refinements:**
- Single column layouts on mobile
- Larger text for readability
- Simplified navigation
- Modal takes full screen on mobile

## Component Details

### Header

Site-wide navigation that appears on every page.

**Should have:**
- Logo/site name "Festival Atlas" on the left
- Navigation links: Home, Map, Calendar, List
- Year indicator showing "2026 Festivals"
- Mobile: hamburger menu that expands to show links
- Sticky behavior - stays at top when scrolling
- Dark background with subtle transparency
- Active page link should be highlighted

### FestivalCard

Reusable card component for displaying festival preview information. **Should be clickable** to open the festival detail page/modal.

**Display elements:**
- Festival image (if available) or attractive gradient placeholder
- Festival name as heading (bright white)
- Location with city and country (with flag emoji or icon)
- Date range formatted nicely (e.g., "Jul 17-19, 2026")
- Genre badges (colorful pills)
- Price range
- Hover effect reveals "View Details" overlay or button

**Styling:**
- Card should have strong hover effect (lift, glow, and scale)
- Dark background with bright text for readability
- Rounded corners (16px minimum) - NO rectangular edges
- If using image, add gradient overlay to ensure text is readable
- Cursor pointer to indicate clickability

### FestivalDetail

Comprehensive festival information page or modal popup. Opens when clicking a festival card or map marker.

**Can be implemented as:**
- Modal/popup overlay (preferred for quick browsing)
- Dedicated page route (e.g., /festival/tomorrowland-2026)

**Display sections:**
1. **Hero Section:**
   - Large festival image or gradient background
   - Festival name (large, bright white)
   - Dates and location
   - Genre badges
   - Quick action buttons: "Buy Tickets", "Visit Website", "Instagram"

2. **Overview:**
   - Full description
   - Venue information
   - Festival size indicator

3. **Lineup** (if available):
   - List or grid of artists performing
   - Could be searchable/filterable by day

4. **Ticket Information:**
   - Price range details
   - Link to ticket purchase
   - Any special ticket types mentioned

5. **Reviews Summary** (if available):
   - AI-generated summary of reviews/social posts
   - Display as styled quote or card
   - Attribution to source if applicable

6. **Historical Data** (if available):
   - Chart showing attendance growth over years
   - Line or bar chart visualization
   - Notable acts from previous years
   - Year-over-year comparison

7. **Social Links:**
   - Official website button
   - Instagram button/link
   - Any other social platforms

**Styling:**
- Dark background with bright content
- All rounded corners (no rectangles)
- Colorful accents for CTAs and important elements
- Smooth animations when opening/closing
- Mobile responsive
- Easy close button (X in corner or ESC key)
- Background overlay with blur effect

### FilterBar

Dynamic filtering controls used on Map, Calendar, and List views.

**Filter options:**
- **Genre:** Checkboxes for EDM, Techno, Rock, Metal, Else, and "All" option
- **Country:** Dropdown or checkboxes for all countries in dataset
- **Lineup Search:** Text input to search for specific artists
  - Searches through lineup arrays
  - Shows festivals where the searched artist is performing
  - Real-time filtering as user types
  - Clear button to reset search
- **Sort (List view only):** Dropdown with Date, Name, Country options

**Behavior:**
- Updates visible festivals in real-time using client-side JavaScript
- Shows active filter count (e.g., "3 filters active")
- "Clear All Filters" button to reset everything
- Consider making filters shareable via URL parameters
- Lineup search should be prominent - maybe with search icon

**Layout:**
- Horizontal bar on desktop
- Collapsible/expandable panel on mobile
- Icon-based toggles for better UX
- Rounded corners on all inputs and buttons
- Bright text on dark background

### MapView

Interactive map component using Leaflet.js.

**Map setup:**
- Display OpenStreetMap tiles
- Custom marker icons for each genre with distinct colors:
  - EDM/Techno: Blue
  - Rock: Red  
  - Metal: Gray/Black
  - Else: Purple
- Use marker clustering for locations with multiple festivals
- Include a legend showing genre colors

**Marker popups:**
When clicking a marker, show popup with:
- Festival name
- Dates
- Location (city, country)
- Genre badges
- Link to official website

**Interactivity:**
- Respond to filter changes by showing/hiding markers
- Smooth animations when updating markers

### CalendarView

Monthly timeline showing festivals organized chronologically.

**Structure:**
- Loop through each month of 2026
- For each month, show header with month name and festival count
- Display all festivals starting in that month as cards
- Show in chronological order within each month

**Visual enhancements:**
- Progress indicator showing position in the year
- Highlight the current month differently
- Optional: quick navigation to jump to specific months
- Clear visual separation between months

### GenreBadge

Small pill-shaped badge for displaying genre tags.

**Genre colors:**
- EDM: Blue (#3B82F6)
- Techno: Cyan (#06B6D4)
- Rock: Red (#EF4444)
- Metal: Gray (#6B7280)
- Else: Purple (#8B5CF6)

**Styling:**
- Small, compact size
- Uppercase text
- Fully rounded pill shape (border-radius: 9999px)
- Color background with white text
- Subtle shadow or glow effect

### Historical Growth Chart

Chart component for visualizing festival growth over years (used in FestivalDetail page).

**Requirements:**
- Only show if festival has historicalData
- Display as line chart or bar chart showing attendance over years
- X-axis: Years (e.g., 2022, 2023, 2024, 2025, 2026)
- Y-axis: Attendance numbers
- Use chart library like Chart.js or Recharts
- Dark theme compatible - bright lines/bars on dark background
- Colorful chart elements matching the overall design
- Tooltip on hover showing exact numbers
- Optional: List notable acts for each year below the chart

**Styling:**
- Rounded container (16px corners)
- Dark background
- Bright colored chart lines/bars
- Grid lines should be subtle, not overwhelming
- Responsive - adjusts for mobile screens

## Design System

### Dark Theme Color Palette

**Critical Design Direction:**
- **Background must be DARK** - deep blacks and very dark grays
- **Text must be BRIGHT** - primarily white and light grays for readability
- **Accents should be COLORFUL** - vibrant colors for genres, CTAs, and highlights
- **NO rectangular corners** - everything should have rounded corners (borders, cards, buttons, inputs)

**Backgrounds:**
- Primary: Deep black (#0F0F0F or #121212)
- Secondary: Very dark gray (#1C1C1C)
- Cards/elevated surfaces: Slightly lighter dark (#252525)

**Text:**
- Primary: Bright white (#FFFFFF or #FAFAFA)
- Secondary: Light gray (#E0E0E0)
- Muted: Medium gray (#9CA3AF)

**Colorful Accents:**
- Primary CTA: Vibrant blue (#3B82F6)
- Secondary CTA: Vibrant purple (#A855F7)
- Success/positive: Green (#10B981)
- Warning: Orange (#F59E0B)

**Genre Colors (vibrant):**
- EDM: Bright blue (#3B82F6)
- Techno: Cyan (#06B6D4)
- Rock: Red (#EF4444)
- Metal: Silver/Gray (#9CA3AF)
- Else: Purple (#A855F7)

### Border Radius (NO rectangular corners)

- Small elements (badges, pills): 9999px (fully rounded)
- Buttons: 12px minimum
- Cards: 16px minimum
- Large containers: 20px minimum
- Images: 12px minimum

### Typography

Use modern system font stack (SF Pro, Segoe UI, or similar sans-serif).

**Heading Sizes:**
- H1: 2.5rem mobile, 3.5rem desktop - BRIGHT WHITE
- H2: 2rem mobile, 2.5rem desktop - BRIGHT WHITE
- H3: 1.5rem - WHITE
- Body: 1rem - Light gray for better reading
- Small text: 0.875rem - Medium gray

### Spacing & Layout

- Use consistent spacing scale (Tailwind's 4px increments work well)
- Card padding: 1.5rem-2rem
- Section gaps: 4-6rem between major sections
- Component margins: 1.5-2rem

### Component Styling Patterns

**Cards:**
- Rounded corners (16px minimum)
- Subtle shadow with slight glow on hover
- Smooth hover animations (lift + glow effect)
- Dark background with bright text

**Buttons:**
- Fully rounded edges (12px minimum)
- Vibrant colors for primary actions
- Ghost/outline variants for secondary
- Smooth transitions with scale effect on hover

**Form Inputs:**
- Dark background with bright border
- Rounded corners (12px)
- Focus glow effect (colorful ring)
- Bright text input

**General:**
- Generous white space
- Clear visual hierarchy using bright vs. muted text
- Smooth transitions and animations throughout
- Colorful accents to break up dark monotony

## Interactive Features

### Client-Side Filtering

The filtering system should work entirely in the browser without page reloads.

**Requirements:**
- Filter festivals by selected genres (can select multiple)
- Filter festivals by selected countries (can select multiple)
- **Filter festivals by lineup** - search for artist names
- Combine filters (e.g., show only EDM festivals in Germany featuring "Martin Garrix")
- Update displayed festivals instantly when filters change
- Show count of filtered results
- Clear all filters with one click

### Sorting

Allow users to sort festivals by:
- Date (chronological order, earliest first)
- Name (alphabetical A-Z)
- Country (alphabetical by country name)

### Map Interactions

The map should be fully interactive:
- Pan and zoom freely
- Click markers to **open festival detail modal/page** (not just popup)
- Filter markers based on active filters
- Smooth animations when showing/hiding markers
- Cluster markers that are close together for cleaner view
- **Heat Map Toggle:**
  - Button to switch between normal marker view and heat map
  - Heat map uses Leaflet heat map plugin
  - Shows density of festivals across regions
  - Intensity based on number of festivals in area
  - Color gradient from cool (blue/green) to hot (yellow/red)

### View Switching

**List page only:**
- Toggle between Grid View (cards) and Table View (spreadsheet)
- Smooth transition animation when switching
- Preserve filters and sort when switching views
- Button or toggle switch clearly labeled

### Festival Detail Modal/Page

- Click any festival card to open detailed view
- Click map marker to open detailed view
- Modal should have:
  - Smooth open/close animations
  - Blurred background overlay
  - Close button (X) and ESC key support
  - Scrollable content if needed
- Or navigate to dedicated page route
- Display all festival information including lineup, reviews, historical data

## Performance & Design Philosophy

### Design First, Performance Second

This is a small dataset (dozens of festivals, not thousands). Performance optimization is not the primary concern - **beautiful, polished design is the priority**.

**Focus on:**
- Stunning visual design and polish
- Smooth, delightful animations and transitions
- Rich hover effects and micro-interactions
- Beautiful typography and spacing
- Eye-catching color usage
- Professional-grade UI components

**Don't worry about:**
- Aggressive code splitting
- Image lazy loading optimizations (just use good-quality images)
- Minimal bundle sizes (it's fine to include nice animations/effects libraries)
- Over-optimizing static generation

### SEO Requirements

Basic SEO is still important:
- Proper title tags and meta descriptions per page
- Open Graph tags for social sharing
- Semantic HTML structure
- Mobile-friendly viewport meta tag

### UI Component Libraries for Astro

**The Challenge:** Astro doesn't have rich component libraries like React does (shadcn/ui, Radix, MUI, etc.)

**The Solution:** Astro can use React components via "islands" architecture!

For interactive components that need beautiful pre-built UI:
1. **Install React in Astro:** `npx astro add react`
2. **Use React component libraries** for interactive elements

**Recommended: shadcn/ui**
- Beautiful, customizable components built on Radix UI
- Perfect dark mode support out of the box
- Works seamlessly with Tailwind
- Copy/paste components directly into your project
- Highly customizable to match Festival Atlas aesthetic

**Setup shadcn/ui in Astro:**
- Install dependencies: `npx shadcn-ui@latest init`
- Configure for Astro project structure
- Components to use:
  - `Dialog` - for Festival Detail modal
  - `Select`, `Checkbox`, `Input` - for FilterBar
  - `Toggle Group` - for view switching (grid/table)
  - `Button` - for all CTAs
  - `Badge` - could enhance genre badges
  - `Card` - could be base for FestivalCard
  - `Separator` - for visual dividers
  - `Tooltip` - for helpful hints

**Alternative libraries:**
- **Radix UI** - Unstyled primitives (more work to style)
- **Headless UI** - Tailwind's official components
- **React Aria** - Adobe's accessible components

**Implementation approach:**
- Static content: Pure Astro components (Header, Footer, simple layouts)
- Interactive UI: React islands with shadcn/ui
  - `FilterBar.tsx` (React with shadcn Select, Checkbox, Input)
  - `FestivalDetail.tsx` (React with shadcn Dialog)
  - `ViewToggle.tsx` (React with shadcn Toggle Group)
  - `MapView.tsx` (React with Leaflet)

**In Astro pages, use islands like this:**
```
---
import FilterBar from '../components/FilterBar.tsx';
---

<FilterBar client:load festivals={festivals} />
```

This gives you:
✅ Beautiful, professional UI components
✅ Accessible, well-tested interactive elements
✅ Dark mode support built-in
✅ Easy customization with Tailwind
✅ Still get Astro's performance benefits for static content
✅ Consistent design language across all interactive elements

### Additional Design Libraries to Consider

**Animation libraries:**
- Framer Motion (React) - For smooth page transitions and micro-interactions
- GSAP - For advanced animations
- Auto Animate - Simple, automatic animations

**Icon libraries:**
- Lucide Icons - Beautiful, consistent icon set (works with shadcn/ui)
- Heroicons - Tailwind's icon library

**Chart libraries:**
- Recharts - Beautiful, composable charts (React)
- Chart.js - Simple, flexible charting

**Utility libraries:**
- date-fns - Date formatting
- clsx - Conditional className handling

The goal: Make it look like a premium, professionally-designed web app, not a basic static site.

## Deployment

The site should be built as a static site that can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

- Build outputs a dist/ folder with static HTML, CSS, JS files
- No environment variables needed
- No API keys required
- Fully self-contained site

## Data Updates

When festival data needs to be updated:
1. Edit the festivals.json file
2. Rebuild the site
3. Redeploy

The static generation approach means the site is blazingly fast but requires a rebuild for data changes (which is fine for festival data that doesn't change frequently).

## Success Criteria

The finished site should achieve:

**Design Quality (Primary Focus):**
- Looks professional and premium - could be mistaken for a paid product
- Consistent dark theme with vibrant accents throughout
- Smooth, delightful animations and transitions everywhere
- No sharp corners - everything rounded beautifully
- Clear visual hierarchy with bright headings on dark background
- Engaging hover states and micro-interactions
- Mobile experience is just as polished as desktop

**Functionality:**
- All filters work smoothly
- Map interactions are responsive
- Modal/detail pages open smoothly
- View toggles work seamlessly
- Lineup search is instant
- Calendar only shows relevant months

**Technical:**
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Fully mobile-responsive
- No console errors
- Accessible (keyboard navigation, screen reader friendly)

**User Experience:**
- Intuitive navigation
- Fast enough (page loads in reasonable time - doesn't need to be blazing fast)
- Information is easy to find
- Detail pages are comprehensive and beautiful

**Priority order:** Beautiful design > Smooth interactions > Functionality > Performance

---

## Final Notes

**Primary Goal:** Build a BEAUTIFUL festival discovery website that looks professional and premium. 

**Key Requirements:**
- Deep dark backgrounds with bright, readable text
- Vibrant, colorful accents and genre colors
- NO rectangular corners anywhere - everything rounded
- Rich animations and micro-interactions using Framer Motion
- Professional UI components using shadcn/ui with React islands
- Smooth, polished user experience
- Comprehensive festival detail pages/modals
- Heat map, lineup search, historical charts
- Table + grid view toggle
- Only show months with festivals in calendar

**Tech Approach:**
- Astro for static content and overall structure
- React islands for interactive components (filters, modals, maps, charts)
- shadcn/ui for beautiful, pre-built UI components
- Tailwind CSS for styling
- Framer Motion for animations
- Recharts for data visualization

**Design Inspiration:**
Think Spotify, Apple Music, Stripe, or Linear - modern, dark, polished, with great typography and smooth interactions.

This specification provides the complete vision for Festival Atlas. Prioritize beauty and polish over everything else.
