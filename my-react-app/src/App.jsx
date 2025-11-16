import React from 'react'
import AttributeBuilder from './components/AttributeBuilder'

export default function App(){
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Advanced Cake Attribute Management</h1>
        </header>
        <AttributeBuilder />
      </div>
    </div>
  )
}
