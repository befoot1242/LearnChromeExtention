# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an English learning vocabulary Chrome extension project. The extension allows users to select words on web pages and save them to create a personal vocabulary book.

## Language and Communication

- Always respond and communicate in Japanese (日本語) when working on this project
- The user prefers Japanese for all explanations and discussions

## Chrome Extension Development

When developing Chrome extensions in this repository:

- Chrome extensions require a `manifest.json` file as the entry point
- Common file structure includes:
  - `manifest.json` - Extension configuration and permissions
  - `popup.html/popup.js` - For browser action popups
  - `content.js` - For content scripts that interact with web pages
  - `background.js` - For background scripts and service workers
  - `options.html/options.js` - For extension options pages
  - `assets/` or `icons/` - For extension icons and other assets

## Development Workflow

Since this is a learning project without existing build tools:

- Test extensions by loading them unpacked in Chrome's Extensions page (chrome://extensions/)
- Enable Developer mode and use "Load unpacked" to test local changes
- Use browser developer tools for debugging content scripts and popups
- Use Chrome's extension developer tools for background script debugging

## Extension Architecture

Chrome extensions typically follow these patterns:

- **Content Scripts**: Run in the context of web pages, can access and modify DOM
- **Background Scripts**: Run in the extension's background, handle events and cross-page functionality  
- **Popup Scripts**: Handle user interface in extension popups
- **Options Pages**: Provide settings and configuration interfaces

## Permissions and Security

- Always use minimal permissions required in manifest.json
- Follow Chrome's security best practices for content security policy
- Be cautious with permissions like "activeTab", "tabs", "storage", etc.

## Documentation Guidelines

- Detailed feature descriptions and usage instructions should be documented in README.md
- README.md serves as the primary documentation for users and developers
- Include comprehensive feature explanations, step-by-step usage guides, and technical details in README.md