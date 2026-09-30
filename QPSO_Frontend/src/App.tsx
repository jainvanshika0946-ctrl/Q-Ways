import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Overview } from './pages/Overview';
import { BulkOrders } from './pages/BulkOrders';
import { Network } from './pages/Network';
import { Optimizer } from './pages/Optimizer';
import { Results } from './pages/Results';
import { Convergence } from './pages/Convergence';
import { Benchmark } from './pages/Benchmark';
import { Formulation } from './pages/Formulation';
import { Deliverables } from './pages/Deliverables';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="orders" element={<BulkOrders />} />
          <Route path="network" element={<Network />} />
          <Route path="optimizer" element={<Optimizer />} />
          <Route path="results" element={<Results />} />
          <Route path="convergence" element={<Convergence />} />
          <Route path="benchmark" element={<Benchmark />} />
          <Route path="formulation" element={<Formulation />} />
          <Route path="deliverables" element={<Deliverables />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
