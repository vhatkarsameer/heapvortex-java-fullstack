A Java Full Stack application for real-time JVM heap memory visualization and memory leak analysis using JMX, Eclipse MAT, Spring Boot, React, and Three.js.


# Heap Vortex Visualizer

## Overview

Heap Vortex Visualizer is a React and Three.js based application that provides a 3D visualization of heap memory objects and their relationships. It represents each heap object as a sphere and connects related objects with lines, making memory structures easier to understand.

This project demonstrates the integration of React, TypeScript, and Three.js for creating interactive 3D visualizations.

---

## Features

- 3D visualization of heap memory objects
- Circular arrangement of object nodes
- Dynamic node size based on retained memory size
- Random color generation for better visualization
- Object relationships represented using connecting lines
- Smooth scene rotation animation
- Responsive window resizing
- Object details panel

---

## Technologies Used

- React.js
- TypeScript
- Three.js
- HTML5
- CSS3

---

## Project Structure

```
src/
└── components/
    └── HeapVortexVisualizer.tsx
```

---

## Overall Flow

User Opens Website
        │
        ▼
Landing Page Opens
        │
        ▼
Views Available Projects
        │
        ▼
Clicks Launch HeapVortex
        │
        ▼
HeapVortex Visualization Opens

---

## How It Works

### Scene Initialization
- Creates a Three.js scene.
- Sets a dark background.
- Configures the camera and renderer.

### Object Visualization
- Creates one sphere for each heap object.
- Node size depends on retained memory size.
- Nodes are arranged in a circular layout.

### Relationship Mapping
- Connects related objects using lines.
- Uses object references to draw edges.

### Lighting
- Ambient Light
- Directional Light

### Animation
- Continuously rotates the scene.
- Renders every frame using requestAnimationFrame().

### Responsive Design
- Automatically adjusts the renderer when the browser window is resized.

---

## Future Enhancements

- Mouse click object selection
- Zoom and pan controls
- Search functionality
- Tooltip support
- Real-time heap monitoring
- Memory leak detection

---

## Learning Outcomes

Through this project, I have learned:

- React Functional Components
- React Hooks
- TypeScript Interfaces
- Three.js Scene Management
- 3D Graphics Rendering
- Data Visualization
- Responsive UI Development

---

## app and landing pages


# App.tsx

## Overview
`App.tsx` is the main entry point of the HeapVortex React application. It initializes the application's global providers, handles routing, manages themes, displays notifications, and ensures graceful error handling throughout the application.

---

## Features

- Global Error Boundary for runtime error handling
- Dark theme support using ThemeProvider
- Tooltip support across the application
- Toast notification system
- Client-side routing using Wouter
- Custom 404 Not Found page

---

## Routing Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LandingPage` | Displays the application's landing page. |
| `/heapvortex` | `HeapVortexPage` | Opens the Heap Vortex visualization interface. |
| `/404` | `NotFound` | Displays a custom 404 error page. |
| `*` | `NotFound` | Handles all undefined routes. |

---

## Components Used

### ErrorBoundary
Wraps the entire application and catches unexpected runtime errors, preventing the application from crashing.

### ThemeProvider
Provides global theme management and initializes the application in **Dark Mode** by default.

### TooltipProvider
Enables tooltip functionality for UI components throughout the application.

### Toaster
Displays toast notifications such as success messages, warnings, and errors.

### Router
Handles navigation between different pages using the Wouter routing library.

---

## Application Flow

1. The application starts by rendering the `App` component.
2. `ErrorBoundary` wraps the application for error protection.
3. `ThemeProvider` initializes the global dark theme.
4. `TooltipProvider` enables tooltip functionality.
5. `Toaster` prepares the notification system.
6. `Router` determines which page to display based on the current URL.
7. If no matching route exists, the user is redirected to the **NotFound** page.

---

## Technologies Used

- React
- TypeScript
- Wouter
- Tailwind CSS
- Shadcn UI Components
- Context API

---

## Purpose

The `App.tsx` file serves as the central configuration file of the HeapVortex application. It integrates routing, theme management, notifications, tooltips, and error handling into a single entry point, providing a structured and maintainable application architecture.

---

# LandingPage.tsx

## Overview
`LandingPage.tsx` is the main dashboard of the HeapVortex application. It serves as the application's home page, displaying available engineering projects through an interactive user interface. The page includes a collapsible sidebar, project cards, and seamless navigation using Wouter.

---

## Features

- Responsive landing page layout
- Collapsible navigation sidebar
- Project dashboard with interactive cards
- Client-side navigation using Wouter
- Modern gradient-based UI
- Hover animations and transition effects
- Tailwind CSS responsive design

---

## Main Components

### Sidebar
The sidebar provides quick access to all available projects.

Features:
- Expand and collapse functionality
- Displays project icon, name, and description
- Highlights the currently selected project
- Smooth transition animations

---

### Project Cards

Each project card displays:

- Project Icon
- Project Name
- Short Description
- Detailed Overview
- Feature Highlights
- Launch Button

The cards include gradient backgrounds, hover effects, and responsive layouts for improved user experience.

---

## Project Information

The landing page currently includes the following project:

| Project | Description | Route |
|----------|-------------|-------|
| HeapVortex | 3D JVM Memory Leak Profiler | `/heapvortex` |

---

## Navigation

Navigation is handled using the **Wouter** library.

| Route | Action |
|--------|--------|
| `/` | Displays Landing Page |
| `/heapvortex` | Opens HeapVortex visualization |

The **Launch HeapVortex** button redirects users directly to the HeapVortex visualization page.

---

## State Management

The component uses React Hooks for state management.

### useState()

Used for:

- Managing sidebar visibility
- Expanding and collapsing the navigation menu

### useLocation()

Used for:

- Detecting the current route
- Navigating between application pages

---

## User Interface

The page contains the following sections:

### Header

Displays:

- Engineering Demo Platform title
- Application subtitle describing the platform

---

### Sidebar

Contains:

- Project navigation menu
- Expand/Collapse button
- Platform description footer

---

### Projects Grid

Displays project cards with:

- Gradient backgrounds
- Interactive hover animations
- Feature list
- Launch button

---

### Footer

Displays a short description of the platform:

- Advanced Full-Stack Java Engineering
- Real-time Visualization
- Modern User Experience

---

## Technologies Used

- React
- TypeScript
- Wouter
- Tailwind CSS
- Shadcn UI
- Lucide React Icons

---

## Purpose

The `LandingPage.tsx` component acts as the central dashboard of the HeapVortex platform. It provides users with an intuitive interface to explore engineering projects, navigate between application modules, and launch the HeapVortex visualization environment through a clean, responsive, and modern design.

