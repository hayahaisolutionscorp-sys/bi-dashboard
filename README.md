# Ayahay BI Dashboard

A comprehensive Business Intelligence dashboard built with Next.js 15, designed for real-time monitoring and analysis of maritime operations. This dashboard provides deep insights into sales, expenses, cargo, passengers, and fleet status through interactive visualizations and mapping.

## 🚀 Features

- **Multi-Tenant Architecture**: Dynamic dashboard routing based on tenant slugs.
- **Real-Time Analytics**: 
  - **Sales Overview**: Revenue trends, route performance, and vessel breakdowns.
  - **Expense Tracking**: Detailed reports on operational costs with Excel export capabilities.
  - **Logistics Insights**: Cargo and passenger analytics per trip.
- **Interactive Mapping**: Geographic visualization of routes and vessel status using MapLibre GL and React Map GL.
- **Advanced Exporting**: Server-side generated Excel reports and templates using ExcelJS.
- **Progressive Web App (PWA)**: Optimized for mobile and desktop usage with offline capabilities.
- **Premium UI**: Built with Tailwind CSS 4, Shadcn/UI, and Radix UI components for a modern, responsive experience.
- **Dynamic Charting**: High-performance data visualization using Recharts and Shadcn UI.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Mapping**: [MapLibre GL](https://maplibre.org/), [React Map GL](https://visgl.github.io/react-map-gl/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Linting & Formatting**: [Biome](https://biomejs.dev/)
- **Utilities**: [Date-fns](https://date-fns.org/), [ExcelJS](https://github.com/exceljs/exceljs)

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- `pnpm` (Preferred) or `npm`

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ayahay-bi-dashboard
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3002
   ```

### Running Locally

To start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3005`.

## 📂 Project Structure

- `/app`: Next.js App Router (Layouts, Pages, and API handling).
- `/components`: Reusable UI components (Dashboard widgets, Charts, Maps).
- `/services`: API integration layer for various biological reports.
- `/hooks`: Custom React hooks for data fetching and UI state management.
- `/lib`: Utility functions (Formatting, Export helpers).
- `/constants`: Global configuration and API endpoints.
- `/types`: TypeScript interfaces and type definitions.

## 📊 Reporting Modules

- **Dashboard Overview**: Summary of revenue, trips, and trends.
- **Sales Report**: Route-specific revenue and comparison trends.
- **Expenses Report**: Detailed financial breakdown with period filtering.
- **Vessel Tracking**: Real-time status and performance of the fleet.
- **Cargo/Passenger Reports**: Operational efficiency per trip.
- **Route Map**: Visual representation of maritime lanes.

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---
© 2026 Ayahay Technologies. All rights reserved.