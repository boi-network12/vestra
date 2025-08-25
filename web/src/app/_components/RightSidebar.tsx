"use client";
import { Trend } from '@/types/trend'
import React from 'react'

interface RightSidebarProps {
  trends: Trend[];
}

export default function RightSidebar({ trends }: RightSidebarProps) {
  
  return (
    <aside className="hidden lg:block w-80 bg-white shadow-md p-4 fixed right-0 h-full">
      <h2 className="text-lg font-semibold mb-4">Trends</h2>
      <ul>
        {trends.map((trend) => (
          <li key={trend.topic} className="mb-3">
            <div className="text-gray-700">
              <p className="font-medium">{trend.topic}</p>
              <p className="text-sm text-gray-500">{trend.posts} posts</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
