# Quantum-Inspired Traffic Route Optimization

A smart logistics route optimization system designed to optimize delivery routes using a **Quantum-inspired Particle Swarm Optimization (QPSO)** approach.

The system considers traffic conditions, fleet constraints, geographic locations, bulk delivery orders, and real-world travel-time feedback to improve route planning.

## Features

- 🚚 **Route Optimization** using QPSO
- 🌍 **Geographic Area & Location Configuration**
- 📍 **User/Depot Location & Destination**
- 🚦 **Traffic Mode & Traffic Settings**
- ⏱️ **Time Feedback** — compares expected vs actual travel time
- 💰 **Cost Impact Analysis** based on time deviation
- 📦 **Bulk Order Generation** for multiple delivery locations
- ⚙️ **Advanced QPSO Parameters** for algorithm configuration
- 🚛 **Fleet Size & Vehicle Capacity** configuration
- 📊 **Route & Optimization Visualization**
- 📁 **CSV Import/Export** for bulk orders and network data

## Tech Stack

- **Frontend:** React
- **Styling:** Existing project UI framework
- **Optimization:** QPSO
- **Data:** JSON / CSV
- **Backend:** Integration-ready

## Project Workflow

The system generates or accepts a road network and delivery orders, applies traffic and fleet constraints, and uses QPSO to generate optimized delivery routes.

Actual travel-time feedback can be recorded and used for future re-optimization.

## Project Structure

```text
src/
├── components/
├── pages/
├── services/
├── data/
└── ...
