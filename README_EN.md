# HAJIMI Bookmark Manager (CNB & GitHub Edition)

HAJIMI is a local-first bookmark management tool that utilizes your personal Git repository as a backend. It synchronizes your data via CNB (Tencent Cloud Native) or GitHub APIs.

## I. Introduction

This application is designed to address concerns regarding data privacy and the limitations of third-party cloud services. By treating your Git repository as a database, all your bookmarks are stored as a structured JSON file under your complete control.

## II. Key Features

1. **Data Sovereignty**: Your bookmarks live in your repository as a `bookmarks.json` file.
2. **Flexible Sync**: Native support for both CNB (optimized for China) and GitHub.
3. **Privacy Focused**: Access tokens are stored exclusively in the browser's local storage.
4. **Offline Capability**: The local-first architecture ensures instant search and access even without an internet connection.
5. **Easy Migration**: Import existing data from standard browser HTML exports or HAJIMI JSON backups.

## III. Getting Started

1. **Create a Repository**: Set up a new repository (e.g., `bookmarks`) on [GitHub](https://github.com) or [CNB](https://cnb.cool).
2. **Generate Access Token**:
   - For **GitHub**: Go to Settings -> Developer settings -> Personal access tokens (repo scope).
   - For **CNB**: Go to Settings -> Access Tokens (repo scope).
3. **Configure the App**:
   - Open the **Sync & Settings** panel in HAJIMI.
   - Select your provider and enter your Username, Repo Name, and Token.
   - Save the configuration and click **Sync Now**.

## IV. FAQ and Alternatives

1. **What if I don't have a GitHub account?**
   - Option 1: Use CNB. It provides excellent connectivity and a professional environment for developers in various regions.
   - Option 2: Standalone Mode. Use the app without any cloud configuration; data remains in your browser's local storage.
   - Option 3: Manual Export. Regularly download your data using the "Export Backup (JSON)" feature for manual storage.

2. **How to import bookmarks from a browser?**
   - Export your bookmarks as an HTML file from Chrome, Edge, or Firefox, then use the "Import from Browser (HTML)" tool in HAJIMI.

## V. Technical Stack

1. **Framework**: React 19, TypeScript
2. **Styling**: Tailwind CSS
3. **Icons**: Lucide React
4. **Storage Protocol**: Git REST API (OpenAPI)