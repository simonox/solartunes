#!/bin/bash

# Complete SolarTunes Project Rebuild
# Rebuilds the entire project from scratch

echo "🔄 Complete SolarTunes Project Rebuild"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

PROJECT_DIR="$HOME/solartunes"
cd "$PROJECT_DIR" || { echo "Cannot find project directory"; exit 1; }

print_status "Stopping SolarTunes service..."
sudo systemctl stop solartunes 2>/dev/null || true

print_status "Cleaning old build artifacts..."
rm -rf node_modules .next package-lock.json pnpm-lock.yaml

print_status "Creating fresh package.json..."
cat > package.json << 'EOL'
{
  "name": "solartunes",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.294.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "eslint": "^8",
    "eslint-config-next": "14.0.0"
  }
}
EOL

print_status "Creating next.config.js..."
cat > next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: []
  }
}

module.exports = nextConfig
EOL

print_status "Creating tailwind.config.js..."
cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
EOL

print_status "Creating postcss.config.js..."
cat > postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

print_status "Creating tsconfig.json..."
cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOL

print_status "Installing dependencies..."
if command -v pnpm >/dev/null 2>&1; then
    print_status "Using pnpm..."
    pnpm install
elif [ -x "$HOME/.local/share/pnpm/pnpm" ]; then
    print_status "Using local pnpm..."
    $HOME/.local/share/pnpm/pnpm install
elif command -v npm >/dev/null 2>&1; then
    print_status "Using npm..."
    npm install
else
    print_error "No package manager found!"
    exit 1
fi

print_status "Building the project..."
if command -v pnpm >/dev/null 2>&1; then
    pnpm build
elif [ -x "$HOME/.local/share/pnpm/pnpm" ]; then
    $HOME/.local/share/pnpm/pnpm build
elif command -v npm >/dev/null 2>&1; then
    npm run build
fi

print_status "Setting correct permissions..."
chown -R $USER:$USER .

print_status "Testing manual start..."
echo "Starting test (will timeout after 10 seconds)..."

if command -v pnpm >/dev/null 2>&1; then
    timeout 10s pnpm start &
elif [ -x "$HOME/.local/share/pnpm/pnpm" ]; then
    timeout 10s $HOME/.local/share/pnpm/pnpm start &
elif command -v npm >/dev/null 2>&1; then
    timeout 10s npm start &
fi

TEST_PID=$!
sleep 5

if kill -0 $TEST_PID 2>/dev/null; then
    print_status "✅ Manual start test successful!"
    kill $TEST_PID 2>/dev/null
else
    print_warning "Manual start test failed or exited early"
fi

print_status "Starting SolarTunes service..."
sudo systemctl start solartunes

sleep 5

if systemctl is-active --quiet solartunes; then
    print_status "✅ Service started successfully!"
    echo ""
    echo "🌐 Access SolarTunes at: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'localhost'):3000"
else
    print_error "❌ Service failed to start"
    echo ""
    echo "📋 Recent logs:"
    sudo journalctl -u solartunes -n 20 --no-pager
fi

print_status "Rebuild complete!"
