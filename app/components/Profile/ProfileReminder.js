import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { heightPercentageToDP as hp , widthPercentageToDP as wp } from "react-native-responsive-screen";
import { FontAwesome6 } from '@expo/vector-icons';

const withOpacity = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function ProfileReminder({ user, colors }) {
    if (!user) return null;

    const _boxReminder = [
        {
            title: "Follow 10 profiles",
            desc: "Fill your feed with things that interest you",
            buttonTitle: user?.following?.length >= 10 ? "Done" : "See Profiles",
            completed: user?.following?.length >= 10,
            icon: user?.following?.length >= 10 ? "circle-check" : "user-plus"
        },
        {
            title: "Create post",
            desc: "Share your thoughts and experiences",
            buttonTitle: user?.posts?.length > 0 ? "Done" : "Create Post",
            completed: user?.posts?.length > 0,
            icon: user?.posts?.length > 0 ? "circle-check" : "plus"
        },
    ];

    return (
        <View style={styles.container}>
            <Text style={[{ color: colors.subText, marginBottom: hp(1) }]}>Finish your profile</Text>

            <ScrollView 
               horizontal
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={styles.boxDisplay}
               >
                {_boxReminder.map((item, index) => (
                    <View
                       key={index}
                       style={[
                         styles.reminderBox,
                         { backgroundColor: colors.card }
                       ]}
                    >
                        <View
                            style={[
                                styles.iconWrapper,
                                { backgroundColor: withOpacity(colors.background, 5) }
                            ]}
                        >
                            <FontAwesome6
                                name={item.icon}
                                size={hp(2.5)}
                                color={item.completed ? colors.text : colors.text}
                            />
                        </View>


                            <Text style={[styles.SubTitle, { color: colors.text }]}>{item.title}</Text>

                            <Text style={[styles.Desc, { color: colors.subText }]}>{item.desc}</Text>


                        {item.completed ? (
                            <View
                               style={[styles.doneButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            >
                                <Text style={[styles.doneButtonText, { color: colors.subText || "#888" }]}>
                                    {item.buttonTitle}
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity 
                              onPress={() => console.log(`Navigate to: ${item.title}`)}
                              style={[styles.actionButton, { backgroundColor: colors.text }]}
                            >
                                <Text style={[styles.actionButtonText, { color: colors.background }]}>
                                    {item.buttonTitle}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: wp(3.5),
    },
    boxDisplay: {
        flexDirection: "row",
        marginTop: hp(2),
        gap: hp(1.5)
    },
    iconWrapper: {
        width: hp(6),
        height: hp(6),
        borderRadius: hp(3),
        alignItems: "center",
        justifyContent: "center",
    },
    reminderBox: {
        padding: hp(2),
        flexDirection: "column",
        gap: hp(2.5),
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        maxWidth: wp(45),
        height: hp(28),
        borderRadius: wp(3),
    },
    SubTitle: {
        fontSize: hp(1.8),
        fontWeight: "500",
        textAlign: "center"
    },
    Desc: {
        fontSize: hp(1.5),
        fontWeight: "400",
        textAlign: "center"
    },
    doneButton: {
        borderWidth: 1,
        width: '100%',
        padding: hp(1),
        borderRadius: wp(2),
        alignItems: "center",
        justifyContent: "center"
    },
    actionButton: {
        width: '100%',
        padding: hp(1),
        borderRadius: wp(2),
        alignItems: "center",
        justifyContent: "center"
    },
    actionButtonText: {
        fontWeight: "500",
        fontSize: hp(1.65)
    }
});
