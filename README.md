# Vestra Monorepo

Welcome to the **Vestra** monorepo! This repository brings together the full-stack components of the Vestra project — a modern web and mobile banking solution.

## 📦 Structure

This monorepo contains three main parts:


Each of these folders was originally a standalone GitHub repository. They have now been merged into a single monorepo to simplify collaboration and deployment while preserving their commit histories.

---

## 🔧 About Vestra

**Vestra** is a secure and user-friendly digital banking platform designed for seamless financial transactions. It includes:

- 💻 **Web App** for browser access  
- 📱 **Mobile App** for Android & iOS users  
- 🔐 **Backend API** with user authentication, transactions, and database operations  

---

## ⚙️ Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React.js, Tailwind CSS        |
| Mobile    | React Native (with Expo)      |
| Backend   | Node.js, Express, MongoDB     |
| Auth      | Firebase / JWT                |
| Hosting   | Vercel, Render, or custom     |

---

## 📁 Individual Repositories (Before Merge)

- [vestra-web](https://github.com/boi-network12/vestra-web)
- [vestra-app](https://github.com/boi-network12/vestra-app)
- [vestra-backend](https://github.com/boi-network12/vestra-backend)

These are now consolidated here for easier management.

---

## 🚀 Getting Started

```bash
git clone https://github.com/boi-network12/vestra.git
cd vestra

# Example: Run the backend
cd backend
npm install
npm run dev
