import { FriendContext } from "@/context/FriendContext";
import { useContext } from "react"

export const useFriends = () => {
    const context = useContext(FriendContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context;
}