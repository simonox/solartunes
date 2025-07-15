# Copilot Coding Guidelines

**Project:** Next.js Web Application
**Project:** SolarTunes - A sustainable sound player for Raspberry Pi

## Purpose

This file provides clear guidance for contributors and GitHub Copilot to:
- Align generated code with project conventions.
- Follow architectural patterns.
- Maintain readability, performance, and testability.
- Align generated code with the SolarTunes project conventions.
- Follow architectural patterns specific to a Next.js application controlling Raspberry Pi hardware.
- Maintain readability, performance, and stability on a resource-constrained device.

---

## Coding Style
## Coding Style & Languages

- Use **TypeScript** (`.ts`/`.tsx`) for all components and modules.
- Prefer **functional components** and hooks over class components.
- Use Prettier and ESLint as defined in `.prettierrc` and `.eslintrc`.
- Name files and components in PascalCase; hooks and utility functions in camelCase.
- **Languages**: The project uses **TypeScript** (`.ts`/`.tsx`) for the web application, **Bash** for setup and management, and **Python** for GPIO-based hardware interaction.
- **Web App**: Use **TypeScript** with functional components and hooks.
- **Package Manager**: Use **PNPM** for managing Node.js dependencies.
- **Formatting**: Adhere to Prettier and ESLint as defined in project configuration files.
- **Naming**: Name React components in PascalCase; hooks and utility functions in camelCase. Shell scripts should use `snake_case` for variables and be well-commented.

## Directory Structure & Routing

- Use the **App Router** (`/app` directory) for all pages and routes (Next.js 13+).
- Place shared components in `/components`.
- Use `/lib` for utilities and helper functions.
- Use `/styles` for global and module-specific styles (prefer CSS modules or Tailwind CSS).
- **Scripts**: The `/scripts` directory contains essential **Bash** and **Python** scripts for setup, service management, and hardware interaction. API routes may call these scripts.

## Data Fetching & State

- Use **Server Components** for server-side logic and **Client Components** for interactive features.
- Prefer `fetch`, `getServerSideProps`, or `getStaticProps` for data loading, as appropriate.
- Use React Query or SWR for client-side data fetching and caching.
- Prefer Context API or Redux Toolkit for global state management when necessary.
- **Client-Side State**: Use React hooks (`useState`, `useEffect`, `useContext`) for managing component state. The project does not use complex state management libraries like Redux or React Query.
- **API Communication**: The frontend communicates with the backend exclusively through the API routes defined in `/app/api`. Data is fetched using standard `fetch` calls.

## Backend & Hardware Interaction

This is a critical aspect of the SolarTunes project.

- **API Routes as a Bridge**: API routes in `/app/api` are the primary interface between the web UI and the Raspberry Pi's system-level functions.
- **Executing Shell Commands**: The backend frequently uses Node.js's `child_process` module (specifically `exec` or `execAsync`) to run shell commands for:
    - **Audio Control**: `aplay` (playback), `amixer` (volume).
    - **System Information**: `vcgencmd` (temperature), `df` (disk usage).
    - **Filesystem Management**: `mount` for SD card protection.
- **Python for GPIO**: Hardware interaction via GPIO pins (like the PIR motion sensor) is handled by Python scripts (e.g., `motion-detector.py`). These are typically run as background services managed by `systemd`.
- **Configuration Files**: Persistent configuration (e.g., `autoplay.conf`, `webhook.conf`) is stored in JSON format in the `~/Music` directory, not in a database. API routes are responsible for reading and writing these files.

## Styling

- Use **Tailwind CSS** for utility-first styling, or CSS Modules for scoped styles.
- For global styles, use `/styles/globals.css`.
- Use semantic HTML and ensure accessibility (ARIA labels, etc.).


## Additional Notes

- Add JSDoc comments to exported functions and complex components.
- Optimize images using Next.js `<Image />` component.
- Always check and fix TypeScript errors before committing.
- Review PRs for performance, accessibility, and SEO best practices.
- **JSDoc**: Add JSDoc comments to all exported functions, complex components, and API routes to explain their purpose, parameters, and return values.
- **Resource Constraints**: Always be mindful that the code runs on a Raspberry Pi. Optimize for low memory and CPU usage. Avoid unnecessary polling or heavy computations.
- **Error Handling**: Implement robust error handling, especially for shell command execution and file system operations. Provide clear feedback to the user through the UI.
- **Security**: Be extremely cautious with shell command execution. Sanitize and validate all user inputs that are used to construct commands to prevent command injection vulnerabilities, as noted in `SECURITY.md`. Use libraries like `shell-quote` where appropriate.
