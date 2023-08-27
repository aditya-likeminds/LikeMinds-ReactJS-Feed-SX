import React, { useState } from 'react';
import './App.css';
import FeedComponent from './pages/Feed/Feed';
import Header from './components/Header';
import Nav from './components/Nav';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PostDetails from './components/post-details';
function App() {
  const [callback, setCallBack] = useState<() => void | null>(null);
  return (
    <div>
      <div className="header">
        <Header />
      </div>
      <section className="mainBlock">
        <div className="nav">
          <Nav />
        </div>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <div className="main">
                  <FeedComponent />
                </div>
              }
            />
            <Route
              path="/post"
              element={
                <div className="main">
                  <PostDetails />
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </section>
    </div>
  );
}

export default App;
