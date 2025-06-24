const connectDb = require("../config/db");
const User = require("../models/User");
const UserHistory = require("../models/UserHistory");
const cron = require("node-cron");


async function permanentDeleteUsers() {
    try {
        await connectDb();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const usersToDelete = await User.find({
            isDeleted: true,
            deletedAt: { $lte: thirtyDaysAgo }
        });

        for (const user of usersToDelete) {
            // Delete user from the database
            await UserHistory.deleteMany({ userId: user._id });
            await User.deleteOne({ _id: user._id });
            console.log(`Permanently deleted user: ${user.email}`);
        }

      console.log(`Permanent deletion job completed. Processed ${usersToDelete.length} users.`);
    } catch (err) {
        console.error('Permanent deletion job error:', err);
    }
}

const schedulePermanentDelete = () => {
    cron.schedule('0 0 * * *', permanentDeleteUsers, {
        scheduled: true,
        timezone: "America/New_York" // Adjust to your preferred timezone
    })
    console.log("Scheduled permanent deletion job to run daily at midnight.");
}

module.exports = { schedulePermanentDelete }