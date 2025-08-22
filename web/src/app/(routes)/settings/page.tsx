"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IoChevronForward } from "react-icons/io5";
import {
  SETTINGS_SECTIONS,
  SettingsItem,
  SettingsSection,
} from "@/constant/SettingsSections";

const SearchHeader: React.FC<{
  searchText: string;
  setSearchText: (text: string) => void;
}> = React.memo(function SearchHeader({ searchText, setSearchText }) {
  return (
    <div className="px-4 py-4 border-b border-gray-200">
      <input
        type="text"
        placeholder="Search"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 text-gray-900 placeholder-gray-500"
      />
    </div>
  );
});

const Settings = () => {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SettingsItem | null>(null);

  const filteredSections = useMemo(() => {
    if (!searchText.trim()) return SETTINGS_SECTIONS;
    const query = searchText.toLowerCase();
    return SETTINGS_SECTIONS.map((section: SettingsSection) => ({
      ...section,
      data: section.data.filter((item: SettingsItem) =>
        item.title.toLowerCase().includes(query)
      ),
    })).filter((section: SettingsSection) => section.data.length > 0);
  }, [searchText]);

  const handleItemClick = (item: SettingsItem) => {
    if (window.innerWidth >= 1024) {
      // Desktop: Just show on right panel
      setSelectedItem(item);
    } else {
      // Mobile: Open in modal
      setSelectedItem(item);
      setModalVisible(true);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Sidebar for Desktop */}
      <div className="lg:w-1/3 lg:border-r border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sm:px-6 md:px-8">
          <button
            onClick={() => router.back()}
            className="text-lg text-gray-900 hover:text-blue-500"
          >
            Back
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <div className="w-12" />
        </div>

        {/* Search */}
        <SearchHeader searchText={searchText} setSearchText={setSearchText} />

        {/* List */}
        <div className="px-4 py-2 sm:px-6 md:px-8 overflow-y-auto">
          {filteredSections.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No results found
            </div>
          ) : (
            filteredSections.map((section: SettingsSection) => (
              <div key={section.title} className="mb-4">
                <div className="py-2 px-4 sticky top-0 bg-white">
                  <h2 className="text-sm font-semibold uppercase text-gray-500">
                    {section.title}
                  </h2>
                </div>
                {section.data.map((item: SettingsItem) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-3 px-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <span className="text-gray-900">{item.title}</span>
                    <IoChevronForward size={20} color="#111111" />
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Content Area for Desktop */}
      <div className="hidden lg:flex flex-1 p-6">
        {selectedItem ? (
          selectedItem.component ? (
            <selectedItem.component />
          ) : (
            <p className="text-gray-900">No content available</p>
          )
        ) : (
          <p className="text-gray-500">Select a setting to view details</p>
        )}
      </div>

      {/* Mobile Modal */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 lg:hidden">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button
                onClick={() => setModalVisible(false)}
                className="text-gray-900 hover:text-blue-500"
              >
                Back
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedItem?.title}
              </h2>
              <div className="w-12" />
            </div>
            <div className="p-4">
              {selectedItem && selectedItem.component ? (
                <selectedItem.component />
              ) : (
                <p className="text-gray-900">No content available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
