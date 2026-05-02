import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PKfitShare from './App.jsx';
import Hub from './Hub.jsx';
import ClientDetail from './ClientDetail.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PKfitShare />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/c/:clientId" element={<ClientDetail />} />
        <Route path="*" element={<PKfitShare />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
