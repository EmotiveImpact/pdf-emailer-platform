# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f4faa513-b9b8-40e4-8829-4fbab8ad5f03

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f4faa513-b9b8-40e4-8829-4fbab8ad5f03) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- PDF.js (for PDF processing)
- pdf-lib (for PDF manipulation)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f4faa513-b9b8-40e4-8829-4fbab8ad5f03) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## PDF.js Worker Configuration

This project uses PDF.js for PDF processing. The PDF.js worker is automatically copied to the public directory during the build process to ensure proper functionality.

## New Water Systems Business Tools Platform

This application is a comprehensive business tools platform for New Water Systems with personalized features for Lisa including:

### Available Tools:
- **PDF Splitter**: Split multi-page PDF bill statements by customer account
- **Email Distribution**: Send personalized emails with PDF attachments (Coming Soon)

### Platform Features:
- Multi-tool navigation and dashboard
- Integrated workflow between tools
- Browser-optimized downloads
- Comprehensive PDF processing capabilities

### Troubleshooting PDF.js Issues

If you encounter "No GlobalWorkerOptions.workerSrc specified" errors:

1. The worker file should be automatically copied during `npm install` (postinstall script)
2. You can manually copy it by running: `npm run copy-pdf-worker`
3. The worker file should be available at `/public/pdf.worker.min.js`

### Manual Worker Setup

If needed, you can manually copy the worker:

```sh
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.js
```
