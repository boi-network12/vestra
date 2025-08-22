"use client";
// constants/SettingsSections.ts
import { ComponentType } from 'react';

// Placeholder for AccountSettings (replace with your actual component)
const AccountSettings: ComponentType = () => (
  <div className="p-4">
    <h3 className="text-lg font-semibold">Account Settings</h3>
    <p className="text-gray-600">Manage your account details here.</p>
  </div>
);

export type SettingsItem = {
  id: string;
  title: string;
  component?: ComponentType;
};

export type SettingsSection = {
  title: string;
  data: SettingsItem[];
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'Account & Privacy',
    data: [
      { id: '2', title: 'Account Settings', component: AccountSettings },
      { id: '3', title: 'Account' },
      { id: '4', title: 'Notification and Discovery' },
      { id: '5', title: 'Connection and Discovery' },
      { id: '6', title: 'Content Filters' },
      { id: '7', title: 'Privacy Settings' },
      { id: '8', title: 'Privacy' },
      { id: '9', title: 'Data' },
    ],
  },
  {
    title: 'App Preferences',
    data: [
      { id: '10', title: 'App Settings' },
      { id: '11', title: 'Accessibility' },
      { id: '12', title: 'Language' },
    ],
  },
  {
    title: 'Support & Feedback',
    data: [
      { id: '13', title: 'Support' },
      { id: '14', title: 'Feedback' },
      { id: '15', title: 'Help Center' },
    ],
  },
  {
    title: 'Account Management',
    data: [
      { id: '16', title: 'Logins' },
      { id: '17', title: 'Add account' },
    ],
  },
];