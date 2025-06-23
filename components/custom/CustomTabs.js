import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function CustomTabs({ state, colors }) {
    const activeRouteName = state.routes[state.index].name;

    const hiddenRoutes = [
        'post',
    ];

    const shouldHideTabs = hiddenRoutes.some(
        (route) => activeRouteName === route || activeRouteName.startsWith(`${route}/`)
    );

    if (shouldHideTabs) {
        return null;
    }

    

    const tabs = [
        {
            name: 'home',
            title: 'home',
            icon: 'layers-outline',
            activeIcon: 'layers'
        },
        {
            name: 'categories',
            title: 'categories',
            icon: 'filter-circle-outline',
            activeIcon: 'filter-circle'
        },
        {
            name: 'post',
            title: 'post',
            icon: 'add-circle-outline',
            activeIcon: 'add-circle'
        },
        {
            name: 'message',
            title: 'message',
            icon: 'file-tray-full-outline',
            activeIcon: 'file-tray-full'
        },
        {
            name: 'profile',
            title: 'profile',
            icon: 'person-outline',
            activeIcon: 'person-circle'
        },
    ];

    

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {tabs.map((tab) => {
        const isActive  = 
           activeRouteName === tab.name || 
           activeRouteName.startsWith(`${tab.name}/`);

        return (
            <TouchableOpacity
               key={tab.name}
               style={styles.tab}
               onPress={() => router.push(`/${tab.name}`)}
               activeOpacity={0.7}
            >
                <View style={[styles.tabContent, isActive && styles.activeTabContent]}>
                    <Ionicons
                       name={isActive ? tab.activeIcon : tab.icon }
                       size={hp(2.8)}
                       color={isActive ? colors.primary : colors.subText}
                    />
                    <View
                        style={[
                            styles.indicator,
                            isActive && { backgroundColor: colors.primary }
                        ]}
                        />
                </View>
            </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row", 
        justifyContent: "space-around",
        height: hp(9),
        alignItems: "flex-start",
        paddingTop: hp(1.7),
    },
    indicator: {
        height: hp(0.15),
        width: hp(3),
        borderRadius: hp(1),
        marginTop: 4,
        backgroundColor: 'transparent',
    },
})