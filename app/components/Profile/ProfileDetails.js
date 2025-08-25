import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using expo-vector-icons
import { Image } from 'expo-image';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  const withOpacity = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };


export default function ProfileDetails({ user, colors, onClickEditBtn, openInAppBrowser }) {


  const fullName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`;
  const dynamicFontSize = fullName.length > 20 ? hp(2) : hp(2.5);


  return (
    user && (
      <View style={ [styles.container, { }]}>
        <View style={[styles.ProfileDetails, {}]}>
          <View style={styles.namesContainer}>
            <Text style={[styles.nameText, { color: colors.text, fontSize: dynamicFontSize }]}>
              {fullName}
            </Text>
            <Text style={[styles.usernameText, { color: colors.subText }]}>
              @{user?.username}
            </Text>
          </View>
          <Image
             style={styles.avatar}
             source={{ uri: user?.profile?.avatar || 'https://picsum.photos/seed/696/3000/2000' }}
             placeholder={{ blurhash }}
             contentFit='cover'
             transition={1000}
          />
        </View>
        {/* bio and links */}
        <View style={styles.bioContainer}>
          <Text style={[ styles.bioText, { color: colors.text }]}>
            {user?.profile?.bio || (<Text style={[styles.bioText, { color: colors.subText }]}>No bio available</Text>)}
          </Text>

          {/* follow link */}
          <View style={styles.followLink}>
            <TouchableOpacity>
              <Text style={[ { color: colors.subText, fontSize: hp(1.6) }]}>
                 {user?.followers?.length || 0} followers
              </Text>
            </TouchableOpacity>
            <Ionicons name="ellipse" size={hp(0.2)} color={colors.subText} />  
            
            {user?.profile?.links?.[0]?.title && user?.profile?.links?.[0]?.url ? (
                <TouchableOpacity
                  onPress={() => {
                    if (openInAppBrowser) {
                      openInAppBrowser(user.profile.links[0].url);
                    } else {
                      console.warn('InAppBrowser is not available');
                    }
                  }}
                >
                  <Text style={{ color: colors.subText, fontSize: hp(1.6) }}>
                    {user.profile.links[0].title}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={{ color: colors.subText }}>No link</Text>
              )}

          </View>

          <View style={styles.btnContainer}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.background, borderColor: withOpacity(colors.subText, 0.4) }]}
              onPress={onClickEditBtn}
            >
              <Text style={[styles.profileBtnText, { color: colors.text }]}>
                Edit profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.background, borderColor: withOpacity(colors.subText, 0.4) }]}
            >
              <Text style={[styles.profileBtnText, { color: colors.text }]}>
                Share profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  ProfileDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  namesContainer: {},
  avatar: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    overflow: 'hidden',
  },
  nameText: {
    fontWeight: "600"
  },
  usernameText: {
    fontSize: hp(1.8),
    fontWeight: "400"
  },
  bioContainer: {
    flexDirection: 'column',
  },
  followLink: {
    flexDirection: "row",
    alignItems: "center",
     justifyContent: "flex-start",
     gap: wp(2),
     marginTop: wp(2),
  },
  btnContainer: {
    flexDirection: "row",
    marginTop: hp(3),
    alignItems: "center",
    justifyContent: "space-between",
  },
  btn: {
    borderWidth: 1,
    borderRadius: wp(4),
    width: wp(44),
    height: hp(5),
    alignItems: "center",
    justifyContent: "center",
  }
});