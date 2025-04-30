import React from 'react'
import {  Route, Routes } from 'react-router-dom'
import Login from './components/Login';
import Applayout from './applayout/Applayout';
const App = () => {
  return (
    
      <Routes >
      <Route path="/" element={<Login />} />
      <Route path='/*' element={<Applayout />} />
      </Routes>
  )
}

export default App