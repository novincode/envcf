# 🌥️ EnvCF

> **Beautiful CLI tool to push environment variables to Cloudflare Pages/Workers**

[![npm version](https://badge.fury.io/js/envcf.svg)](https://badge.fury.io/js/envcf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

EnvCF is a modern, user-friendly CLI tool that makes it super easy to sync your environment variables from `.env` files to Cloudflare Pages or Workers. No more manual copying and pasting!

## ✨ Features

- 🔍 **Auto-discovery** - Automatically finds your `wrangler.toml` or `wrangler.jsonc` configuration
- 📁 **Multiple file support** - Handle `.env`, `.env.local`, `.env.production`, etc.
- 🎯 **Environment targeting** - Deploy to production or preview environments
- 🎨 **Beautiful interface** - Interactive prompts with colors and emojis
- 🔒 **Type-safe** - Built with TypeScript for reliability
- 🏃‍♂️ **Dry run mode** - Preview changes before applying them
- ⚡ **Fast & lightweight** - Minimal dependencies, maximum performance

## 🚀 Installation

### Global Installation (Recommended)

```bash
npm install -g envcf
# or
pnpm add -g envcf
# or
yarn global add envcf
```

### Use without installing

```bash
npx envcf
```

## 📖 Usage

### Basic Usage

Navigate to your project directory and run:

```bash
envcf
```

The CLI will guide you through:

1. 🔍 **Finding your wrangler config** - Automatically detects `wrangler.toml` or `wrangler.jsonc`
2. 🎯 **Choosing environment** - Select between production and preview
3. 📁 **Selecting env files** - Pick which `.env` files to use
4. ✅ **Confirmation** - Review variables before pushing
5. 🚀 **Deployment** - Push variables to Cloudflare

### Advanced Options

```bash
# Dry run - see what would happen without making changes
envcf --dry-run

# Use custom env file
envcf --file .env.custom

# Use custom wrangler config
envcf --config wrangler.custom.toml

# Show help
envcf --help
```

## 🏗️ Prerequisites

1. **Wrangler CLI** installed and authenticated:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Project structure** with either:
   - `wrangler.toml` file
   - `wrangler.jsonc` file

3. **Environment files** like:
   - `.env`
   - `.env.local`
   - `.env.production`
   - `.env.preview`

## 📝 Example Workflow

```bash
$ envcf

🌥️  EnvCF - Environment Variables to Cloudflare

🔍 Looking for wrangler configuration...
✅ Found config: wrangler.toml
📦 Project: my-awesome-app

? Which environment do you want to deploy to? 
❯ 🚀 Production
  🧪 Preview

🔍 Looking for environment files...
? Which environment files do you want to use? 
❯ ☑ 📄 .env
  ☑ 📄 .env.local
  ☐ 📁 All files

📝 Parsing environment variables...
✅ Found 12 environment variables

📋 Environment variables to be pushed:
  • DATABASE_URL (from .env)
  • API_KEY (from .env)
  • SECRET_TOKEN (from .env.local)
  ...

? Push these 12 variables to production? Yes

🚀 Pushing to Cloudflare...
🔑 Authenticated with Cloudflare
  ✅ DATABASE_URL
  ✅ API_KEY
  ✅ SECRET_TOKEN
  ...

📊 Results:
  ✅ Success: 12

✨ All environment variables pushed successfully!
```

## 🔧 Configuration

### Wrangler Configuration

EnvCF works with standard Wrangler configuration files:

**wrangler.toml:**
```toml
name = "my-app"
compatibility_date = "2023-12-01"

[env.preview]
# Preview environment config

[env.production]
# Production environment config
```

**wrangler.jsonc:**
```json
{
  "name": "my-app",
  "compatibility_date": "2023-12-01",
  "env": {
    "preview": {},
    "production": {}
  }
}
```

### Environment Files

Standard `.env` file format:

```bash
# Database
DATABASE_URL=postgresql://localhost:5432/mydb
DATABASE_POOL_SIZE=10

# API Keys
STRIPE_SECRET_KEY=sk_test_...
SENDGRID_API_KEY=SG....

# Feature Flags
ENABLE_ANALYTICS=true
DEBUG_MODE=false
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [Shayan Moradi](https://github.com/your-username)

## 🙏 Acknowledgments

- Built with ❤️ using TypeScript
- Powered by [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- Made beautiful with [Chalk](https://github.com/chalk/chalk) and [Inquirer](https://github.com/SBoudrias/Inquirer.js)

---

**Happy deploying! 🚀**
