import { Tabs } from 'expo-router';
import CustomTabs from '../../components/custom/CustomTabs';
import { useTheme } from '../../context/ThemeContext';
import { getThemeColors } from '../../utils/theme';

export default function TabsLayout() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <Tabs
      tabBar={(props) => <CustomTabs {...props} colors={colors} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen name="home/index" />
      <Tabs.Screen name="categories/index" />
      <Tabs.Screen name="post/index" />
      <Tabs.Screen name="message/index" />
      <Tabs.Screen name="profile/index" />
    </Tabs>
  );
}