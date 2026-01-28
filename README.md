# Click or Bang: 3D Revolver Simulator

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Three.js](https://img.shields.io/badge/Three.js-r160+-black?logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

A photorealistic, fully interactive 3D .357 Magnum revolver simulator running entirely in the browser. 

**Key Highlight:** This project uses **Zero External Assets**. No `.obj`, `.glb`, or texture files were loaded. Every component—from the rifled barrel to the brass cartridges—is procedurally generated using React Three Fiber primitives, and all sound effects are synthesized in real-time using the Web Audio API.

## 🌟 Features

*   **Procedural Geometry:** 100% code-generated 3D models. Lightweight and instant loading.
*   **Physics-Based Recoil:** Implements a mass-spring-damper system to simulate realistic muzzle climb and kick.
*   **Russian Roulette Mode:** Test your luck by loading a single round into a random chamber and spinning the cylinder.
*   **Procedural Audio:** Gunshots, mechanical clicks, and reload sounds are synthesized on the fly (no audio files).
*   **Detailed Simulation:** Accurate cylinder rotation, hammer action, and shell casing extraction logic.
*   **PBR Materials:** Realistic steel, wood, and brass textures created via material properties.

## 🛠 Tech Stack

*   **Core:** [React 19](https://react.dev/)
*   **3D Engine:** [Three.js](https://threejs.org/)
*   **Renderer:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
*   **Helpers:** [Drei](https://github.com/pmndrs/drei) (Camera, Environment, Shapes)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)

## 🎮 Controls

| Key | Action | Description |
| :--- | :--- | :--- |
| **SPACE** | **Fire** | Pull the trigger. Will click if empty, bang if loaded. |
| **R** | **Reload** | Opens cylinder, ejects spent rounds, and loads fresh ammo. |
| **F** | **Inspect** | Toggles the cylinder open/closed for inspection. |
| **Mouse** | **Rotate** | Click and drag to rotate the gun in 3D space. |

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/click-or-bang.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd click-or-bang
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

## 📖 Development Journey

### Inspiration
The inspiration came from a fascination with the mechanical precision of firearms and the high-fidelity "inspection animations" found in AAA first-person shooters. We wanted to capture the visceral, tactile satisfaction of a Colt Python .357—the heavy click of the cylinder, the snap of the crane, and the violent kick of the recoil—but we wanted to bring this experience entirely to the web browser.

### Challenges & Solutions
1.  **Geometric Composition:** Creating organic shapes (like the curved grip) using only basic geometric primitives was a puzzle. We layered multiple `RoundedBox` geometries to approximate machined steel and wood.
2.  **The "React vs. Loop" Conflict:** Synchronizing React state (declarative) with the Three.js animation loop (imperative) required careful management of `useFrame` and `useRef` to ensure the recoil physics ran smoothly at 60fps without triggering React re-renders.
3.  **Synthesized Audio:** Instead of using mp3 files, we used the Web Audio API to create oscillators and noise buffers, shaping them with gain nodes to sound like mechanical clicks and explosions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
