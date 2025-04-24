
# 🛡️ Privora-GUI

**Privora** is a secure, privacy-focused chat application.  
This repository contains the **frontend user interface**, built with **React**, **TypeScript**, and **Tailwind CSS**, and designed to run inside a Docker container.

The backend is a hybrid system built in **C** and **Python Flask** (managed separately).

---

## 📦 About the Project

This is the graphical user interface (GUI) for the Privora chat app, focusing on:

- 💬 Secure messaging
- ⚛️ Modern UI with React
- 🎨 Tailwind-powered styling
- 🐳 Seamless Docker-based development

---

## 🔄 Clone the Repository

To clone the project to your local machine, run the following command:

```bash
git clone https://github.com/med1001/Privora-GUI
```

Then navigate into the project directory:

```bash
cd privora-gui
```

---

## 🐳 Getting Started with Docker

### 1. Build the Docker Image

```bash
docker build -t privora-gui .
```

### 2. Run the Container

```bash
docker run -p 3000:3000 privora-gui
```

Then open your browser at:  
👉 [http://localhost:3000](http://localhost:3000)

---

## 🔁 Live Coding / Dev Mode

To enable hot reload while you code:

```bash
docker run -p 3000:3000   -v ${PWD}:/app   -v /app/node_modules   privora-gui
```

This lets you:
- Edit code on your host machine
- See changes live in the browser
- Avoid issues with `node_modules` being overwritten

---

## 🗂️ Project Structure

```
Privora-GUI/
├── LICENSE               # Project license
├── README.md             # This documentation file
├── node_modules/         # Installed dependencies (ignored by Git)
├── package-lock.json     # NPM lock file to ensure consistent installs
├── package.json          # Project dependencies and scripts
├── postcss.config.js     # PostCSS configuration (used by Tailwind CSS)
├── public/               # Public static files (e.g., index.html, favicon)
├── src/                  # React source code (components, hooks, etc.)
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
```

---

## 🔙 Backend Repository

You can find the backend source code here:  
👉 [Privora Backend (C + Flask)](https://github.com/med1001/Privora)

---

## 🖼️ Screenshots

### 🔐 Authentication Page

![Login Screenshot](screenshots/login.png)

### 💬 Chat Interface

![Chat Screenshot](screenshots/chat.png)

> To be done : place screenshots in a `screenshots/` folder inside the root directory and name them `login.png` and `chat.png`.

---

## 🛠️ Backend Overview

The backend for Privora is built separately using:

- 🐍 Python Flask — handles **authentication** and **account creation**
- ⚙️ C — powers the **core messaging engine**

> This frontend communicates with the backend ** via WebSockets** .

---

## 📄 License

GNU General Public License v3.0 — see the [LICENSE](./LICENSE) file.
