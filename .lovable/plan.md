

# 🎮 3D Gaming Lounge — Full Web Application

## Overview
A premium, cyberpunk-themed gaming lounge website with 3D animated hero, slot booking system, food ordering, and an admin dashboard. Built with React, Three.js for lightweight 3D effects, and Supabase for backend.

---

## 🎨 Theme & Design System
- **Dark cyberpunk base** with neon blue (#00d4ff) and purple (#a855f7) glow accents
- **Glassmorphism cards** with frosted glass effect and subtle neon borders
- **Neon glow buttons** with pulse animations on hover
- **Custom neon cursor glow** that follows mouse movement
- **Smooth scroll behavior** and page transitions throughout

---

## 🏠 Page 1: Landing Page

### Hero Section
- Lightweight 3D animated background using React Three Fiber (floating geometric shapes, particles)
- Subtle camera sway that responds to mouse movement
- Large floating headline with typewriter/glow animation: "Welcome to [Lounge Name]"
- Animated CTA button ("Book Now") with neon glow pulse

### Games Section
- Grid of game cards (e.g., Valorant, CS2, Fortnite, FIFA, etc.)
- Each card has a **3D tilt effect on hover** using CSS transforms
- Neon border glow on hover
- Clicking a card opens a **slot booking modal** with fade-in animation

### Food & Drinks Section
- Animated category filter (Snacks, Drinks, Combos)
- Cards with hover zoom effect
- "Add to Cart" button with micro-animation
- Slide-in cart panel from right side

### Footer
- Social links, contact info, lounge hours
- Background music toggle button (optional ambient track)

---

## 📅 Page 2: Booking System

### Slot Grid
- Visual grid showing 5-10 gaming stations
- Each station shows time slots (hourly blocks)
- **Available slots** glow green with neon effect
- **Booked slots** appear greyed out
- Clicking an available slot opens confirmation modal
- Smooth booking confirmation animation with loading spinner
- Users must be logged in to book

---

## 🛒 Cart & Checkout
- Cart slides in from the right with smooth animation
- Shows booked slots + food items with animated price counter
- Checkout button with glowing neon effect
- Success confirmation animation on order completion
- Orders stored in Supabase

---

## 🔐 Authentication
- Sign up / Login pages with email + password (Supabase Auth)
- User profiles to track booking history
- Protected routes for booking and cart

---

## 🛠️ Admin Panel (at `/admin`)
- Dark-themed dashboard with animated stat cards
- **Live booking counter** showing today's bookings
- **Notification bell** with pulse animation for new bookings
- Manage gaming stations (add/edit/remove)
- View & manage all bookings (table with smooth row animations)
- Manage food menu items (CRUD)
- View orders
- Admin role enforced via Supabase `user_roles` table

---

## 🗄️ Backend (Supabase)
- **Tables**: profiles, user_roles, gaming_stations, time_slots, bookings, food_items, food_categories, cart_items, orders
- **RLS policies** on all tables for security
- **Admin role** checked via `has_role()` security definer function
- Real-time updates for slot availability

---

## ⚡ Performance Strategy
- 3D scene limited to hero section only (no full-page 3D)
- Particle count kept low (~50-100 particles)
- No heavy 3D models — only geometric primitives
- Lazy loading for sections below the fold
- Optimized animations using CSS transforms (GPU-accelerated)
- Mobile: simplified effects, reduced particles

