import LottieView from 'lottie-react-native'
import { heightPercentageToDP as hp } from "react-native-responsive-screen"

const CustomRefreshControl = ({ refreshing }) => (
    refreshing ? (
        <LottieView
            source={require('../../assets/animations/refreshingBot.json')}
            autoPlay
            loop
            style={{ height: hp(10) }}
        />
    ) : null
)

export default CustomRefreshControl