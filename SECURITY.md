# Security Policy

## Supported Versions

We actively support the following versions of SolarTunes with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of SolarTunes seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do Not** Create a Public Issue

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

### 2. Report Privately

Send your vulnerability report to: **security@solartunes.dev** (or create a private security advisory on GitHub)

Include the following information:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if you have one)
- Your contact information

### 3. Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies based on severity (see below)

## Vulnerability Severity Levels

### Critical (Fix within 24-48 hours)
- Remote code execution
- Authentication bypass
- Data exposure of sensitive information

### High (Fix within 1 week)
- Privilege escalation
- SQL injection
- Cross-site scripting (XSS)

### Medium (Fix within 2 weeks)
- Information disclosure
- Denial of service
- CSRF vulnerabilities

### Low (Fix within 1 month)
- Minor information leaks
- Non-exploitable bugs with security implications

## Security Considerations for Raspberry Pi Deployment

### Network Security
- **Default Configuration**: SolarTunes runs on port 3000 by default
- **Recommendation**: Use a firewall to restrict access to trusted networks only
- **Access Point Mode**: When using the built-in access point feature, change default passwords

### File System Security
- **Music Directory**: Ensure proper permissions on `~/Music` directory
- **Upload Feature**: File uploads are restricted to WAV files and processed through ffmpeg
- **Script Execution**: Setup scripts require sudo privileges - review before running

### Audio System Security
- **ALSA Access**: The application requires access to audio devices
- **Process Management**: Audio processes are managed through system commands
- **GPIO Access**: Motion detection requires GPIO access (if using PIR sensors)

### System Integration
- **Systemd Service**: Runs as a non-root user by default
- **Log Files**: System logs may contain sensitive information
- **Auto-start**: Service auto-starts on boot - ensure physical security of device

## Security Best Practices

### For Users
1. **Keep Updated**: Regularly update SolarTunes and system packages
2. **Network Isolation**: Run on isolated network when possible
3. **Strong Passwords**: Use strong passwords for any authentication
4. **Physical Security**: Secure physical access to Raspberry Pi
5. **Regular Backups**: Backup configuration and music files

### For Developers
1. **Input Validation**: All user inputs are validated and sanitized
2. **File Upload Security**: Strict file type checking and processing
3. **Command Injection Prevention**: System commands use parameterized execution
4. **Dependency Management**: Regular security audits of dependencies
5. **Minimal Privileges**: Application runs with minimal required privileges

## Known Security Considerations

### Audio File Processing
- **ffmpeg Usage**: Audio files are processed through ffmpeg for format conversion
- **File Validation**: Only WAV files are accepted for upload
- **Temporary Files**: Temporary files are cleaned up after processing

### Motion Detection
- **GPIO Access**: Requires GPIO access for PIR sensor functionality
- **API Endpoints**: Motion detection API endpoints are accessible without authentication
- **Process Management**: Motion detection runs as a separate service

### System Commands
- **Audio Control**: Uses system commands (aplay, amixer) for audio functionality
- **Process Management**: Uses system commands for process control
- **Log Access**: Accesses system logs through journalctl

## Disclosure Policy

When we receive a security vulnerability report:

1. **Acknowledgment**: We'll acknowledge receipt within 48 hours
2. **Investigation**: We'll investigate and validate the vulnerability
3. **Fix Development**: We'll develop and test a fix
4. **Coordinated Disclosure**: We'll work with you on disclosure timing
5. **Credit**: We'll credit you in our security advisory (if desired)
6. **Public Disclosure**: After fix is released, we'll publish a security advisory

## Security Updates

Security updates will be:
- Released as patch versions (e.g., 1.0.1, 1.0.2)
- Documented in release notes with severity level
- Announced through GitHub releases and security advisories
- Backported to supported versions when possible

## Contact

For security-related questions or concerns:
- **Email**: security@solartunes.dev
- **GitHub**: Create a private security advisory
- **General Issues**: Use GitHub issues for non-security bugs

## Acknowledgments

We appreciate the security research community and will acknowledge researchers who responsibly disclose vulnerabilities to us.

---

**Note**: This security policy applies to the SolarTunes application. For Raspberry Pi OS security, please refer to the official Raspberry Pi security documentation.
\`\`\`

```shellscript file="scripts/deploy-project.sh"
#!/bin/bash

# SolarTunes Project Deployment Script
# This script deploys the Next.js project to the Raspberry Pi

set -e

echo "🚀 SolarTunes Project Deployment"
echo "================================"

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

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory $PROJECT_DIR does not exist. Please run setup-raspberry-pi.sh first."
    exit 1
fi

cd "$PROJECT_DIR"

print_status "Deploying SolarTunes project..."

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    print_status "Creating package.json..."
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
fi

# Create next.config.js if it doesn't exist
if [ ! -f "next.config.js" ]; then
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
fi

# Create tailwind.config.js if it doesn't exist
if [ ! -f "tailwind.config.js" ]; then
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
fi

# Install dependencies
print_status "Installing dependencies..."
pnpm install

# Build the project
print_status "Building the project..."
pnpm build

print_status "Project deployed successfully!"
print_status "You can now start the service with: sudo systemctl start solartunes"
