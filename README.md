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

## Installation

Clone the repository

```bash
git clone https://github.com/your-username/Heap-Vortex-Visualizer.git
```

Go to the project folder

```bash
cd Heap-Vortex-Visualizer
```

Install dependencies

```bash
npm install
```

Run the application

```bash
npm run dev
```

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

Through this project, I learned:

- React Functional Components
- React Hooks
- TypeScript Interfaces
- Three.js Scene Management
- 3D Graphics Rendering
- Data Visualization
- Responsive UI Development

---

